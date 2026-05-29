import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
} from "react-native";
import { useGameStore } from "../src/store/gameStore";
import { CONFERENCES } from "../src/data/conferences";
import { fmtRecord } from "../src/utils/formatting";

export default function StandingsScreen() {
  const { gameState, schools } = useGameStore();
  const [view, setView] = useState<"conference" | "national">("national");
  const [selectedConf, setSelectedConf] = useState("sec");

  if (!gameState) return null;

  const getSchool = (id: string) => schools.find((s) => s.id === id);

  return (
    <View className="flex-1 bg-night">
      {/* Toggle */}
      <View className="flex-row px-4 pt-4 pb-2 gap-2">
        {(["national","conference"] as const).map((v) => (
          <TouchableOpacity
            key={v}
            className={`px-4 py-2 rounded-xl ${view === v ? "bg-success" : "bg-night-card border border-night-border"}`}
            onPress={() => setView(v)}
          >
            <Text className={view === v ? "text-white font-bold text-sm" : "text-night-text text-sm"}>
              {v === "national" ? "National" : "Conference"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === "national" && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View className="bg-night-card border border-night-border rounded-xl overflow-hidden">
            {/* Header */}
            <View className="flex-row px-4 py-2 border-b border-night-border">
              <Text className="text-night-text text-xs w-8">RK</Text>
              <Text className="text-night-text text-xs flex-1">School</Text>
              <Text className="text-night-text text-xs w-16 text-right">Record</Text>
              <Text className="text-night-text text-xs w-14 text-right">RPI</Text>
            </View>
            {gameState.nationalRankings.length === 0 && (
              <View className="p-6 items-center">
                <Text className="text-night-text">Rankings update after Week 3</Text>
              </View>
            )}
            {gameState.nationalRankings.map((r) => {
              const school = getSchool(r.schoolId);
              const isUser = r.schoolId === gameState.userSchoolId;
              return (
                <View
                  key={r.schoolId}
                  className={`flex-row items-center px-4 py-3 border-b border-night-border ${isUser ? "bg-success/10" : ""}`}
                >
                  <Text className="text-gold font-bold w-8">#{r.rank}</Text>
                  <View className="flex-1">
                    <Text className={`font-semibold ${isUser ? "text-success" : "text-white"}`}>
                      {school?.shortName ?? r.schoolId}
                    </Text>
                    <Text className="text-night-text text-xs">{school?.conference.toUpperCase()}</Text>
                  </View>
                  <Text className="text-white text-sm w-16 text-right">{r.record}</Text>
                  <Text className="text-night-text text-sm w-14 text-right">{r.rpi.toFixed(3)}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {view === "conference" && (
        <View className="flex-1">
          {/* Conference picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2">
            {CONFERENCES.map((conf) => (
              <TouchableOpacity
                key={conf.id}
                className={`mr-2 px-3 py-1.5 rounded-lg ${selectedConf === conf.id ? "bg-info" : "bg-night-card border border-night-border"}`}
                onPress={() => setSelectedConf(conf.id)}
              >
                <Text className={selectedConf === conf.id ? "text-white font-bold text-xs" : "text-night-text text-xs"}>
                  {conf.shortName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Conference standings table */}
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="bg-night-card border border-night-border rounded-xl overflow-hidden">
              <View className="flex-row px-4 py-2 border-b border-night-border">
                <Text className="text-night-text text-xs flex-1">Team</Text>
                <Text className="text-night-text text-xs w-16 text-center">Conf</Text>
                <Text className="text-night-text text-xs w-16 text-center">Overall</Text>
                <Text className="text-night-text text-xs w-12 text-right">GB</Text>
              </View>
              {(gameState.conferenceStandings.find((cs) => cs.conference === selectedConf)?.standings ?? []).map((s, idx) => {
                const school = getSchool(s.schoolId);
                const isUser = s.schoolId === gameState.userSchoolId;
                return (
                  <View
                    key={s.schoolId}
                    className={`flex-row items-center px-4 py-3 border-b border-night-border ${isUser ? "bg-success/10" : ""}`}
                  >
                    <View className="flex-1">
                      <Text className={`font-semibold ${isUser ? "text-success" : "text-white"}`}>
                        {school?.shortName ?? s.schoolId}
                      </Text>
                      {idx === 0 && <Text className="text-gold text-xs">Division Leader</Text>}
                    </View>
                    <Text className="text-white text-sm w-16 text-center">
                      {s.confWins}-{s.confLosses}
                    </Text>
                    <Text className="text-night-text text-sm w-16 text-center">
                      {fmtRecord(s.wins, s.losses)}
                    </Text>
                    <Text className="text-night-text text-sm w-12 text-right">
                      {idx === 0 ? "-" : s.gb.toFixed(1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
