import { Player } from "../models/player";
import { BasesOccupied, AtBatOutcome } from "../models/game";

export interface GameScenario {
  id: string;
  title: string;
  description: string;
  context: string; // e.g. "Your starter has thrown 97 pitches..."
  choices: ScenarioChoice[];
}

export interface ScenarioChoice {
  label: string;
  description: string;
  modifier: AtBatModifier;
  riskLevel: "low" | "medium" | "high";
}

export interface AtBatModifier {
  kRateMultiplier?: number;
  bbRateMultiplier?: number;
  hrRateMultiplier?: number;
  contactBonus?: number;     // added to batter contact
  fatigueReduction?: number; // reduce pitcher fatigue by this amount
  fatigueIncrease?: number;
}

export interface ScenarioContext {
  inning: number;
  outs: number;
  bases: BasesOccupied;
  homeScore: number;
  awayScore: number;
  isUserBatting: boolean;
  pitcher: Player;
  batter: Player;
  pitchCount: number;
  pitcherFatigue: number;
  stolenBasesAllowed: number; // this game
}

export function generateScenarios(ctx: ScenarioContext): GameScenario[] {
  const scenarios: GameScenario[] = [];
  const scoreDiff = ctx.isUserBatting
    ? ctx.homeScore - ctx.awayScore
    : ctx.awayScore - ctx.homeScore;

  // ── Scenario 1: Tired starter ──────────────────────────────────
  if (
    ctx.pitcher.ratings.stamina > 0 &&
    ctx.pitchCount >= 90 &&
    ctx.inning >= 6 &&
    ctx.pitcherFatigue >= 50
  ) {
    const pitcherName = ctx.pitcher.name;
    scenarios.push({
      id: "tired_starter",
      title: "Starter Running Out of Gas",
      description: `${pitcherName} has thrown ${ctx.pitchCount} pitches and is showing fatigue. Do you make the call to the bullpen?`,
      context: `${ctx.inning}th inning, ${ctx.pitchCount} pitches thrown, fatigue at ${Math.round(ctx.pitcherFatigue)}%.`,
      choices: [
        {
          label: "Pull him now",
          description: "Bring in a fresh reliever — better stuff, lower risk.",
          modifier: { fatigueReduction: 100, kRateMultiplier: 1.1 },
          riskLevel: "low",
        },
        {
          label: "Let him face one more",
          description: "He started well, let him work through it.",
          modifier: { fatigueIncrease: 15, hrRateMultiplier: 1.3 },
          riskLevel: "medium",
        },
        {
          label: "Start warming up the pen",
          description: "No change yet, but the pen is ready. One more pitch sequence at reduced intensity.",
          modifier: { fatigueIncrease: 5, hrRateMultiplier: 1.1 },
          riskLevel: "low",
        },
      ],
    });
  }

  // ── Scenario 2: Down late, baserunners ────────────────────────
  if (
    ctx.isUserBatting &&
    scoreDiff < 0 &&
    ctx.inning >= 7 &&
    ctx.outs <= 1 &&
    ctx.bases.first === 1
  ) {
    const down = Math.abs(scoreDiff);
    scenarios.push({
      id: "late_inning_rally",
      title: "Rally Time",
      description: `Down ${down} in the ${ctx.inning}th with a runner on first and ${ctx.outs} out${ctx.outs !== 1 ? "s" : ""}. How do you approach this at-bat?`,
      context: `${ctx.batter.name} up, runner on 1st, ${ctx.outs} outs.`,
      choices: [
        {
          label: "Take a pitch / work the count",
          description: "Be disciplined, force more pitches and look for a walk or mistake.",
          modifier: { bbRateMultiplier: 1.4, kRateMultiplier: 0.9 },
          riskLevel: "low",
        },
        {
          label: "Hit and run",
          description: "Runner goes on the pitch, batter puts it in play. Risk of strikeout-CS combo.",
          modifier: { contactBonus: 8, kRateMultiplier: 0.75, hrRateMultiplier: 0.8 },
          riskLevel: "medium",
        },
        {
          label: "Swing for the fences",
          description: "Look for the big hit. Batter sells out for power.",
          modifier: { hrRateMultiplier: 1.5, kRateMultiplier: 1.3, contactBonus: -5 },
          riskLevel: "high",
        },
      ],
    });
  }

  // ── Scenario 3: Sacrifice bunt situation ──────────────────────
  if (
    ctx.isUserBatting &&
    ctx.outs === 0 &&
    ctx.bases.first === 1 &&
    ctx.bases.second === 0 &&
    ctx.inning >= 6 &&
    Math.abs(scoreDiff) <= 1
  ) {
    scenarios.push({
      id: "bunt_situation",
      title: "Play Small Ball?",
      description: `Runner on first, nobody out in a close game. Bunt to advance, or let your ${ctx.batter.name} swing away?`,
      context: `${ctx.inning}th inning, tie game or one-run game.`,
      choices: [
        {
          label: "Sacrifice bunt",
          description: "Move the runner to second. Guaranteed out, but sets up the next hitter.",
          modifier: { contactBonus: 20, hrRateMultiplier: 0 },
          riskLevel: "low",
        },
        {
          label: "Swing away",
          description: "Trust your hitter to do damage. May get more than just one base.",
          modifier: {},
          riskLevel: "medium",
        },
        {
          label: "Take a pitch",
          description: "Make the pitcher throw strikes. Set up a better count.",
          modifier: { bbRateMultiplier: 1.3, kRateMultiplier: 0.85 },
          riskLevel: "low",
        },
      ],
    });
  }

  // ── Scenario 4: Stolen base opportunity ───────────────────────
  if (
    ctx.isUserBatting &&
    ctx.outs <= 1 &&
    ctx.bases.first === 1 &&
    ctx.bases.second === 0 &&
    ctx.batter.ratings.speed >= 65
  ) {
    scenarios.push({
      id: "steal_attempt",
      title: "Stolen Base Opportunity",
      description: `${ctx.batter.name} is a burner (speed ${ctx.batter.ratings.speed}). Greenlight a steal attempt?`,
      context: `Runner on 1st, pitcher winds up.`,
      choices: [
        {
          label: "Green light — go!",
          description: `Speed ${ctx.batter.ratings.speed}: decent chance of success. Advances to scoring position.`,
          modifier: { contactBonus: -3 }, // batter distracted by steal
          riskLevel: ctx.batter.ratings.speed >= 75 ? "low" : "medium",
        },
        {
          label: "Hold the runner",
          description: "Don't risk the out. Focus on the at-bat.",
          modifier: {},
          riskLevel: "low",
        },
      ],
    });
  }

  // ── Scenario 5: Pitch out suspicion ───────────────────────────
  if (
    !ctx.isUserBatting &&
    ctx.stolenBasesAllowed >= 2 &&
    ctx.bases.first === 1 &&
    ctx.outs <= 1
  ) {
    scenarios.push({
      id: "pitch_out",
      title: "They Keep Running on You",
      description: `The opponent has stolen ${ctx.stolenBasesAllowed} bases today. Do you call a pitch-out to try to gun them down?`,
      context: `Runner on first, ${ctx.outs} out${ctx.outs !== 1 ? "s" : ""}.`,
      choices: [
        {
          label: "Pitch out",
          description: "Waste a pitch to give your catcher a better throw. Risks a ball in the count.",
          modifier: { bbRateMultiplier: 1.2, kRateMultiplier: 0.7 },
          riskLevel: "medium",
        },
        {
          label: "Slide step",
          description: "Quicker delivery to the plate. Slight velocity drop but keeps runner honest.",
          modifier: { kRateMultiplier: 0.92 },
          riskLevel: "low",
        },
        {
          label: "Ignore it",
          description: "Focus on getting the batter out. Trust the defense.",
          modifier: {},
          riskLevel: "low",
        },
      ],
    });
  }

  // ── Scenario 6: Slumping star ─────────────────────────────────
  if (
    ctx.isUserBatting &&
    ctx.batter.potential >= 4 &&
    ctx.batter.seasonStats.ab > 30 &&
    ctx.batter.seasonStats.h / ctx.batter.seasonStats.ab < 0.200 &&
    ctx.inning <= 5
  ) {
    scenarios.push({
      id: "slumping_star",
      title: "Star in a Slump",
      description: `${ctx.batter.name} (${ctx.batter.potential}-star) is hitting .${Math.round((ctx.batter.seasonStats.h / ctx.batter.seasonStats.ab) * 1000).toString().padStart(3, "0")}. Do you sit him for a day?`,
      context: `Only ${ctx.inning} innings in, plenty of time to reconsider.`,
      choices: [
        {
          label: "Keep him in",
          description: "Ride out the slump. His potential is still there.",
          modifier: { contactBonus: -5 }, // pressing
          riskLevel: "medium",
        },
        {
          label: "Move him down in the order",
          description: "Less pressure batting lower. Better lineup protection for him.",
          modifier: { contactBonus: 5, hrRateMultiplier: 0.9 },
          riskLevel: "low",
        },
        {
          label: "Give him the day",
          description: "Rest him today. Next eligible batter steps up.",
          modifier: { contactBonus: 15 }, // substitute is more relaxed
          riskLevel: "low",
        },
      ],
    });
  }

  return scenarios;
}

export function applyModifierToSituation(
  modifier: AtBatModifier,
  currentFatigue: number,
): { adjustedFatigue: number; modifierActive: AtBatModifier } {
  let fatigue = currentFatigue;
  if (modifier.fatigueReduction) fatigue = Math.max(0, fatigue - modifier.fatigueReduction);
  if (modifier.fatigueIncrease) fatigue = Math.min(100, fatigue + modifier.fatigueIncrease);
  return { adjustedFatigue: fatigue, modifierActive: modifier };
}
