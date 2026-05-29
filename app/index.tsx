import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../src/store/gameStore";
import { useRosterStore } from "../src/store/rosterStore";
import { SCHOOL_TEMPLATES } from "../src/data/schools";
import { fmtRecord, ordinal } from "../src/utils/formatting";

// ─── School Picker (shown when no game loaded) ────────────────────────────────
function SchoolPicker() {
  const [search, setSearch] = useState("");
  const startNewDynasty = useGameStore((s) => s.startNewDynasty);
  const initRosters = useRosterStore((s) => s.initRosters);
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  const filtered = SCHOOL_TEMPLATES.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.shortName.toLowerCase().includes(search.toLowerCase()),
  ).sort((a, b) => b.prestige - a.prestige);

  const handlePick = (schoolId: string) => {
    setStarting(true);
    // Small delay so UI doesn't freeze
    setTimeout(() => {
      initRosters(2025);
      startNewDynasty(schoolId);
      setStarting(false);
    }, 50);
  };

  return (
    <View className="flex-1 bg-night">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View className="pt-16 pb-6 px-5 bg-night-card border-b border-night-border">
        <Text className="text-white text-3xl font-bold">⚾ College Baseball Dynasty</Text>
        <Text className="text-night-text mt-1">Pick your program and build a dynasty</Text>
      </View>

      {starting && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="text-night-text mt-3">Building rosters...</Text>
        </View>
      )}

      {!starting && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="mb-3 bg-night-card border border-night-border rounded-xl p-4 flex-row items-center"
              onPress={() => handlePick(item.id)}
            >
              <View
                className="w-2 h-full rounded-full mr-3"
                style={{ backgroundColor: item.primaryColor, width: 4, height: 48 }}
              />
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">{item.name}</Text>
                <Text className="text-night-text text-sm">{item.nickname} · {item.conference.toUpperCase()}</Text>
              </View>
              <View className="items-end">
                <Text className="text-gold font-bold text-sm">★ {item.prestige}</Text>
                <Text className="text-night-text text-xs">Prestige</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// ─── Dashboard (shown when game is active) ────────────────────────────────────
function Dashboard() {
  const { gameState, schools } = useGameStore();
  const router = useRouter();

  if (!gameState) return null;

  const userSchool = schools.find((s) => s.id === gameState.userSchoolId);
  const upcomingGames = gameState.schedule
    .filter((g) =>
      (g.homeTeamId === gameState.userSchoolId || g.awayTeamId === gameState.userSchoolId) &&
      !g.result &&
      g.week >= gameState.week,
    )
    .slice(0, 5);

  const topRankings = gameState.nationalRankings.slice(0, 5);
  const userRanking = gameState.nationalRankings.find(
    (r) => r.schoolId === gameState.userSchoolId,
  );

  const getSchoolName = (id: string) =>
    schools.find((s) => s.id === id)?.shortName ?? id.toUpperCase();

  return (
    <ScrollView className="flex-1 bg-night" contentContainerStyle={{ padding: 16 }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* School header */}
      <View
        className="rounded-2xl p-5 mb-4 border border-night-border"
        style={{ backgroundColor: userSchool?.primaryColor ?? "#1e293b" }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">{userSchool?.shortName}</Text>
            <Text className="text-white/80 text-sm">{userSchool?.nickname}</Text>
          </View>
          <View className="items-end">
            <Text className="text-white text-2xl font-bold">
              {fmtRecord(userSchool?.wins ?? 0, userSchool?.losses ?? 0)}
            </Text>
            {userRanking && (
              <Text className="text-white/80 text-sm">#{userRanking.rank} nationally</Text>
            )}
          </View>
        </View>
        <View className="flex-row mt-3 gap-4">
          <View className="bg-black/20 rounded-lg px-3 py-1.5">
            <Text className="text-white text-xs">Season {gameState.season}</Text>
          </View>
          <View className="bg-black/20 rounded-lg px-3 py-1.5">
            <Text className="text-white text-xs capitalize">{gameState.phase.replace(/_/g, " ")}</Text>
          </View>
          <View className="bg-black/20 rounded-lg px-3 py-1.5">
            <Text className="text-white text-xs">Week {gameState.week}</Text>
          </View>
        </View>
      </View>

      {/* Quick stats */}
      <View className="flex-row gap-3 mb-4">
        <StatCard label="Prestige" value={String(userSchool?.prestige ?? 0)} icon="star" />
        <StatCard label="Recruiting #" value={String(userSchool?.recruitingRank ?? "—")} icon="school" />
        <StatCard label="NIL Budget" value={`$${userSchool?.nilBudget ?? 0}K`} icon="cash" />
      </View>

      {/* Upcoming schedule */}
      <Text className="text-white font-semibold text-lg mb-2">Upcoming Games</Text>
      {upcomingGames.length === 0 ? (
        <View className="bg-night-card border border-night-border rounded-xl p-4 mb-4">
          <Text className="text-night-text text-center">No games scheduled</Text>
        </View>
      ) : (
        <View className="bg-night-card border border-night-border rounded-xl mb-4 overflow-hidden">
          {upcomingGames.map((game, idx) => {
            const isHome = game.homeTeamId === gameState.userSchoolId;
            const opp = isHome ? game.awayTeamId : game.homeTeamId;
            return (
              <View
                key={game.id}
                className={`flex-row items-center p-3 ${idx < upcomingGames.length - 1 ? "border-b border-night-border" : ""}`}
              >
                <View className="bg-night rounded-lg px-2 py-1 mr-3">
                  <Text className="text-night-text text-xs">Wk {game.week}</Text>
                </View>
                <Text className="text-white flex-1">
                  {isHome ? "vs" : "@"} {getSchoolName(opp)}
                </Text>
                {game.isConferenceGame && (
                  <View className="bg-info/20 rounded px-2 py-0.5">
                    <Text className="text-info text-xs">Conf</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* National rankings */}
      <Text className="text-white font-semibold text-lg mb-2">Top 5 Rankings</Text>
      <View className="bg-night-card border border-night-border rounded-xl overflow-hidden mb-4">
        {topRankings.length === 0 && (
          <View className="p-4">
            <Text className="text-night-text text-center">Rankings available after Week 3</Text>
          </View>
        )}
        {topRankings.map((r, idx) => (
          <View
            key={r.schoolId}
            className={`flex-row items-center p-3 ${r.schoolId === gameState.userSchoolId ? "bg-success/10" : ""} ${idx < topRankings.length - 1 ? "border-b border-night-border" : ""}`}
          >
            <Text className="text-gold font-bold w-8">#{r.rank}</Text>
            <Text className="text-white flex-1">{getSchoolName(r.schoolId)}</Text>
            <Text className="text-night-text text-sm">{r.record}</Text>
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-3 mb-8">
        <TouchableOpacity
          className="flex-1 bg-success rounded-xl py-4 items-center"
          onPress={() => router.push("/schedule")}
        >
          <Text className="text-white font-bold">Go to Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-night-card border border-night-border rounded-xl py-4 items-center"
          onPress={() => router.push("/school")}
        >
          <Text className="text-white font-bold">Program</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="flex-1 bg-night-card border border-night-border rounded-xl p-3">
      <Ionicons name={icon} size={18} color="#94a3b8" />
      <Text className="text-white font-bold text-lg mt-1">{value}</Text>
      <Text className="text-night-text text-xs">{label}</Text>
    </View>
  );
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const gameState = useGameStore((s) => s.gameState);
  return gameState ? <Dashboard /> : <SchoolPicker />;
}
