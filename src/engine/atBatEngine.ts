import { Player, Position } from "../models/player";
import {
  AtBatOutcome,
  AtBatResult,
  BasesOccupied,
  BaseState,
} from "../models/game";

export interface AtBatSituation {
  bases: BasesOccupied;
  outs: number;
  inning: number;
  scoreDiff: number;  // positive = batting team leading
  pitcherFatigue: number; // 0–100
}

// ──────────────────────────────────────────────
// Seeded RNG (Mulberry32)
// ──────────────────────────────────────────────
let _rngState = 0;
export function seedRng(seed: number) { _rngState = seed >>> 0; }
function rand(): number {
  _rngState = (_rngState + 0x6D2B79F5) >>> 0;
  let z = _rngState;
  z = Math.imul(z ^ (z >>> 15), z | 1);
  z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
  return ((z ^ (z >>> 14)) >>> 0) / 0xffffffff;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// ──────────────────────────────────────────────
// Count simulation (lightweight)
// Returns the final count state as a modifier
// ──────────────────────────────────────────────
interface CountState {
  balls: number;
  strikes: number;
  pitchCount: number;
}

function simulateCount(pitcher: Player, batter: Player): CountState {
  let balls = 0, strikes = 0, pitchCount = 0;
  while (true) {
    pitchCount++;
    // Probability of pitch being a strike or ball based on control/eye
    const strikeProb = 0.45 + (pitcher.ratings.control - 50) * 0.004
      - (batter.ratings.eye - 50) * 0.002;
    const clampedStrikeProb = Math.max(0.30, Math.min(0.70, strikeProb));
    if (rand() < clampedStrikeProb) {
      strikes++;
    } else {
      balls++;
    }
    if (balls === 4) break;
    if (strikes === 3) break;
    if (pitchCount > 12) break; // safety
  }
  return { balls, strikes, pitchCount };
}

// ──────────────────────────────────────────────
// Core at-bat outcome probabilities
// ──────────────────────────────────────────────
interface OutcomeProbabilities {
  hr: number;
  triple: number;
  double: number;
  single: number;
  bb: number;
  hbp: number;
  k: number;   // includes both swing and look
  gidp: number;
  go: number;
  fo: number;
  lo: number;
}

function computeOutcomeProbabilities(
  batter: Player,
  pitcher: Player,
  situation: AtBatSituation,
  count: CountState,
): OutcomeProbabilities {
  const br = batter.ratings;
  const pr = pitcher.ratings;

  // Normalize ratings to 0–1 scale centered at 0.5
  const n = (r: number) => r / 100;

  // ─── Walk probability ───
  let bbRate = 0.08 // base ~8% walk rate
    + (n(br.eye) - 0.5) * 0.12        // +6% for elite eye, −6% for no eye
    - (n(pr.control) - 0.5) * 0.10;   // good control suppresses walks

  // Count modifier
  if (count.balls === 3 && count.strikes <= 1) bbRate *= 2.2;
  else if (count.balls === 3 && count.strikes === 2) bbRate *= 1.5;
  else if (count.strikes === 2 && count.balls <= 1) bbRate *= 0.55;

  // Late-inning close game: pitchers become more careful
  if (situation.inning >= 7 && Math.abs(situation.scoreDiff) <= 2) {
    bbRate *= 1.15;
  }

  bbRate = Math.max(0.02, Math.min(0.28, bbRate));

  // ─── HBP probability ───
  const hbpRate = Math.max(0.005, 0.018 - (n(pr.control) - 0.5) * 0.02);

  // ─── Strikeout probability ───
  let kRate = 0.20
    + (n(pr.velocity) - 0.5) * 0.18   // velocity is biggest K driver
    + (n(pr.movement) - 0.5) * 0.08   // movement adds swing-and-miss
    - (n(br.contact) - 0.5) * 0.16    // contact suppresses Ks
    - (n(br.eye) - 0.5) * 0.06;       // plate discipline helps avoid K-look

  // Fatigue increases K when pitcher is fresh (<30), decreases when tired
  kRate += (30 - situation.pitcherFatigue) * 0.001;

  // Count modifier
  if (count.strikes === 2 && count.balls <= 1) kRate *= 1.35;
  else if (count.balls === 3 && count.strikes <= 1) kRate *= 0.5;

  // RISP protection: contact hitters don't K as much
  const runnersInScoringPosition = situation.bases.second === 1 || situation.bases.third === 1;
  if (runnersInScoringPosition && br.contact >= 60) kRate *= 0.88;

  kRate = Math.max(0.05, Math.min(0.45, kRate));

  // ─── HR probability (only on balls in play, scaled after K/BB/HBP) ───
  const fatigueHrBoost = Math.max(0, situation.pitcherFatigue - 60) * 0.001;
  let hrRate = 0.025
    + (n(br.power) - 0.5) * 0.06
    - (n(pr.velocity) - 0.5) * 0.03
    + fatigueHrBoost;
  if (count.strikes === 0) hrRate *= 1.15; // hitter's count

  hrRate = Math.max(0.005, Math.min(0.12, hrRate));

  // ─── XBH (2B/3B) ───
  let doubleRate = 0.05
    + (n(br.power) - 0.5) * 0.04
    + (n(br.contact) - 0.5) * 0.02
    - (n(pr.movement) - 0.5) * 0.03;
  doubleRate = Math.max(0.02, Math.min(0.12, doubleRate));

  let tripleRate = 0.008
    + (n(br.speed) - 0.5) * 0.012
    - (n(pr.movement) - 0.5) * 0.005;
  tripleRate = Math.max(0.003, Math.min(0.04, tripleRate));

  // ─── Single / BABIP ───
  // BABIP influenced by contact, speed, movement, fielding defense (approximated)
  const babip = 0.300
    + (n(br.contact) - 0.5) * 0.04
    + (n(br.speed) - 0.5) * 0.02
    - (n(pr.movement) - 0.5) * 0.03;

  // After K, BB, HBP are removed, what fraction of remaining PAs become balls-in-play singles?
  const bipSingle = Math.max(0.10, Math.min(0.35, babip - doubleRate - tripleRate - hrRate));

  // ─── Ground/Fly/Line distribution of outs ───
  // High movement → more grounders
  const gbTendency = 0.45 + (n(pr.movement) - 0.5) * 0.20;
  const gidpRate = Math.min(0.08, gbTendency * 0.12
    * (situation.bases.first === 1 && situation.outs < 2 ? 1.5 : 0.3));
  const goRate = Math.max(0.05, gbTendency * 0.35);
  // Remaining contact is FO/LO
  const foRate = 0.10;
  const loRate = 0.05;

  // ─── Normalize ───
  const nonBip = bbRate + hbpRate + kRate;
  // Scale in-play rates to fill remaining probability space
  const bipSpace = Math.max(0, 1 - nonBip);
  const bipTotal = hrRate + tripleRate + doubleRate + bipSingle + gidpRate + goRate + foRate + loRate;
  const bipScale = bipSpace / bipTotal;

  return {
    bb: bbRate,
    hbp: hbpRate,
    k: kRate,
    hr: hrRate * bipScale,
    triple: tripleRate * bipScale,
    double: doubleRate * bipScale,
    single: bipSingle * bipScale,
    gidp: gidpRate * bipScale,
    go: goRate * bipScale,
    fo: foRate * bipScale,
    lo: loRate * bipScale,
  };
}

// ──────────────────────────────────────────────
// Advance baserunners
// ──────────────────────────────────────────────
function advanceBases(
  bases: BasesOccupied,
  outcome: AtBatOutcome,
  speed: number,
): { newBases: BasesOccupied; runsScored: number; rbis: number } {
  let { first, second, third } = bases;
  let runsScored = 0;
  let rbis = 0;

  switch (outcome) {
    case "HR":
      runsScored = 1 + first + second + third;
      rbis = runsScored;
      return { newBases: { first: 0, second: 0, third: 0 }, runsScored, rbis };

    case "3B":
      runsScored = first + second + third;
      rbis = runsScored;
      return { newBases: { first: 0, second: 0, third: 1 }, runsScored, rbis };

    case "2B":
      runsScored = second + third;
      rbis = runsScored;
      // Fast runner on first scores; slow runner goes to third
      if (first === 1) {
        if (speed >= 65) { runsScored++; rbis++; return { newBases: { first: 0, second: 1, third: 0 }, runsScored, rbis }; }
        else return { newBases: { first: 0, second: 1, third: 1 }, runsScored, rbis };
      }
      return { newBases: { first: 0, second: 1, third: 0 }, runsScored, rbis };

    case "1B":
      runsScored = third;
      rbis = third;
      if (second === 1) third = 1; else third = 0;
      if (first === 1) second = 1; else second = 0;
      return { newBases: { first: 1, second: second as BaseState, third: third as BaseState }, runsScored, rbis };

    case "BB":
    case "HBP":
      // Force advances only
      if (third === 1 && second === 1 && first === 1) { runsScored++; rbis++; }
      else if (second === 1 && first === 1) third = 1;
      else if (first === 1) second = 1;
      return { newBases: { first: 1, second: second as BaseState, third: third as BaseState }, runsScored, rbis };

    case "GIDP":
      // Double play — two outs handled in game engine, runner on third may score
      runsScored = third;
      rbis = third;
      return { newBases: { first: 0, second: first as BaseState, third: 0 }, runsScored, rbis };

    default:
      // Out — no base advancement (sac fly handled via FO with runners in play in game engine)
      return { newBases: bases, runsScored: 0, rbis: 0 };
  }
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────
export function simulateAtBat(
  batter: Player,
  pitcher: Player,
  situation: AtBatSituation,
): AtBatResult {
  const count = simulateCount(pitcher, batter);
  const probs = computeOutcomeProbabilities(batter, pitcher, situation, count);

  // Pick outcome via weighted random
  const roll = rand();
  let cumulative = 0;
  const entries: [AtBatOutcome, number][] = [
    ["BB", probs.bb],
    ["HBP", probs.hbp],
    ["K_swing", probs.k * 0.7],
    ["K_look", probs.k * 0.3],
    ["HR", probs.hr],
    ["3B", probs.triple],
    ["2B", probs.double],
    ["1B", probs.single],
    ["GIDP", probs.gidp],
    ["GO", probs.go],
    ["FO", probs.fo],
    ["LO", probs.lo],
  ];

  let outcome: AtBatOutcome = "FO";
  for (const [o, p] of entries) {
    cumulative += p;
    if (roll <= cumulative) { outcome = o; break; }
  }

  const { newBases, runsScored, rbis } = advanceBases(
    situation.bases, outcome, batter.ratings.speed,
  );

  // Approximate exit velocity for balls in play
  let exitVelocity: number | undefined;
  if (!["BB", "HBP", "K_swing", "K_look"].includes(outcome)) {
    const base = 65 + batter.ratings.power * 0.4 + batter.ratings.contact * 0.2;
    exitVelocity = Math.round(base - 20 + rand() * 40);
  }

  return {
    outcome,
    pitchCount: count.pitchCount,
    rbis,
    runsScored,
    newBases,
    exitVelocity,
  };
}

// ──────────────────────────────────────────────
// Batting average / ERA estimation helpers (for display)
// ──────────────────────────────────────────────
export function estimatedBA(batter: Player): number {
  const dummySit: AtBatSituation = {
    bases: { first: 0, second: 0, third: 0 }, outs: 1, inning: 5,
    scoreDiff: 0, pitcherFatigue: 0,
  };
  const avgPitcher = createAveragePitcher();
  const trials = 200;
  let hits = 0;
  for (let i = 0; i < trials; i++) {
    const result = simulateAtBat(batter, avgPitcher, dummySit);
    if (["1B","2B","3B","HR"].includes(result.outcome)) hits++;
  }
  return hits / trials;
}

function createAveragePitcher(): Player {
  return {
    id: "avg", name: "Average", year: "SO", position: "SP",
    bats: "R", throws: "R", potential: 3,
    ratings: { contact:50,power:50,eye:50,speed:50,velocity:55,control:55,movement:50,stamina:60,range:50,arm:50,glove:50 },
    seasonStats: {} as any, careerStats: [], nilDeal: 0,
    isInTransferPortal: false, schoolId: "", injuryWeeksRemaining: 0, redshirted: false,
  };
}

export { rand, randInt, seedRng as seedAtBatRng };
