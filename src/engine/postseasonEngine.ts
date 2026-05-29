import { PostseasonBracket, BracketGroup, BracketSeries, CWSBracket, NationalRanking, ConferenceStandings } from "../models/season";
import { ScheduledGame } from "../models/game";
import { simulateGame, TeamLineup } from "./gameEngine";
import { buildLineup, buildBullpen } from "./playerFactory";
import { Player } from "../models/player";
import { seedAtBatRng } from "./atBatEngine";

export function buildPostseasonBracket(
  nationalRankings: NationalRanking[],
  conferenceStandings: ConferenceStandings[],
): PostseasonBracket {
  // Top 16 RPI programs host regionals
  const regionalHosts = nationalRankings.slice(0, 16).map((r) => r.schoolId);

  // Get conference champions (win their conf tournament) → guaranteed regionals
  const confChamps = conferenceStandings
    .map((cs) => cs.standings[0]?.schoolId)
    .filter(Boolean) as string[];

  // Fill 64 regional spots: 16 hosts + 48 at-larges from RPI
  const atLargePool = nationalRankings
    .slice(16, 64)
    .map((r) => r.schoolId)
    .filter((id) => !confChamps.includes(id));

  const regionalTeams = [...confChamps, ...atLargePool].slice(0, 48);
  const allRegionalTeams = [...regionalHosts, ...regionalTeams].slice(0, 64);

  // Build 16 regional groups of 4
  const regionals: BracketGroup[] = regionalHosts.map((hostId, i) => ({
    hostSchoolId: hostId,
    teams: [hostId, allRegionalTeams[i * 3 + 16] ?? hostId, allRegionalTeams[i * 3 + 17] ?? hostId, allRegionalTeams[i * 3 + 18] ?? hostId],
    results: [],
    winner: null,
  }));

  // 8 super regional pairings (winners bracket)
  const superRegionals: BracketSeries[] = Array.from({ length: 8 }, (_, i) => ({
    team1Id: regionals[i * 2]?.hostSchoolId ?? "",
    team2Id: regionals[i * 2 + 1]?.hostSchoolId ?? "",
    team1Wins: 0,
    team2Wins: 0,
    winner: null,
  }));

  // 8 CWS teams (super regional winners split into 2 pools)
  const cws: CWSBracket = {
    pool1: superRegionals.slice(0, 4).map((s) => s.team1Id),
    pool2: superRegionals.slice(4, 8).map((s) => s.team1Id),
    semifinal1Winner: null,
    semifinal2Winner: null,
    champion: null,
  };

  return { regionals, superRegionals, cws };
}

// Simulate a regional (4-team double-elimination)
export function simulateRegional(
  group: BracketGroup,
  rosterMap: Record<string, Player[]>,
  seed?: number,
): BracketGroup {
  if (seed !== undefined) seedAtBatRng(seed);

  const teams = [...group.teams];
  const wins: Record<string, number> = {};
  const losses: Record<string, number> = {};
  for (const t of teams) { wins[t] = 0; losses[t] = 0; }

  const activePairs: [string, string][] = [
    [teams[0], teams[3]], // 1 vs 4
    [teams[1], teams[2]], // 2 vs 3
  ];

  function simGame(a: string, b: string): string {
    const aRoster = rosterMap[a] ?? [];
    const bRoster = rosterMap[b] ?? [];
    const aLineup = buildTeamLineup(a, aRoster);
    const bLineup = buildTeamLineup(b, bRoster);
    const result = simulateGame(aLineup, bLineup);
    return result.boxScore.winnerTeamId;
  }

  // Winners bracket
  const w1 = simGame(teams[0], teams[3]);
  const w2 = simGame(teams[1], teams[2]);
  // Losers bracket
  const l1 = teams[0] === w1 ? teams[3] : teams[0];
  const l2 = teams[1] === w2 ? teams[2] : teams[1];
  const losersBracketWinner = simGame(l1, l2);
  // Semifinal: winners bracket winner vs losers bracket winner
  const sf1 = simGame(w1, losersBracketWinner);
  const sf2 = simGame(w2, losersBracketWinner === sf1 ? l2 : losersBracketWinner);
  // Championship
  const champion = simGame(sf1, sf2);

  return { ...group, winner: champion };
}

// Simulate a super regional (best of 3)
export function simulateSuperRegional(
  series: BracketSeries,
  rosterMap: Record<string, Player[]>,
): BracketSeries {
  let team1Wins = 0, team2Wins = 0;

  function simGame(a: string, b: string): string {
    const aLineup = buildTeamLineup(a, rosterMap[a] ?? []);
    const bLineup = buildTeamLineup(b, rosterMap[b] ?? []);
    return simulateGame(aLineup, bLineup).boxScore.winnerTeamId;
  }

  while (team1Wins < 2 && team2Wins < 2) {
    const winner = simGame(series.team1Id, series.team2Id);
    if (winner === series.team1Id) team1Wins++;
    else team2Wins++;
  }

  return {
    ...series,
    team1Wins,
    team2Wins,
    winner: team1Wins >= 2 ? series.team1Id : series.team2Id,
  };
}

// Simulate the full CWS (8 teams, double-elimination, 2 pools of 4)
export function simulateCWS(
  cws: CWSBracket,
  rosterMap: Record<string, Player[]>,
): CWSBracket {
  function simGame(a: string, b: string): string {
    const aLineup = buildTeamLineup(a, rosterMap[a] ?? []);
    const bLineup = buildTeamLineup(b, rosterMap[b] ?? []);
    return simulateGame(aLineup, bLineup).boxScore.winnerTeamId;
  }

  // Simplified: pick winner from each pool then championship
  const pool1Teams = [...cws.pool1];
  const pool2Teams = [...cws.pool2];

  // Pool mini-tournament (double-elim simplified to a round-robin winner)
  const sf1Winner = simulatePoolWinner(pool1Teams, simGame);
  const sf2Winner = simulatePoolWinner(pool2Teams, simGame);

  const champion = simGame(sf1Winner, sf2Winner);

  return {
    ...cws,
    pool1: pool1Teams,
    pool2: pool2Teams,
    semifinal1Winner: sf1Winner,
    semifinal2Winner: sf2Winner,
    champion,
  };
}

function simulatePoolWinner(
  teams: string[],
  simGame: (a: string, b: string) => string,
): string {
  // Simple round-robin to determine pool winner
  const wins: Record<string, number> = {};
  for (const t of teams) wins[t] = 0;

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const w = simGame(teams[i], teams[j]);
      wins[w]++;
    }
  }

  return teams.sort((a, b) => wins[b] - wins[a])[0];
}

function buildTeamLineup(schoolId: string, roster: Player[]): TeamLineup {
  const { starter, bullpen } = buildBullpen(roster);
  const lineup = buildLineup(roster);
  return { schoolId, lineup, startingPitcher: starter, bullpen };
}
