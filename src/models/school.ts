export type Division = "D1" | "D2" | "D3";
export type FacilitiesLevel = 1 | 2 | 3 | 4 | 5;

export interface CoachingStaff {
  headCoach: CoachSlot;
  pitchingCoach: CoachSlot;
  hittingCoach: CoachSlot;
  recruitingCoordinator: CoachSlot;
}

export interface CoachSlot {
  name: string;
  xp: number;        // 0–100, earns from wins and recruiting
  level: 1 | 2 | 3 | 4 | 5;
  perkUnlocked: boolean; // level 3+ unlocks perk
}

export interface School {
  id: string;
  name: string;
  shortName: string;    // e.g. "UNC", "LSU"
  nickname: string;     // e.g. "Tar Heels", "Tigers"
  conference: string;
  division: Division;
  prestige: number;     // 1–100
  facilitiesLevel: FacilitiesLevel;
  scholarshipsUsed: number;  // max 11.7 for D1
  nilBudget: number;         // $K available per season
  nilSpent: number;          // $K committed this season
  wins: number;
  losses: number;
  conferenceTitles: number;
  cwsAppearances: number;
  cwsTitles: number;
  nationalRank: number | null; // null = unranked
  recruitingRank: number;      // 1–300, computed
  coaching: CoachingStaff;
  hallOfFame: HallOfFameEntry[];
  isUserControlled: boolean;
  primaryColor: string;       // hex
  secondaryColor: string;     // hex
}

export interface HallOfFameEntry {
  playerName: string;
  position: string;
  seasons: number;
  careerAvgOrEra: string;
  year: number;
}

export const MAX_SCHOLARSHIPS_D1 = 11.7;
export const MAX_SCHOLARSHIPS_D2 = 9.0;
export const MAX_SCHOLARSHIPS_D3 = 0; // no athletic scholarships

export function getRecruitingPoints(school: School): number {
  const base = 25;
  const facilitiesBonus = (school.facilitiesLevel - 1) * 2;
  const prestigeBonus = Math.floor(school.prestige / 20);
  const coordBonus = school.coaching.recruitingCoordinator.perkUnlocked ? 5 : 0;
  return base + facilitiesBonus + prestigeBonus + coordBonus;
}

export function getNilBudget(school: School): number {
  // NIL budget scales with prestige and facilities
  const base = 50; // $50K
  const prestigeMultiplier = 1 + school.prestige / 100;
  const facilitiesMultiplier = 1 + (school.facilitiesLevel - 1) * 0.15;
  return Math.round(base * prestigeMultiplier * facilitiesMultiplier);
}

export function updatePrestige(
  school: School,
  wins: number,
  losses: number,
  madePostseason: boolean,
  madeCWS: boolean,
  wonCWS: boolean
): number {
  const winPct = wins / Math.max(wins + losses, 1);
  let delta = 0;
  if (winPct > 0.65) delta += 3;
  else if (winPct > 0.5) delta += 1;
  else if (winPct < 0.4) delta -= 2;
  else if (winPct < 0.35) delta -= 4;
  if (madePostseason) delta += 2;
  if (madeCWS) delta += 4;
  if (wonCWS) delta += 8;
  return Math.max(1, Math.min(100, school.prestige + delta));
}
