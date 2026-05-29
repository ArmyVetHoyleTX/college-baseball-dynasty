export type Position =
  | "SP"  // Starting Pitcher
  | "RP"  // Relief Pitcher
  | "C"   // Catcher
  | "1B"
  | "2B"
  | "3B"
  | "SS"  // Shortstop
  | "LF"
  | "CF"  // Center Field
  | "RF"
  | "DH"; // Designated Hitter

export type Year = "FR" | "SO" | "JR" | "SR" | "GR"; // GR = grad transfer

export type Hand = "L" | "R" | "S"; // S = switch

export interface PlayerRatings {
  // Hitting (1–100)
  contact: number;
  power: number;
  eye: number;        // plate discipline / walk tendency
  speed: number;
  // Pitching (1–100)
  velocity: number;   // raw K rate contributor
  control: number;    // walk rate suppressor
  movement: number;   // contact quality suppressor / GB inducer
  stamina: number;    // innings pitched before fatigue
  // Fielding (1–100)
  range: number;
  arm: number;
  glove: number;
}

export interface SeasonStats {
  season: number;
  // Hitting
  pa: number;
  ab: number;
  h: number;
  singles: number;
  doubles: number;
  triples: number;
  hr: number;
  rbi: number;
  r: number;
  bb: number;
  hbp: number;
  k: number;
  sb: number;
  cs: number;
  // Pitching
  gp: number;         // games pitched
  gs: number;         // games started
  ip: number;         // innings pitched (×3 internally for fractions)
  ha: number;         // hits allowed
  era: number;        // earned run average (computed)
  er: number;         // earned runs
  bba: number;        // walks allowed
  kp: number;         // strikeouts as pitcher
  sv: number;         // saves
  wins: number;
  losses: number;
}

export interface Player {
  id: string;
  name: string;
  year: Year;
  position: Position;
  bats: Hand;
  throws: Hand;
  potential: 1 | 2 | 3 | 4 | 5;
  ratings: PlayerRatings;
  seasonStats: SeasonStats;
  careerStats: SeasonStats[];
  nilDeal: number;          // annual NIL value in $K (0 = no deal)
  isInTransferPortal: boolean;
  schoolId: string;
  injuryWeeksRemaining: number;
  redshirted: boolean;
}

export function emptySeasonStats(season: number): SeasonStats {
  return {
    season,
    pa: 0, ab: 0, h: 0, singles: 0, doubles: 0, triples: 0, hr: 0,
    rbi: 0, r: 0, bb: 0, hbp: 0, k: 0, sb: 0, cs: 0,
    gp: 0, gs: 0, ip: 0, ha: 0, era: 0, er: 0, bba: 0, kp: 0,
    sv: 0, wins: 0, losses: 0,
  };
}

export function computeDerivedStats(s: SeasonStats): {
  avg: number; obp: number; slg: number; ops: number;
  fip: number; whip: number; kPer9: number; bbPer9: number;
} {
  const avg = s.ab > 0 ? s.h / s.ab : 0;
  const obp = s.pa > 0 ? (s.h + s.bb + s.hbp) / s.pa : 0;
  const tb = s.singles + s.doubles * 2 + s.triples * 3 + s.hr * 4;
  const slg = s.ab > 0 ? tb / s.ab : 0;
  const ops = obp + slg;

  const ip = s.ip / 3;
  const era = ip > 0 ? (s.er / ip) * 9 : 0;
  // FIP constant ≈ 3.10 for college ball
  const fip = ip > 0
    ? (13 * s.hr + 3 * (s.bba + s.hbp) - 2 * s.kp) / ip + 3.1
    : 0;
  const whip = ip > 0 ? (s.ha + s.bba) / ip : 0;
  const kPer9 = ip > 0 ? (s.kp / ip) * 9 : 0;
  const bbPer9 = ip > 0 ? (s.bba / ip) * 9 : 0;

  return { avg, obp, slg, ops, fip, whip, kPer9, bbPer9 };
}
