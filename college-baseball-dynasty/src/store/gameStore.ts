import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState, GamePhase } from "../models/season";
import { ScheduledGame } from "../models/game";
import { School } from "../models/school";
import { SCHOOL_TEMPLATES } from "../data/schools";
import { generateSchedule, computeStandings, computeNationalRankings } from "../engine/seasonEngine";
import { generateRoster } from "../engine/playerFactory";
import { CONFERENCES } from "../data/conferences";

const CURRENT_VERSION = 1;
const INITIAL_SEASON = 2025;

function buildInitialSchool(templateId: string): School {
  const template = SCHOOL_TEMPLATES.find((s) => s.id === templateId);
  if (!template) throw new Error(`Unknown school: ${templateId}`);

  return {
    ...template,
    wins: 0,
    losses: 0,
    conferenceTitles: 0,
    cwsAppearances: 0,
    cwsTitles: 0,
    nationalRank: null,
    recruitingRank: 100,
    scholarshipsUsed: 10,
    nilBudget: 50 + template.prestige,
    nilSpent: 0,
    hallOfFame: [],
    isUserControlled: true,
    coaching: {
      headCoach: { name: "Coach Smith", xp: 0, level: 1, perkUnlocked: false },
      pitchingCoach: { name: "Coach Davis", xp: 0, level: 1, perkUnlocked: false },
      hittingCoach: { name: "Coach Wilson", xp: 0, level: 1, perkUnlocked: false },
      recruitingCoordinator: { name: "Coach Brown", xp: 0, level: 1, perkUnlocked: false },
    },
  };
}

interface GameStore {
  gameState: GameState | null;
  schools: School[];
  rosters: Record<string, string[]>; // schoolId → player IDs (players in rosterStore)
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewDynasty: (schoolId: string) => void;
  advanceWeek: () => void;
  advancePhase: (phase: GamePhase) => void;
  updateSchool: (schoolId: string, updates: Partial<School>) => void;
  recordGameResult: (game: ScheduledGame) => void;
  setError: (msg: string | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      schools: [],
      rosters: {},
      isLoading: false,
      error: null,

      startNewDynasty: (schoolId: string) => {
        const schedule = generateSchedule(INITIAL_SEASON);
        const allSchools: School[] = SCHOOL_TEMPLATES.map((t) => ({
          ...buildInitialSchool(t.id),
          isUserControlled: t.id === schoolId,
        }));

        const gameState: GameState = {
          version: CURRENT_VERSION,
          season: INITIAL_SEASON,
          week: 1,
          phase: "preseason",
          userSchoolId: schoolId,
          gameMode: "dynasty",
          schedule,
          conferenceStandings: CONFERENCES.map((conf) => {
            const confSchools = SCHOOL_TEMPLATES
              .filter((s) => s.conference === conf.id)
              .map((s) => s.id);
            return {
              conference: conf.id,
              standings: confSchools.map((id) => ({
                schoolId: id, wins: 0, losses: 0,
                confWins: 0, confLosses: 0, gb: 0, rpi: 0.5,
              })),
            };
          }),
          nationalRankings: [],
          recruitingPoints: 25 + Math.floor((allSchools.find((s) => s.id === schoolId)?.prestige ?? 50) / 20),
          transferPortalOpen: false,
          nilBudgetRemaining: allSchools.find((s) => s.id === schoolId)?.nilBudget ?? 50,
          settings: {
            scenariosEnabled: true,
            autoSimBullpen: true,
            simSpeed: "normal",
          },
        };

        set({ gameState, schools: allSchools });
      },

      advanceWeek: () => {
        set((state) => {
          if (!state.gameState) return state;
          return {
            gameState: {
              ...state.gameState,
              week: state.gameState.week + 1,
            },
          };
        });
      },

      advancePhase: (phase: GamePhase) => {
        set((state) => {
          if (!state.gameState) return state;
          return { gameState: { ...state.gameState, phase, week: 1 } };
        });
      },

      updateSchool: (schoolId, updates) => {
        set((state) => ({
          schools: state.schools.map((s) =>
            s.id === schoolId ? { ...s, ...updates } : s,
          ),
        }));
      },

      recordGameResult: (game: ScheduledGame) => {
        set((state) => {
          if (!state.gameState) return state;

          // Update school win/loss records
          const newSchools = state.schools.map((s) => {
            if (s.id === game.result?.winnerTeamId) return { ...s, wins: s.wins + 1 };
            if (s.id === game.result?.loserTeamId) return { ...s, losses: s.losses + 1 };
            return s;
          });

          // Update schedule
          const newSchedule = state.gameState.schedule.map((g) =>
            g.id === game.id ? game : g,
          );

          // Recompute standings
          const conferenceStandings = state.gameState.conferenceStandings.map((cs) => {
            const confSchoolIds = cs.standings.map((s) => s.schoolId);
            return {
              conference: cs.conference,
              standings: computeStandings(newSchedule, cs.conference, confSchoolIds),
            };
          });

          const nationalRankings = computeNationalRankings(conferenceStandings, newSchedule);

          return {
            schools: newSchools,
            gameState: {
              ...state.gameState,
              schedule: newSchedule,
              conferenceStandings,
              nationalRankings,
            },
          };
        });
      },

      setError: (msg) => set({ error: msg }),

      resetGame: () => set({ gameState: null, schools: [], rosters: {} }),
    }),
    {
      name: "cbd-game-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
