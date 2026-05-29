import { Player, emptySeasonStats } from "../models/player";
import {
  AtBatOutcome,
  BasesOccupied,
  BoxScore,
  InningHalf,
  LiveGameState,
} from "../models/game";
import { simulateAtBat, AtBatSituation, seedAtBatRng } from "./atBatEngine";

// Run expectancy matrix (24 base-out states), indexed [outs][base_state]
// Approximated from college baseball historical data
// base_state: 0=none, 1=1st, 2=2nd, 3=1&2, 4=3rd, 5=1&3, 6=2&3, 7=loaded
const RE24: number[][] = [
  // 0 outs
  [0.49, 0.88, 1.11, 1.47, 1.35, 1.73, 1.96, 2.33],
  // 1 out
  [0.26, 0.52, 0.67, 0.92, 0.96, 1.19, 1.33, 1.59],
  // 2 outs
  [0.10, 0.22, 0.31, 0.42, 0.35, 0.46, 0.56, 0.66],
];

function baseStateIndex(bases: BasesOccupied): number {
  return bases.first | (bases.second << 1) | (bases.third << 2);
}

function computeFatigue(pitchCount: number, stamina: number): number {
  const threshold = 20 + stamina * 0.8; // ~60 for avg starter with 50 stamina
  if (pitchCount <= threshold) return 0;
  return Math.min(100, (pitchCount - threshold) * 1.5);
}

function applyFatigueToRatings(
  pitcher: Player,
  fatigueLevel: number,
): Player {
  if (fatigueLevel <= 0) return pitcher;
  const factor = fatigueLevel / 100;
  return {
    ...pitcher,
    ratings: {
      ...pitcher.ratings,
      velocity: Math.max(30, pitcher.ratings.velocity - factor * 20),
      movement: Math.max(25, pitcher.ratings.movement - factor * 30),
      control: Math.max(20, pitcher.ratings.control - factor * 40),
    },
  };
}

function simulateInningHalf(
  batters: Player[],      // full lineup (9 players), cycling
  pitcher: Player,
  lineupSpot: number,     // which batter we start on (0–8)
  pitcherPitchCount: number,
  pitcherFatigue: number,
  inning: number,
  scoreDiff: number,      // from batting team perspective
): {
  half: InningHalf;
  newLineupSpot: number;
  totalPitches: number;
  newFatigue: number;
} {
  let outs = 0;
  let runs = 0;
  let hits = 0;
  let errors = 0;
  let bases: BasesOccupied = { first: 0, second: 0, third: 0 };
  let spot = lineupSpot;
  let totalPitches = pitcherPitchCount;
  const atBats = [];

  while (outs < 3) {
    const batter = batters[spot % 9];
    const fatigue = computeFatigue(totalPitches, pitcher.ratings.stamina);
    const tiredPitcher = applyFatigueToRatings(pitcher, fatigue);

    const situation: AtBatSituation = {
      bases,
      outs,
      inning,
      scoreDiff,
      pitcherFatigue: fatigue,
    };

    const result = simulateAtBat(batter, tiredPitcher, situation);
    totalPitches += result.pitchCount;

    // Handle GIDP (counts as two outs)
    if (result.outcome === "GIDP" && outs < 2) {
      outs += 2;
    } else if (!["1B","2B","3B","HR","BB","HBP"].includes(result.outcome)) {
      outs++;
    }

    // Sac fly check: FO with runner on third and < 2 outs
    if (result.outcome === "FO" && bases.third === 1 && outs <= 2) {
      runs++;
      bases = { ...bases, third: 0 };
    }

    runs += result.runsScored;
    if (["1B","2B","3B","HR"].includes(result.outcome)) hits++;
    bases = result.newBases as BasesOccupied;
    scoreDiff += result.runsScored;

    atBats.push(result);
    spot = (spot + 1) % 9;
  }

  return {
    half: { atBats, runs, hits, errors },
    newLineupSpot: spot,
    totalPitches,
    newFatigue: computeFatigue(totalPitches, pitcher.ratings.stamina),
  };
}

export interface TeamLineup {
  schoolId: string;
  lineup: Player[];  // 9 position players in batting order
  startingPitcher: Player;
  bullpen: Player[]; // relief pitchers in order
}

export interface GameResult {
  boxScore: BoxScore;
  homeStats: Record<string, Partial<ReturnType<typeof emptySeasonStats>>>;
  awayStats: Record<string, Partial<ReturnType<typeof emptySeasonStats>>>;
}

function shouldChangePitcher(
  pitchCount: number,
  fatigue: number,
  inning: number,
  scoreDiff: number, // from pitching team's perspective (negative = losing)
  bullpenAvailable: boolean,
): boolean {
  // Pull starter if: exhausted OR past 100 pitches and past inning 6
  if (fatigue >= 80) return true;
  if (pitchCount >= 100 && inning >= 7) return true;
  if (pitchCount >= 115) return true;
  // In a blowout (down by 5+), save the good reliever
  return false;
}

export function simulateGame(
  home: TeamLineup,
  away: TeamLineup,
  seed?: number,
): GameResult {
  if (seed !== undefined) seedAtBatRng(seed);

  const innings: BoxScore["innings"] = [];
  let homeScore = 0, awayScore = 0;
  let homeLineupSpot = 0, awayLineupSpot = 0;
  let homePitchCount = 0, awayPitchCount = 0;
  let homeFatigue = 0, awayFatigue = 0;
  let homePitcherIdx = 0, awayPitcherIdx = 0;

  const homeStatAccum: Record<string, any> = {};
  const awayStatAccum: Record<string, any> = {};

  const accumulateHitter = (accum: Record<string, any>, player: Player, result: any) => {
    if (!accum[player.id]) accum[player.id] = { pa:0,ab:0,h:0,singles:0,doubles:0,triples:0,hr:0,rbi:0,r:0,bb:0,hbp:0,k:0 };
    const s = accum[player.id];
    s.pa++;
    if (!["BB","HBP"].includes(result.outcome)) s.ab++;
    if (result.outcome === "1B") { s.h++; s.singles++; }
    else if (result.outcome === "2B") { s.h++; s.doubles++; }
    else if (result.outcome === "3B") { s.h++; s.triples++; }
    else if (result.outcome === "HR") { s.h++; s.hr++; }
    else if (result.outcome === "BB") s.bb++;
    else if (result.outcome === "HBP") s.hbp++;
    else if (["K_swing","K_look"].includes(result.outcome)) s.k++;
    s.rbi += result.rbis;
  };

  const accumulatePitcher = (accum: Record<string, any>, pitcher: Player, half: InningHalf) => {
    if (!accum[pitcher.id]) accum[pitcher.id] = { gp:0, gs:0, ip:0, ha:0, er:0, bba:0, kp:0 };
    const s = accum[pitcher.id];
    s.gp++;
    s.ip += 3; // full inning = 3 outs = 3 IP "thirds"
    s.ha += half.hits;
    // Simplified: count strikeouts and walks from at-bats
    for (const ab of half.atBats) {
      if (["K_swing","K_look"].includes(ab.outcome)) s.kp++;
      else if (ab.outcome === "BB") s.bba++;
    }
    s.er += half.runs;
  };

  for (let inning = 1; inning <= 9; inning++) {
    // Away bats first (top of inning)
    const awayPitcher = inning === 1
      ? away.startingPitcher
      : away.bullpen[awayPitcherIdx] ?? away.startingPitcher;

    const topResult = simulateInningHalf(
      home.lineup, // home pitches, away bats
      getActivePitcher(home, homePitcherIdx),
      awayLineupSpot,
      awayPitchCount,
      awayFatigue,
      inning,
      awayScore - homeScore,
    );
    awayLineupSpot = topResult.newLineupSpot;
    awayPitchCount = topResult.totalPitches;
    awayFatigue = topResult.newFatigue;
    awayScore += topResult.half.runs;

    // Accumulate pitcher stats
    accumulatePitcher(homeStatAccum, getActivePitcher(home, homePitcherIdx), topResult.half);
    for (let i = 0; i < topResult.half.atBats.length; i++) {
      const batter = away.lineup[(awayLineupSpot - topResult.half.atBats.length + i + 9) % 9];
      accumulateHitter(awayStatAccum, batter, topResult.half.atBats[i]);
    }

    // Check if we should change home pitcher
    if (shouldChangePitcher(awayPitchCount, awayFatigue, inning, homeScore - awayScore, homePitcherIdx < home.bullpen.length)) {
      homePitcherIdx = Math.min(homePitcherIdx + 1, home.bullpen.length);
      awayPitchCount = 0; awayFatigue = 0;
    }

    // Home bats (bottom of inning)
    const botResult = simulateInningHalf(
      away.lineup,
      getActivePitcher(away, awayPitcherIdx),
      homeLineupSpot,
      homePitchCount,
      homeFatigue,
      inning,
      homeScore - awayScore,
    );
    homeLineupSpot = botResult.newLineupSpot;
    homePitchCount = botResult.totalPitches;
    homeFatigue = botResult.newFatigue;
    homeScore += botResult.half.runs;

    accumulatePitcher(awayStatAccum, getActivePitcher(away, awayPitcherIdx), botResult.half);
    for (let i = 0; i < botResult.half.atBats.length; i++) {
      const batter = home.lineup[(homeLineupSpot - botResult.half.atBats.length + i + 9) % 9];
      accumulateHitter(homeStatAccum, batter, botResult.half.atBats[i]);
    }

    if (shouldChangePitcher(homePitchCount, homeFatigue, inning, awayScore - homeScore, awayPitcherIdx < away.bullpen.length)) {
      awayPitcherIdx = Math.min(awayPitcherIdx + 1, away.bullpen.length);
      homePitchCount = 0; homeFatigue = 0;
    }

    innings.push({ home: botResult.half, away: topResult.half });

    // Walk-off: home team wins in 9th
    if (inning === 9 && homeScore > awayScore) break;
  }

  // Extra innings (max 3 for performance)
  let extraInning = 10;
  while (homeScore === awayScore && extraInning <= 12) {
    const topResult = simulateInningHalf(away.lineup, getActivePitcher(home, homePitcherIdx), awayLineupSpot, awayPitchCount, awayFatigue, extraInning, awayScore - homeScore);
    awayScore += topResult.half.runs;
    const botResult = simulateInningHalf(home.lineup, getActivePitcher(away, awayPitcherIdx), homeLineupSpot, homePitchCount, homeFatigue, extraInning, homeScore - awayScore);
    homeScore += botResult.half.runs;
    innings.push({ home: botResult.half, away: topResult.half });
    extraInning++;
    if (homeScore !== awayScore) break;
  }
  // Tie-breaker: coin flip
  if (homeScore === awayScore) {
    if (Math.random() > 0.5) homeScore++; else awayScore++;
  }

  const winnerTeamId = homeScore > awayScore ? home.schoolId : away.schoolId;
  const loserTeamId = homeScore > awayScore ? away.schoolId : home.schoolId;

  return {
    boxScore: {
      homeTeamId: home.schoolId,
      awayTeamId: away.schoolId,
      innings,
      finalHome: homeScore,
      finalAway: awayScore,
      winnerTeamId,
      loserTeamId,
      save: false,
    },
    homeStats: homeStatAccum,
    awayStats: awayStatAccum,
  };
}

function getActivePitcher(team: TeamLineup, pitcherIdx: number): Player {
  if (pitcherIdx === 0) return team.startingPitcher;
  return team.bullpen[pitcherIdx - 1] ?? team.startingPitcher;
}
