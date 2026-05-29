import { Player, Year, PlayerRatings, emptySeasonStats } from "../models/player";

export interface TrainingAllocation {
  playerId: string;
  hitting: number;    // 0–10 points
  pitching: number;   // 0–10 points
  fielding: number;   // 0–10 points
  conditioning: number; // 0–10 points
  // Total must not exceed 12 points per week × 8 weeks = 96 per offseason
}

const POINTS_PER_WEEK = 3;
const OFFSEASON_WEEKS = 8;
export const MAX_OFFSEASON_POINTS = POINTS_PER_WEEK * OFFSEASON_WEEKS;

// Diminishing returns: growth tapers above 80, nearly stops above 95
function growthCurve(current: number, gain: number): number {
  if (current >= 95) return current + gain * 0.05;
  if (current >= 85) return current + gain * 0.3;
  if (current >= 70) return current + gain * 0.7;
  return current + gain;
}

function potentialMultiplier(potential: 1 | 2 | 3 | 4 | 5): number {
  return { 1: 0.4, 2: 0.7, 3: 1.0, 4: 1.4, 5: 1.9 }[potential];
}

function clamp(v: number): number {
  return Math.round(Math.max(20, Math.min(99, v)));
}

export function applyTraining(
  player: Player,
  allocation: TrainingAllocation,
): Player {
  const pm = potentialMultiplier(player.potential);
  const r = player.ratings;

  const hitGain = (allocation.hitting / MAX_OFFSEASON_POINTS) * 12 * pm;
  const pitchGain = (allocation.pitching / MAX_OFFSEASON_POINTS) * 12 * pm;
  const fieldGain = (allocation.fielding / MAX_OFFSEASON_POINTS) * 10 * pm;
  const condGain = (allocation.conditioning / MAX_OFFSEASON_POINTS) * 8 * pm;

  const injuryRisk = Math.max(0, 1 - allocation.conditioning / 6) * 0.12;
  const injured = Math.random() < injuryRisk;

  const newRatings: PlayerRatings = {
    contact:  clamp(growthCurve(r.contact,  hitGain * 0.6)),
    power:    clamp(growthCurve(r.power,    hitGain * 0.4)),
    eye:      clamp(growthCurve(r.eye,      hitGain * 0.3)),
    speed:    clamp(growthCurve(r.speed,    condGain * 0.5)),
    velocity: clamp(growthCurve(r.velocity, pitchGain * 0.5)),
    control:  clamp(growthCurve(r.control,  pitchGain * 0.4)),
    movement: clamp(growthCurve(r.movement, pitchGain * 0.3)),
    stamina:  clamp(growthCurve(r.stamina,  condGain * 0.4)),
    range:    clamp(growthCurve(r.range,    fieldGain * 0.4)),
    arm:      clamp(growthCurve(r.arm,      fieldGain * 0.3)),
    glove:    clamp(growthCurve(r.glove,    fieldGain * 0.3)),
  };

  return {
    ...player,
    ratings: newRatings,
    injuryWeeksRemaining: injured ? Math.ceil(Math.random() * 3) : 0,
  };
}

function advanceYear(year: Year): Year | null {
  switch (year) {
    case "FR": return "SO";
    case "SO": return "JR";
    case "JR": return "SR";
    case "SR": return null; // graduates
    case "GR": return null; // grad transfer graduates
  }
}

export interface OffseasonResult {
  returningPlayers: Player[];
  graduatedPlayers: Player[];
}

export function processOffseason(
  players: Player[],
  allocations: TrainingAllocation[],
  season: number,
): OffseasonResult {
  const allocMap: Record<string, TrainingAllocation> = {};
  for (const a of allocations) allocMap[a.playerId] = a;

  const returning: Player[] = [];
  const graduated: Player[] = [];

  for (const player of players) {
    const alloc = allocMap[player.id] ?? {
      playerId: player.id, hitting: 3, pitching: 3, fielding: 3, conditioning: 3,
    };

    const trained = applyTraining(player, alloc);

    // Archive season stats to career
    const newCareer = [...player.careerStats, player.seasonStats];
    const newYear = advanceYear(player.year);

    if (newYear === null) {
      // Player graduates — remove from roster
      graduated.push({ ...trained, careerStats: newCareer });
    } else {
      returning.push({
        ...trained,
        year: newYear,
        careerStats: newCareer,
        seasonStats: emptySeasonStats(season + 1),
        isInTransferPortal: false,
      });
    }
  }

  return { returningPlayers: returning, graduatedPlayers: graduated };
}

// Auto-allocate training points (used for CPU teams)
export function autoAllocate(player: Player): TrainingAllocation {
  const pos = player.position;
  const isPitcher = pos === "SP" || pos === "RP";

  if (isPitcher) {
    return { playerId: player.id, hitting: 0, pitching: 8, fielding: 1, conditioning: 3 };
  }
  const power = player.ratings.power;
  const contact = player.ratings.contact;
  const pitchPts = power > contact ? 0 : 0;
  return {
    playerId: player.id,
    hitting: 6,
    pitching: 0,
    fielding: 3,
    conditioning: 3,
  };
}
