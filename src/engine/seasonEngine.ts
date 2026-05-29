import { ScheduledGame } from "../models/game";
import { Standing, ConferenceStandings, NationalRanking } from "../models/season";
import { SCHOOL_TEMPLATES } from "../data/schools";
import { CONFERENCES } from "../data/conferences";

let _gameIdCounter = 0;
function nextGameId(): string { return `game_${_gameIdCounter++}`; }

// Build a 56-game schedule for all schools
// Each school plays ~30 conference games + ~26 non-conference
export function generateSchedule(season: number): ScheduledGame[] {
  const games: ScheduledGame[] = [];

  // Group schools by conference
  const confMap: Record<string, string[]> = {};
  for (const school of SCHOOL_TEMPLATES) {
    if (!confMap[school.conference]) confMap[school.conference] = [];
    confMap[school.conference].push(school.id);
  }

  // Conference games (series format: 3-game weekend series)
  for (const [confId, schoolIds] of Object.entries(confMap)) {
    const pairs = roundRobin(schoolIds);
    for (const [a, b] of pairs) {
      // 3-game series (Fri/Sat/Sun pattern)
      const week = 3 + Math.floor(Math.random() * 12); // weeks 3–14
      for (let g = 0; g < 3; g++) {
        const homeFirst = Math.random() > 0.5;
        games.push({
          id: nextGameId(),
          week: week + (g === 2 ? 0 : 0), // same week for series
          homeTeamId: homeFirst ? a : b,
          awayTeamId: homeFirst ? b : a,
          isConferenceGame: true,
          isPostseason: false,
        });
      }
    }
  }

  // Non-conference games (fill remaining to ~56 total per team)
  const schoolIds = SCHOOL_TEMPLATES.map((s) => s.id);
  const ncGames = 300; // total non-conference game pairs
  for (let i = 0; i < ncGames; i++) {
    const aIdx = Math.floor(Math.random() * schoolIds.length);
    let bIdx = Math.floor(Math.random() * schoolIds.length);
    while (bIdx === aIdx) bIdx = Math.floor(Math.random() * schoolIds.length);
    const week = 1 + Math.floor(Math.random() * 15);
    games.push({
      id: nextGameId(),
      week,
      homeTeamId: schoolIds[aIdx],
      awayTeamId: schoolIds[bIdx],
      isConferenceGame: false,
      isPostseason: false,
    });
  }

  return games.sort((a, b) => a.week - b.week);
}

// Simple round-robin pairing (each team plays every other team once)
function roundRobin(teams: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push([teams[i], teams[j]]);
    }
  }
  return pairs;
}

// Compute conference standings from game results
export function computeStandings(
  games: ScheduledGame[],
  conferenceId: string,
  schoolIds: string[],
): Standing[] {
  const records: Record<string, { wins: number; losses: number; confWins: number; confLosses: number }> = {};
  for (const id of schoolIds) {
    records[id] = { wins: 0, losses: 0, confWins: 0, confLosses: 0 };
  }

  for (const game of games) {
    if (!game.result) continue;
    const { winnerTeamId, loserTeamId } = game.result;
    if (records[winnerTeamId]) {
      records[winnerTeamId].wins++;
      if (game.isConferenceGame) records[winnerTeamId].confWins++;
    }
    if (records[loserTeamId]) {
      records[loserTeamId].losses++;
      if (game.isConferenceGame) records[loserTeamId].confLosses++;
    }
  }

  const sorted = schoolIds
    .map((id) => ({ id, ...records[id] }))
    .sort((a, b) => {
      const aWinPct = a.confWins / Math.max(1, a.confWins + a.confLosses);
      const bWinPct = b.confWins / Math.max(1, b.confWins + b.confLosses);
      return bWinPct - aWinPct;
    });

  const leader = sorted[0];
  const leaderWinPct = leader
    ? leader.confWins / Math.max(1, leader.confWins + leader.confLosses)
    : 0;

  return sorted.map((s) => {
    const winPct = s.confWins / Math.max(1, s.confWins + s.confLosses);
    return {
      schoolId: s.id,
      wins: s.wins,
      losses: s.losses,
      confWins: s.confWins,
      confLosses: s.confLosses,
      gb: ((leaderWinPct - winPct) * (s.confWins + s.confLosses)) / 2,
      rpi: computeRPI(s.id, games),
    };
  });
}

function computeRPI(
  schoolId: string,
  games: ScheduledGame[],
): number {
  const schoolGames = games.filter(
    (g) => (g.homeTeamId === schoolId || g.awayTeamId === schoolId) && g.result,
  );
  if (schoolGames.length === 0) return 0.5;

  let wins = 0;
  let total = 0;
  let oppWinPct = 0;
  let oppOppWinPct = 0;

  for (const game of schoolGames) {
    total++;
    if (game.result!.winnerTeamId === schoolId) wins++;
    const oppId = game.homeTeamId === schoolId ? game.awayTeamId : game.homeTeamId;
    // Simplified: use overall record as proxy
    const oppGames = games.filter(
      (g) => (g.homeTeamId === oppId || g.awayTeamId === oppId) && g.result,
    );
    const oppWins = oppGames.filter((g) => g.result!.winnerTeamId === oppId).length;
    oppWinPct += oppGames.length > 0 ? oppWins / oppGames.length : 0.5;
    oppOppWinPct += 0.5; // simplified
  }

  const ownWinPct = total > 0 ? wins / total : 0.5;
  const avgOppWinPct = total > 0 ? oppWinPct / total : 0.5;
  const avgOppOppWinPct = oppOppWinPct / total;

  // Standard RPI weights: 0.25 own + 0.50 opp + 0.25 opp-opp
  return 0.25 * ownWinPct + 0.50 * avgOppWinPct + 0.25 * avgOppOppWinPct;
}

export function computeNationalRankings(
  allStandings: ConferenceStandings[],
  games: ScheduledGame[],
): NationalRanking[] {
  const schoolRpis: { schoolId: string; rpi: number; wins: number; losses: number }[] = [];

  for (const conf of allStandings) {
    for (const s of conf.standings) {
      schoolRpis.push({ schoolId: s.schoolId, rpi: s.rpi, wins: s.wins, losses: s.losses });
    }
  }

  schoolRpis.sort((a, b) => b.rpi - a.rpi);

  return schoolRpis.slice(0, 25).map((s, idx) => ({
    rank: idx + 1,
    schoolId: s.schoolId,
    rpi: s.rpi,
    record: `${s.wins}-${s.losses}`,
  }));
}
