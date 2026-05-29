import { Position } from "./player";

export type AtBatOutcome =
  | "HR" | "3B" | "2B" | "1B"
  | "BB" | "HBP"
  | "K_swing" | "K_look"
  | "GIDP" | "GO" | "FO" | "LO"; // ground/fly/line out

export type BaseState = 0 | 1; // 0 = empty, 1 = occupied
export interface BasesOccupied {
  first: BaseState;
  second: BaseState;
  third: BaseState;
}

export interface AtBatResult {
  outcome: AtBatOutcome;
  pitchCount: number;
  rbis: number;
  runsScored: number;
  newBases: BasesOccupied;
  exitVelocity?: number; // mph, for balls in play
}

export interface InningHalf {
  atBats: AtBatResult[];
  runs: number;
  hits: number;
  errors: number;
}

export interface BoxScore {
  homeTeamId: string;
  awayTeamId: string;
  innings: { home: InningHalf; away: InningHalf }[];
  finalHome: number;
  finalAway: number;
  winnerTeamId: string;
  loserTeamId: string;
  save: boolean;
}

export interface ScheduledGame {
  id: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  isConferenceGame: boolean;
  result?: BoxScore;
  isPostseason: boolean;
  postseasonRound?: PostseasonRound;
}

export type PostseasonRound =
  | "conference_tournament"
  | "regional"
  | "super_regional"
  | "cws";

export interface LiveGameState {
  homeTeamId: string;
  awayTeamId: string;
  inning: number;           // 1–9 (or extra)
  isTopInning: boolean;
  outs: number;
  bases: BasesOccupied;
  homeScore: number;
  awayScore: number;
  homePitcherIndex: number; // index into bullpen order
  awayPitcherIndex: number;
  homePitcherPitchCount: number;
  awayPitcherPitchCount: number;
  homePitcherFatigue: number;  // 0–100, 100 = exhausted
  awayPitcherFatigue: number;
  homeLineupSpot: number;   // 0–8 cycling lineup
  awayLineupSpot: number;
  inningLog: InningHalf[];
}

export interface Recruit {
  id: string;
  name: string;
  position: Position;
  stars: 1 | 2 | 3 | 4 | 5;
  state: string;
  topInterests: string[]; // school IDs
  interest: Record<string, number>; // schoolId → 0–100%
  nilExpectation: number;  // $K needed to secure commitment
  isCommitted: boolean;
  committedToSchoolId?: string;
}

export interface TransferPortalEntry {
  playerId: string;
  fromSchoolId: string;
  stars: 1 | 2 | 3 | 4 | 5;
  position: Position;
  interest: Record<string, number>;
  nilExpectation: number;
  committed: boolean;
  committedToSchoolId?: string;
}
