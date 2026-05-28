export type GamePhase =
  | "new_game"
  | "preseason"
  | "recruiting_fall"
  | "regular_season"
  | "conference_tournament"
  | "regionals"
  | "super_regionals"
  | "cws"
  | "offseason_transfer_portal"
  | "offseason_training"
  | "offseason_recruiting_spring";

export interface Standing {
  schoolId: string;
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  gb: number;         // games behind leader
  rpi: number;        // 0–1, computed from win% + schedule strength
}

export interface ConferenceStandings {
  conference: string;
  standings: Standing[];
}

export interface NationalRanking {
  rank: number;
  schoolId: string;
  rpi: number;
  record: string;     // "42-14"
}

export interface PostseasonBracket {
  regionals: BracketGroup[];        // 16 groups of 4
  superRegionals: BracketSeries[];  // 8 best-of-3 series
  cws: CWSBracket;
}

export interface BracketGroup {
  hostSchoolId: string;
  teams: string[];        // 4 school IDs
  results: BracketResult[];
  winner: string | null;
}

export interface BracketSeries {
  team1Id: string;
  team2Id: string;
  team1Wins: number;
  team2Wins: number;
  winner: string | null;
}

export interface CWSBracket {
  // Double-elimination, 8 teams, 2 pools of 4
  pool1: string[];
  pool2: string[];
  semifinal1Winner: string | null;
  semifinal2Winner: string | null;
  champion: string | null;
}

export interface BracketResult {
  gameId: string;
  winnerId: string;
  loserId: string;
  isElimination: boolean;
}

export interface GameState {
  version: number;          // save file version for migrations
  season: number;           // calendar year, e.g. 2025
  week: number;             // 1–20 during regular season
  phase: GamePhase;
  userSchoolId: string;
  gameMode: "dynasty" | "career";
  careerPlayerId?: string;  // set in career mode
  schedule: import("./game").ScheduledGame[];
  conferenceStandings: ConferenceStandings[];
  nationalRankings: NationalRanking[];
  postseasonBracket?: PostseasonBracket;
  recruitingPoints: number;  // remaining this recruiting cycle
  transferPortalOpen: boolean;
  nilBudgetRemaining: number;
  settings: GameSettings;
}

export interface GameSettings {
  scenariosEnabled: boolean;
  autoSimBullpen: boolean;
  simSpeed: "normal" | "fast";
}
