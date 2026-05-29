import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Player } from "../models/player";
import { Recruit, TransferPortalEntry } from "../models/game";
import { generateRoster } from "../engine/playerFactory";

interface RosterStore {
  // Only the user's school roster is stored — CPU rosters are generated on demand
  players: Record<string, Player>;
  recruitPool: Recruit[];
  transferPortal: TransferPortalEntry[];
  recruitingInterest: Record<string, number>;
  transferInterest: Record<string, number>;

  // Actions
  initUserRoster: (schoolId: string, prestige: number, season: number) => void;
  updatePlayer: (player: Player) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  getUserRoster: () => Player[];
  setRecruitPool: (recruits: Recruit[]) => void;
  setTransferPortal: (entries: TransferPortalEntry[]) => void;
  investRecruitingPoints: (recruitId: string, points: number) => void;
  commitRecruit: (recruit: Recruit, schoolId: string) => void;
  commitTransfer: (entry: TransferPortalEntry, schoolId: string) => void;
  bulkUpdatePlayers: (players: Player[]) => void;
  clearRoster: () => void;
}

export const useRosterStore = create<RosterStore>()(
  persist(
    (set, get) => ({
      players: {},
      recruitPool: [],
      transferPortal: [],
      recruitingInterest: {},
      transferInterest: {},

      // Only generate + store the user's own roster
      initUserRoster: (schoolId, prestige, season) => {
        const roster = generateRoster(schoolId, prestige, season, prestige * season);
        const players: Record<string, Player> = {};
        for (const p of roster) players[p.id] = p;
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

      getUserRoster: () => Object.values(get().players),

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

      commitRecruit: (recruit, _schoolId) => {
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

      clearRoster: () => set({ players: {}, recruitPool: [], transferPortal: [] }),
    }),
    {
      name: "cbd-roster-store-v2",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
