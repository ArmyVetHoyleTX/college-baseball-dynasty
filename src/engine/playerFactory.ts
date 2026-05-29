import { Player, Position, Year, Hand, emptySeasonStats, PlayerRatings } from "../models/player";
import { FIRST_NAMES_MALE, LAST_NAMES, STATES } from "../data/nameBank";

let _idCounter = 1;
function nextId(): string {
  return `p_${Date.now()}_${_idCounter++}`;
}

// Seeded random — simple LCG
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pickFrom<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function gaussianRating(center: number, spread: number, r: () => number): number {
  // Box-Muller approximation
  const u1 = r(), u2 = r();
  const z = Math.sqrt(-2 * Math.log(u1 + 0.001)) * Math.cos(2 * Math.PI * u2);
  return Math.round(Math.max(20, Math.min(99, center + z * spread)));
}

// Position-specific rating centers
const PITCHER_CENTERS: Record<"SP" | "RP", Partial<PlayerRatings>> = {
  SP: { velocity: 60, control: 58, movement: 56, stamina: 62, contact: 35, power: 25, eye: 30, speed: 40, range: 45, arm: 60, glove: 50 },
  RP: { velocity: 65, control: 55, movement: 52, stamina: 35, contact: 30, power: 20, eye: 28, speed: 42, range: 45, arm: 62, glove: 48 },
};

const POSITION_CENTERS: Record<string, Partial<PlayerRatings>> = {
  C:  { contact: 52, power: 54, eye: 52, speed: 40, arm: 70, range: 55, glove: 70, velocity: 30, control: 30, movement: 30, stamina: 30 },
  "1B": { contact: 58, power: 70, eye: 60, speed: 42, arm: 55, range: 50, glove: 60, velocity: 30, control: 30, movement: 30, stamina: 30 },
  "2B": { contact: 60, power: 48, eye: 58, speed: 65, arm: 58, range: 70, glove: 68, velocity: 30, control: 30, movement: 30, stamina: 30 },
  "3B": { contact: 56, power: 64, eye: 55, speed: 55, arm: 68, range: 62, glove: 63, velocity: 30, control: 30, movement: 30, stamina: 30 },
  SS: { contact: 58, power: 52, eye: 56, speed: 70, arm: 68, range: 75, glove: 72, velocity: 30, control: 30, movement: 30, stamina: 30 },
  LF: { contact: 58, power: 64, eye: 56, speed: 58, arm: 55, range: 60, glove: 58, velocity: 30, control: 30, movement: 30, stamina: 30 },
  CF: { contact: 62, power: 56, eye: 58, speed: 75, arm: 58, range: 80, glove: 70, velocity: 30, control: 30, movement: 30, stamina: 30 },
  RF: { contact: 56, power: 68, eye: 55, speed: 56, arm: 72, range: 62, glove: 60, velocity: 30, control: 30, movement: 30, stamina: 30 },
  DH: { contact: 60, power: 72, eye: 60, speed: 40, arm: 45, range: 45, glove: 50, velocity: 30, control: 30, movement: 30, stamina: 30 },
};

// Higher potential = higher spread from center (elite players have elite ratings)
const POTENTIAL_BOOST: Record<number, number> = { 1: -18, 2: -8, 3: 2, 4: 12, 5: 22 };

export function generatePlayer(
  position: Position,
  year: Year,
  schoolId: string,
  potential: 1 | 2 | 3 | 4 | 5,
  seed?: number,
): Player {
  const r = seededRand(seed ?? Math.floor(Math.random() * 99999));
  const boost = POTENTIAL_BOOST[potential];

  const centers = position === "SP" || position === "RP"
    ? PITCHER_CENTERS[position]
    : POSITION_CENTERS[position] ?? POSITION_CENTERS["CF"];

  const spread = 8 + potential * 2;

  const ratings: PlayerRatings = {
    contact:  gaussianRating((centers.contact  ?? 50) + boost * 0.6, spread, r),
    power:    gaussianRating((centers.power    ?? 50) + boost * 0.6, spread, r),
    eye:      gaussianRating((centers.eye      ?? 50) + boost * 0.4, spread, r),
    speed:    gaussianRating((centers.speed    ?? 50) + boost * 0.3, spread, r),
    velocity: gaussianRating((centers.velocity ?? 50) + boost * 0.8, spread, r),
    control:  gaussianRating((centers.control  ?? 50) + boost * 0.7, spread, r),
    movement: gaussianRating((centers.movement ?? 50) + boost * 0.6, spread, r),
    stamina:  gaussianRating((centers.stamina  ?? 50) + boost * 0.4, spread, r),
    range:    gaussianRating((centers.range    ?? 50) + boost * 0.3, spread, r),
    arm:      gaussianRating((centers.arm      ?? 50) + boost * 0.4, spread, r),
    glove:    gaussianRating((centers.glove    ?? 50) + boost * 0.3, spread, r),
  };

  const firstName = pickFrom(FIRST_NAMES_MALE, r);
  const lastName = pickFrom(LAST_NAMES, r);
  const bats: Hand = r() > 0.8 ? "L" : r() > 0.95 ? "S" : "R";
  const throws: Hand = r() > 0.85 ? "L" : "R";

  return {
    id: nextId(),
    name: `${firstName} ${lastName}`,
    year,
    position,
    bats,
    throws,
    potential,
    ratings,
    seasonStats: emptySeasonStats(2025),
    careerStats: [],
    nilDeal: 0,
    isInTransferPortal: false,
    schoolId,
    injuryWeeksRemaining: 0,
    redshirted: false,
  };
}

const STANDARD_LINEUP: Position[] = ["C","1B","2B","3B","SS","LF","CF","RF","DH"];

export function generateRoster(
  schoolId: string,
  prestigeLevel: number, // 1–100
  season: number,
  seed?: number,
): Player[] {
  const r = seededRand(seed ?? Math.floor(Math.random() * 99999));
  const players: Player[] = [];

  // Prestige determines average star rating
  const avgStars = 1 + Math.min(4, Math.floor(prestigeLevel / 25));
  const randomStars = (): 1 | 2 | 3 | 4 | 5 => {
    const roll = r();
    if (roll < 0.05 && avgStars >= 4) return 5;
    if (roll < 0.25) return Math.min(5, avgStars + 1) as any;
    if (roll < 0.60) return avgStars as any;
    return Math.max(1, avgStars - 1) as any;
  };

  const years: Year[] = ["FR", "SO", "JR", "SR"];

  // Generate 4 starting pitchers + 3 relievers
  for (let i = 0; i < 4; i++) {
    const yr = years[Math.floor(r() * 4)] as Year;
    players.push(generatePlayer("SP", yr, schoolId, randomStars(), Math.floor(r() * 99999)));
  }
  for (let i = 0; i < 4; i++) {
    const yr = years[Math.floor(r() * 4)] as Year;
    players.push(generatePlayer("RP", yr, schoolId, randomStars(), Math.floor(r() * 99999)));
  }

  // Generate position players (at least 2 per position for depth)
  for (const pos of STANDARD_LINEUP) {
    for (let depth = 0; depth < 2; depth++) {
      const yr = years[Math.floor(r() * 4)] as Year;
      players.push(generatePlayer(pos, yr, schoolId, randomStars(), Math.floor(r() * 99999)));
    }
  }

  return players;
}

// Build a 9-man batting lineup from a roster, ordered by rating
export function buildLineup(roster: Player[]): Player[] {
  const positionPlayers = roster.filter(
    (p) => !["SP", "RP"].includes(p.position) && p.injuryWeeksRemaining === 0,
  );

  // Sort by overall offensive rating: contact + power + eye + speed
  positionPlayers.sort((a, b) => {
    const ratingA = a.ratings.contact + a.ratings.power + a.ratings.eye + a.ratings.speed;
    const ratingB = b.ratings.contact + b.ratings.power + b.ratings.eye + b.ratings.speed;
    return ratingB - ratingA;
  });

  // Standard lineup construction
  // Leadoff: speed/eye, 3-4-5: power, bottom: defense
  return positionPlayers.slice(0, 9);
}

export function buildBullpen(roster: Player[]): { starter: Player; bullpen: Player[] } {
  const pitchers = roster
    .filter((p) => ["SP", "RP"].includes(p.position) && p.injuryWeeksRemaining === 0)
    .sort((a, b) => (b.ratings.velocity + b.ratings.control + b.ratings.movement)
      - (a.ratings.velocity + a.ratings.control + a.ratings.movement));

  const starters = pitchers.filter((p) => p.position === "SP");
  const relievers = pitchers.filter((p) => p.position === "RP");

  return {
    starter: starters[0] ?? pitchers[0],
    bullpen: [...starters.slice(1, 2), ...relievers.slice(0, 4)],
  };
}
