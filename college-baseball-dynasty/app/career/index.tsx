import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { fmtAvg, fmtEra, fmtIp, starString } from "../../src/utils/formatting";
import { useRosterStore } from "../../src/store/rosterStore";
import { useGameStore } from "../../src/store/gameStore";

export default function CareerHomeScreen() {
  const { gameState } = useGameStore();
  const players = useRosterStore((s) => s.players);

  if (!gameState || gameState.gameMode !== "career" || !gameState.careerPlayerId) {
    return (
      <View className="flex-1 bg-night items-center justify-center p-8">
        <Text className="text-white text-5xl mb-4">⚾</Text>
        <Text className="text-white text-xl font-bold mb-2">Career Mode</Text>
        <Text className="text-night-text text-center mb-8">
          Play as a specific player, earn training points, and work your way from freshman to legend — then become a coach.
        </Text>
        <TouchableOpacity className="bg-success rounded-2xl px-8 py-4">
          <Text className="text-white font-bold text-lg">Start Career (Coming Soon)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const careerPlayer = players[gameState.careerPlayerId];
  if (!careerPlayer) return null;

  const isPitcher = ["SP", "RP"].includes(careerPlayer.position);
  const s = careerPlayer.seasonStats;

  return (
    <ScrollView className="flex-1 bg-night" contentContainerStyle={{ padding: 16 }}>
      {/* Player header */}
      <View className="bg-night-card border border-night-border rounded-2xl p-5 mb-4">
        <Text className="text-white text-2xl font-bold">{careerPlayer.name}</Text>
        <Text className="text-night-text">{careerPlayer.position} · {careerPlayer.year}</Text>
        <Text className="text-gold mt-1">{starString(careerPlayer.potential)} potential</Text>
      </View>

      {/* Quick stats */}
      <View className="bg-night-card border border-night-border rounded-xl p-4 mb-4">
        <Text className="text-white font-bold mb-3">This Season</Text>
        {isPitcher ? (
          <View className="flex-row flex-wrap gap-6">
            <StatItem label="ERA" value={fmtEra(s.er, s.ip)} />
            <StatItem label="IP" value={fmtIp(s.ip)} />
            <StatItem label="W-L" value={`${s.wins}-${s.losses}`} />
            <StatItem label="K" value={String(s.kp)} />
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-6">
            <StatItem label="AVG" value={fmtAvg(s.h, s.ab)} />
            <StatItem label="HR" value={String(s.hr)} />
            <StatItem label="RBI" value={String(s.rbi)} />
            <StatItem label="SB" value={String(s.sb)} />
          </View>
        )}
      </View>

      {/* Training week */}
      <Text className="text-white font-bold text-lg mb-2">Training</Text>
      <View className="bg-night-card border border-night-border rounded-xl p-4 mb-4">
        <Text className="text-night-text text-sm mb-3">
          Allocate your weekly training points to improve your ratings.
        </Text>
        {[
          { label: "Hitting / Pitching", color: "#22c55e" },
          { label: "Fielding", color: "#3b82f6" },
          { label: "Conditioning", color: "#f59e0b" },
        ].map((item) => (
          <View key={item.label} className="flex-row items-center mb-3">
            <Text className="text-white flex-1">{item.label}</Text>
            <TouchableOpacity className="bg-night border border-night-border rounded-lg w-8 h-8 items-center justify-center mr-2">
              <Text className="text-white font-bold">−</Text>
            </TouchableOpacity>
            <Text className="text-white w-6 text-center font-bold">3</Text>
            <TouchableOpacity className="bg-night border border-night-border rounded-lg w-8 h-8 items-center justify-center ml-2" style={{ borderColor: item.color }}>
              <Text style={{ color: item.color }} className="font-bold">+</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Post-playing coaching path teaser */}
      <View className="bg-night-card border border-night-border rounded-xl p-4 mb-8">
        <Text className="text-white font-bold mb-2">Coaching Path</Text>
        <Text className="text-night-text text-sm">
          After your playing career, you'll transition to coaching. Accumulate enough success to become a Head Coach and start your own Dynasty.
        </Text>
        <View className="flex-row mt-3 gap-2 flex-wrap">
          {["Player", "Grad Asst.", "Asst. Coach", "Assoc. HC", "Head Coach"].map((stage, i) => (
            <View
              key={stage}
              className={`px-2 py-1 rounded-lg ${i === 0 ? "bg-success/20 border border-success/40" : "bg-night border border-night-border"}`}
            >
              <Text className={i === 0 ? "text-success text-xs" : "text-night-text text-xs"}>{stage}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-white font-bold text-lg">{value}</Text>
      <Text className="text-night-text text-xs">{label}</Text>
    </View>
  );
}
