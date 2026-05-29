import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useGameStore } from "../src/store/gameStore";
import { useRosterStore } from "../src/store/rosterStore";
import {
  buildPostseasonBracket, simulateRegional, simulateSuperRegional, simulateCWS,
} from "../src/engine/postseasonEngine";
import { PostseasonBracket } from "../src/models/season";

export default function PostseasonScreen() {
  const { gameState, schools } = useGameStore();
  const getSchoolRoster = useRosterStore((s) => s.getSchoolRoster);
  const [bracket, setBracket] = useState<PostseasonBracket | null>(gameState?.postseasonBracket ?? null);
  const [simming, setSimming] = useState(false);
  const [round, setRound] = useState<"regionals" | "super_regionals" | "cws">("regionals");

  if (!gameState) return null;

  const getSchool = (id: string) => schools.find((s) => s.id === id);
  const rosterMap = Object.fromEntries(
    schools.map((s) => [s.id, getSchoolRoster(s.id)]),
  );

  const buildBracket = () => {
    setSimming(true);
    setTimeout(() => {
      const b = buildPostseasonBracket(
        gameState.nationalRankings,
        gameState.conferenceStandings,
      );
      setBracket(b);
      setSimming(false);
    }, 50);
  };

  const simRegionals = () => {
    if (!bracket) return;
    setSimming(true);
    setTimeout(() => {
      const newRegionals = bracket.regionals.map((g) => simulateRegional(g, rosterMap));
      setBracket({ ...bracket, regionals: newRegionals });
      setSimming(false);
      setRound("super_regionals");
    }, 100);
  };

  const simSuperRegionals = () => {
    if (!bracket) return;
    setSimming(true);
    setTimeout(() => {
      // Pair regional winners
      const winners = bracket.regionals.map((r) => r.winner ?? r.hostSchoolId);
      const newSuperRegionals = bracket.superRegionals.map((sr, i) => ({
        ...sr,
        team1Id: winners[i * 2] ?? sr.team1Id,
        team2Id: winners[i * 2 + 1] ?? sr.team2Id,
      })).map((sr) => simulateSuperRegional(sr, rosterMap));
      setBracket({ ...bracket, superRegionals: newSuperRegionals });
      setSimming(false);
      setRound("cws");
    }, 100);
  };

  const simCWS = () => {
    if (!bracket) return;
    setSimming(true);
    setTimeout(() => {
      const cwsTeams = bracket.superRegionals
        .filter((sr) => sr.winner)
        .map((sr) => sr.winner!);
      const newCws = simulateCWS(
        {
          ...bracket.cws,
          pool1: cwsTeams.slice(0, 4),
          pool2: cwsTeams.slice(4, 8),
        },
        rosterMap,
      );
      setBracket({ ...bracket, cws: newCws });
      setSimming(false);
    }, 100);
  };

  if (!bracket) {
    return (
      <View className="flex-1 bg-night items-center justify-center p-8">
        <Text className="text-white text-5xl mb-4">🏆</Text>
        <Text className="text-white text-2xl font-bold mb-2">College World Series</Text>
        <Text className="text-night-text text-center mb-8">
          {gameState.nationalRankings.length < 16
            ? "Finish the regular season to unlock postseason."
            : "The postseason bracket is ready to be drawn."}
        </Text>
        {gameState.nationalRankings.length >= 16 && (
          <TouchableOpacity
            className="bg-success rounded-2xl px-8 py-4"
            onPress={buildBracket}
            disabled={simming}
          >
            {simming
              ? <ActivityIndicator color="white" />
              : <Text className="text-white font-bold text-lg">Draw the Bracket</Text>}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-night">
      {/* Round tabs */}
      <View className="flex-row px-4 pt-4 pb-2 gap-2">
        {(["regionals","super_regionals","cws"] as const).map((r) => (
          <TouchableOpacity
            key={r}
            className={`px-3 py-2 rounded-xl ${round === r ? "bg-success" : "bg-night-card border border-night-border"}`}
            onPress={() => setRound(r)}
          >
            <Text className={round === r ? "text-white font-bold text-xs" : "text-night-text text-xs"}>
              {r === "regionals" ? "Regionals" : r === "super_regionals" ? "Super Reg." : "CWS"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {round === "regionals" && (
          <>
            <View className="flex-row flex-wrap gap-3">
              {bracket.regionals.slice(0, 8).map((group, i) => (
                <View
                  key={i}
                  className={`flex-1 min-w-[45%] bg-night-card border rounded-xl p-3 ${
                    group.teams.includes(gameState.userSchoolId)
                      ? "border-success"
                      : "border-night-border"
                  }`}
                >
                  <Text className="text-gold text-xs mb-2">Regional {i + 1} — {getSchool(group.hostSchoolId)?.shortName}</Text>
                  {group.teams.map((id) => (
                    <Text
                      key={id}
                      className={`text-xs py-0.5 ${
                        group.winner === id
                          ? "text-success font-bold"
                          : id === gameState.userSchoolId
                          ? "text-white font-semibold"
                          : "text-night-text"
                      }`}
                    >
                      {group.winner === id ? "✓ " : ""}{getSchool(id)?.shortName ?? id}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
            <TouchableOpacity
              className="mt-4 bg-success rounded-xl py-4 items-center"
              onPress={simRegionals}
              disabled={simming}
            >
              {simming
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold">Simulate All Regionals</Text>}
            </TouchableOpacity>
          </>
        )}

        {round === "super_regionals" && (
          <>
            {bracket.superRegionals.map((sr, i) => (
              <View key={i} className="bg-night-card border border-night-border rounded-xl p-3 mb-3">
                <Text className="text-gold text-xs mb-2">Super Regional {i + 1}</Text>
                <View className="flex-row items-center">
                  <Text className={`flex-1 ${sr.winner === sr.team1Id ? "text-success font-bold" : "text-white"}`}>
                    {getSchool(sr.team1Id)?.shortName ?? sr.team1Id}
                  </Text>
                  <Text className="text-white font-bold mx-2">{sr.team1Wins}-{sr.team2Wins}</Text>
                  <Text className={`flex-1 text-right ${sr.winner === sr.team2Id ? "text-success font-bold" : "text-white"}`}>
                    {getSchool(sr.team2Id)?.shortName ?? sr.team2Id}
                  </Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              className="mt-2 bg-success rounded-xl py-4 items-center"
              onPress={simSuperRegionals}
              disabled={simming}
            >
              {simming
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold">Simulate Super Regionals</Text>}
            </TouchableOpacity>
          </>
        )}

        {round === "cws" && (
          <>
            <View className="bg-night-card border border-gold/40 rounded-2xl p-4 mb-4">
              <Text className="text-gold font-bold text-center text-lg mb-4">College World Series — Omaha</Text>
              {bracket.cws.champion ? (
                <View className="items-center">
                  <Text className="text-gold text-5xl mb-3">🏆</Text>
                  <Text className="text-white text-2xl font-bold">
                    {getSchool(bracket.cws.champion)?.name ?? bracket.cws.champion}
                  </Text>
                  <Text className="text-gold mt-1">
                    {gameState.season} National Champions
                  </Text>
                  {bracket.cws.champion === gameState.userSchoolId && (
                    <View className="mt-4 bg-success/20 border border-success rounded-xl px-6 py-3">
                      <Text className="text-success font-bold text-lg text-center">🎉 You won the CWS!</Text>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-white font-semibold mb-2 text-center">Pool 1</Text>
                      {bracket.cws.pool1.map((id) => (
                        <Text key={id} className={`text-center py-1 text-sm ${id === gameState.userSchoolId ? "text-success font-bold" : "text-white"}`}>
                          {getSchool(id)?.shortName ?? id}
                        </Text>
                      ))}
                    </View>
                    <View className="w-px bg-night-border" />
                    <View className="flex-1">
                      <Text className="text-white font-semibold mb-2 text-center">Pool 2</Text>
                      {bracket.cws.pool2.map((id) => (
                        <Text key={id} className={`text-center py-1 text-sm ${id === gameState.userSchoolId ? "text-success font-bold" : "text-white"}`}>
                          {getSchool(id)?.shortName ?? id}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-gold rounded-xl py-4 items-center"
                    onPress={simCWS}
                    disabled={simming}
                  >
                    {simming
                      ? <ActivityIndicator color="white" />
                      : <Text className="text-white font-bold text-lg">Play the CWS</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
