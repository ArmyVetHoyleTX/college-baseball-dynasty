import { Recruit, TransferPortalEntry } from "../models/game";
import { Player, Position } from "../models/player";
import { School } from "../models/school";
import { FIRST_NAMES_MALE, LAST_NAMES, STATES } from "../data/nameBank";
import { SCHOOL_TEMPLATES } from "../data/schools";

let _idCounter = 1;

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pickFrom<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

const ALL_POSITIONS: Position[] = ["SP","SP","SP","RP","C","1B","2B","3B","SS","LF","CF","CF","RF","DH"];

export function generateRecruitPool(season: number, totalRecruits = 200): Recruit[] {
  const recruits: Recruit[] = [];
  const r = seededRand(season * 1337);

  for (let i = 0; i < totalRecruits; i++) {
    const stars = weightedStars(r) as 1|2|3|4|5;
    const topSchools = pickTopInterests(stars, r);
    const nilExpectation = (stars - 1) * 15 + Math.floor(r() * 20); // $K

    recruits.push({
      id: `rec_${season}_${_idCounter++}`,
      name: `${pickFrom(FIRST_NAMES_MALE, r)} ${pickFrom(LAST_NAMES, r)}`,
      position: pickFrom(ALL_POSITIONS, r),
      stars,
      state: pickFrom(STATES, r),
      topInterests: topSchools,
      interest: Object.fromEntries(topSchools.map((s) => [s, 10 + r() * 20])),
      nilExpectation,
      isCommitted: false,
    });
  }
  return recruits;
}

function weightedStars(r: () => number): number {
  const roll = r();
  if (roll < 0.03) return 5;
  if (roll < 0.12) return 4;
  if (roll < 0.35) return 3;
  if (roll < 0.68) return 2;
  return 1;
}

function pickTopInterests(stars: number, r: () => number): string[] {
  // Higher star recruits prefer higher-prestige programs
  const minPrestige = stars === 5 ? 80 : stars === 4 ? 60 : stars === 3 ? 40 : 20;
  const eligible = SCHOOL_TEMPLATES.filter((s) => s.prestige >= minPrestige);
  const shuffled = [...eligible].sort(() => r() - 0.5);
  return shuffled.slice(0, 3 + Math.floor(r() * 3)).map((s) => s.id);
}

export interface RecruitingState {
  pool: Recruit[];
  pointsRemaining: number;
  offersMade: string[];         // recruit IDs with scholarships offered
  nilDeals: Record<string, number>; // recruitId → $K NIL offer
}

export function spendRecruitingPoints(
  state: RecruitingState,
  recruitId: string,
  points: number,
  school: School,
): RecruitingState {
  if (state.pointsRemaining < points) return state;

  const recruit = state.pool.find((r) => r.id === recruitId);
  if (!recruit || recruit.isCommitted) return state;

  const currentInterest = recruit.interest[school.id] ?? 0;
  const nilBonus = state.nilDeals[recruitId]
    ? Math.min(20, state.nilDeals[recruitId] / 5)
    : 0;
  const prestigeBonus = school.prestige / 100 * 5;
  const interestGain = points * 3 + nilBonus + prestigeBonus;

  const updatedRecruit: Recruit = {
    ...recruit,
    interest: {
      ...recruit.interest,
      [school.id]: Math.min(100, currentInterest + interestGain),
    },
  };

  return {
    ...state,
    pointsRemaining: state.pointsRemaining - points,
    pool: state.pool.map((r) => r.id === recruitId ? updatedRecruit : r),
  };
}

export function offerScholarship(
  state: RecruitingState,
  recruitId: string,
): RecruitingState {
  return {
    ...state,
    offersMade: [...state.offersMade, recruitId],
  };
}

export function setNilOffer(
  state: RecruitingState,
  recruitId: string,
  amountK: number,
): RecruitingState {
  return {
    ...state,
    nilDeals: { ...state.nilDeals, [recruitId]: amountK },
  };
}

// Run commit decisions at end of recruiting period
export function processCommits(
  state: RecruitingState,
  school: School,
  r?: () => number,
): { commits: Recruit[]; remaining: Recruit[] } {
  const rand = r ?? Math.random;
  const commits: Recruit[] = [];
  const remaining: Recruit[] = [];

  for (const recruit of state.pool) {
    if (recruit.isCommitted) continue;

    const hasOffer = state.offersMade.includes(recruit.id);
    if (!hasOffer) { remaining.push(recruit); continue; }

    const interest = recruit.interest[school.id] ?? 0;
    const nilMet = (state.nilDeals[recruit.id] ?? 0) >= recruit.nilExpectation;
    const commitThreshold = nilMet ? 55 : 70;

    if (interest >= commitThreshold) {
      commits.push({ ...recruit, isCommitted: true, committedToSchoolId: school.id });
    } else if (rand() < (interest / 100) * 0.4) {
      commits.push({ ...recruit, isCommitted: true, committedToSchoolId: school.id });
    } else {
      remaining.push(recruit);
    }
  }

  return { commits, remaining };
}

// ────────────────────────────────────────────
// Transfer Portal
// ────────────────────────────────────────────

export function generateTransferPortalPool(
  allPlayers: Player[],
  season: number,
  portalEntryRate = 0.08,
): TransferPortalEntry[] {
  const r = seededRand(season * 7331);
  const entries: TransferPortalEntry[] = [];

  for (const player of allPlayers) {
    if (player.year === "SR" || player.year === "GR") continue;
    if (r() > portalEntryRate) continue;

    const stars = player.potential as 1|2|3|4|5;
    const topSchools = pickTopInterests(stars, r);

    entries.push({
      playerId: player.id,
      fromSchoolId: player.schoolId,
      stars,
      position: player.position,
      interest: Object.fromEntries(topSchools.map((s) => [s, 15 + r() * 25])),
      nilExpectation: (stars - 1) * 20 + Math.floor(r() * 15),
      committed: false,
    });
  }

  return entries;
}
