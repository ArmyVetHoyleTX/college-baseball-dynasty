import React, { useState, useMemo, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import { useGameStore } from "../src/store/gameStore";
import { useRosterStore } from "../src/store/rosterStore";
import { Recruit, TransferPortalEntry } from "../src/models/game";
import { generateRecruitPool, spendRecruitingPoints, offerScholarship, setNilOffer, processCommits } from "../src/engine/recruitingEngine";
import { starString, fmtNil } from "../src/utils/formatting";

type RecruitTab = "pool" | "portal" | "offers";

function StarBadge({ stars }: { stars: number }) {
  const colors = ["", "#ef4444", "#f97316", "#f59e0b", "#3b82f6", "#8b5cf6"];
  return (
    <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: colors[stars] + "33" }}>
      <Text style={{ color: colors[stars] }} className="text-xs font-bold">
        {stars}★
      </Text>
    </View>
  );
}

export default function RecruitingScreen() {
  const { gameState, schools } = useGameStore();
  const { recruitPool, setRecruitPool, transferPortal, investRecruitingPoints, commitRecruit } = useRosterStore();
  const [tab, setTab] = useState<RecruitTab>("pool");
  const [recruitingState, setRecruitingState] = useState<Record<string, number>>({}); // recruitId → points invested

  // Initialize recruit pool on first load
  useEffect(() => {
    if (gameState && recruitPool.length === 0) {
      setRecruitPool(generateRecruitPool(gameState.season));
    }
  }, [gameState?.season]);

  if (!gameState) return null;

  const userSchool = schools.find((s) => s.id === gameState.userSchoolId);
  const totalPointsSpent = Object.values(recruitingState).reduce((a, b) => a + b, 0);
  const pointsLeft = gameState.recruitingPoints - totalPointsSpent;

  const sortedPool = useMemo(() =>
    [...recruitPool]
      .filter((r) => !r.isCommitted)
      .sort((a, b) => {
        // Sort by interest in user school first, then stars
        const aInterest = a.interest[gameState.userSchoolId] ?? 0;
        const bInterest = b.interest[gameState.userSchoolId] ?? 0;
        if (bInterest !== aInterest) return bInterest - aInterest;
        return b.stars - a.stars;
      }),
    [recruitPool, gameState.userSchoolId],
  );

  const committed = useMemo(() =>
    recruitPool.filter((r) => r.committedToSchoolId === gameState.userSchoolId),
    [recruitPool, gameState.userSchoolId],
  );

  const handleSpend = (recruit: Recruit, points: number) => {
    if (pointsLeft < points) {
      Alert.alert("Not enough recruiting points");
      return;
    }
    setRecruitingState((prev) => ({
      ...prev,
      [recruit.id]: (prev[recruit.id] ?? 0) + points,
    }));
    investRecruitingPoints(recruit.id, points);
  };

  const getInterest = (r: Recruit) => Math.min(100, (r.interest[gameState.userSchoolId] ?? 0) + (recruitingState[r.id] ?? 0) * 2.5);

  const interestBarColor = (pct: number) => {
    if (pct >= 75) return "#22c55e";
    if (pct >= 50) return "#f59e0b";
    if (pct >= 25) return "#3b82f6";
    return "#ef4444";
  };

  return (
    <View className="flex-1 bg-night">
      {/* Points header */}
      <View className="px-4 pt-4 pb-2 bg-night-card border-b border-night-border flex-row items-center">
        <View className="flex-1">
          <Text className="text-white font-bold text-base">Recruiting Points</Text>
          <Text className="text-night-text text-xs">Remaining: {pointsLeft}/{gameState.recruitingPoints}</Text>
        </View>
        <View className="h-3 w-48 bg-night rounded-full overflow-hidden">
          <View
            className="h-full bg-success rounded-full"
            style={{ width: `${(pointsLeft / gameState.recruitingPoints) * 100}%` }}
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 py-2 gap-2">
        {(["pool","portal","offers"] as RecruitTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            className={`px-4 py-2 rounded-xl ${tab === t ? "bg-success" : "bg-night-card border border-night-border"}`}
            onPress={() => setTab(t)}
          >
            <Text className={tab === t ? "text-white font-bold text-sm" : "text-night-text text-sm"}>
              {t === "pool" ? "Recruits" : t === "portal" ? "Transfer Portal" : `Offers (${committed.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "pool" && (
        <FlatList
          data={sortedPool.slice(0, 80)}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item: recruit }) => {
            const interest = getInterest(recruit);
            const spent = recruitingState[recruit.id] ?? 0;
            return (
              <View className="mb-3 bg-night-card border border-night-border rounded-xl overflow-hidden">
                <View className="flex-row items-center p-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <Text className="text-white font-semibold">{recruit.name}</Text>
                      <StarBadge stars={recruit.stars} />
                      <Text className="text-night-text text-xs">{recruit.position}</Text>
                      <Text className="text-night-text text-xs">{recruit.state}</Text>
                    </View>
                    <Text className="text-night-text text-xs mt-0.5">
                      NIL expectation: {fmtNil(recruit.nilExpectation)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white font-bold text-sm">{Math.round(interest)}%</Text>
                    <Text className="text-night-text text-xs">Interest</Text>
                  </View>
                </View>

                {/* Interest bar */}
                <View className="mx-3 mb-2 h-2 bg-night rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${interest}%`, backgroundColor: interestBarColor(interest) }}
                  />
                </View>

                {/* Actions */}
                <View className="flex-row border-t border-night-border">
                  <TouchableOpacity
                    className="flex-1 py-2 items-center border-r border-night-border"
                    onPress={() => handleSpend(recruit, 1)}
                  >
                    <Text className="text-info text-sm font-semibold">+1pt Scout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 py-2 items-center border-r border-night-border"
                    onPress={() => handleSpend(recruit, 3)}
                  >
                    <Text className="text-success text-sm font-semibold">+3pt Push</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 py-2 items-center"
                    onPress={() => Alert.alert("Scholarship Offered", `Offered scholarship to ${recruit.name}`)}
                  >
                    <Text className="text-gold text-sm font-semibold">📄 Offer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {tab === "portal" && (
        <View className="flex-1 items-center justify-center p-8">
          {!gameState.transferPortalOpen ? (
            <>
              <Text className="text-white text-4xl mb-4">🚪</Text>
              <Text className="text-white font-bold text-lg mb-2">Transfer Portal Closed</Text>
              <Text className="text-night-text text-center">
                The transfer portal opens in December and again after the postseason.
              </Text>
            </>
          ) : (
            <FlatList
              data={transferPortal}
              keyExtractor={(e) => e.playerId}
              renderItem={({ item }) => (
                <View className="mb-3 bg-night-card border border-night-border rounded-xl p-3">
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{item.position} · {item.fromSchoolId}</Text>
                      <StarBadge stars={item.stars} />
                    </View>
                    <Text className="text-night-text text-xs">NIL: {fmtNil(item.nilExpectation)}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {tab === "offers" && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {committed.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-white text-4xl mb-4">📋</Text>
              <Text className="text-white font-bold text-lg mb-2">No Commitments Yet</Text>
              <Text className="text-night-text text-center">
                Scout recruits and offer scholarships to build your class.
              </Text>
            </View>
          ) : (
            committed.map((r) => (
              <View key={r.id} className="mb-3 bg-success/10 border border-success/30 rounded-xl p-3 flex-row items-center">
                <View className="flex-1">
                  <Text className="text-success font-bold">{r.name}</Text>
                  <Text className="text-night-text text-xs">{r.position} · {r.state}</Text>
                </View>
                <StarBadge stars={r.stars} />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
