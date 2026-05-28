import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Player } from "../models/player";
import { Recruit, TransferPortalEntry } from "../models/game";
import { generateRoster } from "../engine/playerFactory";
import { SCHOOL_TEMPLATES } from "../data/schools";

interface RosterStore {
  players: Record<string, Player>;   // id → Player
  recruitPool: Recruit[];
  transferPortal: TransferPortalEntry[];
  recruitingInterest: Record<string, number>;  // recruitId → points invested
  transferInterest: Record<string, number>;    // playerId → points invested

  // Actions
  initRosters: (season: number) => void;
  updatePlayer: (player: Player) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  getSchoolRoster: (schoolId: string) => Player[];
  setRecruitPool: (recruits: Recruit[]) => void;
  setTransferPortal: (entries: TransferPortalEntry[]) => void;
  investRecruitingPoints: (recruitId: string, points: number) => void;
  commitRecruit: (recruit: Recruit, schoolId: string) => void;
  commitTransfer: (entry: TransferPortalEntry, schoolId: string) => void;
  bulkUpdatePlayers: (players: Player[]) => void;
}

export const useRosterStore = create<RosterStore>()(
  persist(
    (set, get) => ({
      players: {},
      recruitPool: [],
      transferPortal: [],
      recruitingInterest: {},
      transferInterest: {},

      initRosters: (season: number) => {
        const players: Record<string, Player> = {};
        for (const school of SCHOOL_TEMPLATES) {
          const roster = generateRoster(school.id, school.prestige, season, school.prestige * season);
          for (const p of roster) {
            players[p.id] = p;
          }
        }
        set({ players });
      },

      updatePlayer: (player) => {
        set((state) => ({ players: { ...state.players, [player.id]: player } }));
      },

      addPlayer: (player) => {
        set((state) => ({ players: { ...state.players, [player.id]: player } }));
      },

      removePlayer: (playerId) => {
        set((state) => {
          const { [playerId]: _, ...rest } = state.players;
          return { players: rest };
        });
      },

      getSchoolRoster: (schoolId) => {
        return Object.values(get().players).filter((p) => p.schoolId === schoolId);
      },

      setRecruitPool: (recruits) => set({ recruitPool: recruits }),

      setTransferPortal: (entries) => set({ transferPortal: entries }),

      investRecruitingPoints: (recruitId, points) => {
        set((state) => ({
          recruitingInterest: {
            ...state.recruitingInterest,
            [recruitId]: (state.recruitingInterest[recruitId] ?? 0) + points,
          },
        }));
      },

      commitRecruit: (recruit, schoolId) => {
        // Find a template to convert recruit to player
        set((state) => ({
          recruitPool: state.recruitPool.filter((r) => r.id !== recruit.id),
        }));
      },

      commitTransfer: (entry, schoolId) => {
        set((state) => {
          const player = state.players[entry.playerId];
          if (!player) return state;
          return {
            players: {
              ...state.players,
              [player.id]: { ...player, schoolId, isInTransferPortal: false },
            },
            transferPortal: state.transferPortal.filter((e) => e.playerId !== entry.playerId),
          };
        });
      },

      bulkUpdatePlayers: (players) => {
        set((state) => {
          const updated = { ...state.players };
          for (const p of players) updated[p.id] = p;
          return { players: updated };
        });
      },
    }),
    {
      name: "cbd-roster-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
