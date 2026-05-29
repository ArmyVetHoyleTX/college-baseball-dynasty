import React, { useState, useMemo, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, ActivityIndicator,
} from "react-native";
import { useGameStore } from "../src/store/gameStore";
import { useRosterStore } from "../src/store/rosterStore";
import { ScheduledGame } from "../src/models/game";
import { simulateGame, TeamLineup } from "../src/engine/gameEngine";
import { buildLineup, buildBullpen } from "../src/engine/playerFactory";
import { seedAtBatRng } from "../src/engine/atBatEngine";
import { fmtRecord } from "../src/utils/formatting";

type GameFilter = "all" | "upcoming" | "results";

export default function ScheduleScreen() {
  const { gameState, schools, recordGameResult, advanceWeek } = useGameStore();
  const getSchoolRoster = useRosterStore((s) => s.getSchoolRoster);

  const [filter, setFilter] = useState<GameFilter>("upcoming");
  const [simming, setSimming] = useState<string | null>(null);

  const userGames = useMemo(() => {
    if (!gameState) return [];
    return gameState.schedule.filter(
      (g) =>
        g.homeTeamId === gameState.userSchoolId ||
        g.awayTeamId === gameState.userSchoolId,
    ).sort((a, b) => a.week - b.week);
  }, [gameState?.schedule, gameState?.userSchoolId]);

  const filtered = useMemo(() => {
    if (filter === "upcoming") return userGames.filter((g) => !g.result);
    if (filter === "results") return userGames.filter((g) => !!g.result).reverse();
    return userGames;
  }, [userGames, filter]);

  const getSchool = useCallback(
    (id: string) => schools.find((s) => s.id === id),
    [schools],
  );

  const buildTeamLineup = useCallback(
    (schoolId: string): TeamLineup => {
      const roster = getSchoolRoster(schoolId);
      const { starter, bullpen } = buildBullpen(roster);
      const lineup = buildLineup(roster);
      return { schoolId, lineup, startingPitcher: starter, bullpen };
    },
    [getSchoolRoster],
  );

  const handleSimGame = useCallback(
    (game: ScheduledGame) => {
      if (!gameState) return;
      setSimming(game.id);

      // Defer heavy work off render cycle
      setTimeout(() => {
        try {
          const home = buildTeamLineup(game.homeTeamId);
          const away = buildTeamLineup(game.awayTeamId);
          const seed = parseInt(game.id.replace(/\D/g, ""), 10) || 12345;
          const result = simulateGame(home, away, seed);
          recordGameResult({ ...game, result: result.boxScore });
        } catch (e) {
          Alert.alert("Simulation Error", String(e));
        } finally {
          setSimming(null);
        }
      }, 0);
    },
    [gameState, buildTeamLineup, recordGameResult],
  );

  const handleSimWeek = useCallback(() => {
    if (!gameState) return;
    const weekGames = gameState.schedule.filter(
      (g) =>
        g.week === gameState.week &&
        !g.result &&
        (g.homeTeamId === gameState.userSchoolId || g.awayTeamId === gameState.userSchoolId),
    );
    for (const g of weekGames) handleSimGame(g);
    advanceWeek();
  }, [gameState, handleSimGame, advanceWeek]);

  if (!gameState) return null;

  return (
    <View className="flex-1 bg-night">
      {/* Filter tabs */}
      <View className="flex-row px-4 pt-4 pb-2 gap-2">
        {(["upcoming","results","all"] as GameFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            className={`px-4 py-2 rounded-xl ${filter === f ? "bg-success" : "bg-night-card border border-night-border"}`}
            onPress={() => setFilter(f)}
          >
            <Text className={filter === f ? "text-white font-bold text-sm" : "text-night-text text-sm"}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          className="ml-auto bg-info rounded-xl px-4 py-2"
          onPress={handleSimWeek}
        >
          <Text className="text-white font-bold text-sm">Sim Week {gameState.week}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item: game }) => {
          const homeSchool = getSchool(game.homeTeamId);
          const awaySchool = getSchool(game.awayTeamId);
          const isUserHome = game.homeTeamId === gameState.userSchoolId;
          const isSimmingThis = simming === game.id;
          const result = game.result;

          return (
            <View className="mb-3 bg-night-card border border-night-border rounded-xl overflow-hidden">
              {/* Header */}
              <View className="flex-row items-center px-3 py-1.5 bg-night border-b border-night-border">
                <Text className="text-night-text text-xs flex-1">
                  Week {game.week} {game.isConferenceGame ? "· Conference" : ""}
                  {game.isPostseason ? "· Postseason" : ""}
                </Text>
                {game.isConferenceGame && (
                  <View className="bg-info/20 rounded px-2 py-0.5">
                    <Text className="text-info text-xs">Conf</Text>
                  </View>
                )}
              </View>

              {/* Teams */}
              <View className="flex-row items-center px-3 py-3">
                {/* Away */}
                <View className="flex-1">
                  <Text className={`font-semibold ${result && result.winnerTeamId === game.awayTeamId ? "text-success" : result ? "text-night-text" : "text-white"}`}>
                    {awaySchool?.shortName ?? game.awayTeamId}
                  </Text>
                  <Text className="text-night-text text-xs">
                    {fmtRecord(awaySchool?.wins ?? 0, awaySchool?.losses ?? 0)}
                  </Text>
                </View>

                {/* Score or vs */}
                <View className="px-4 items-center">
                  {result ? (
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-xl font-bold ${result.winnerTeamId === game.awayTeamId ? "text-success" : "text-night-text"}`}>
                        {result.finalAway}
                      </Text>
                      <Text className="text-night-text">-</Text>
                      <Text className={`text-xl font-bold ${result.winnerTeamId === game.homeTeamId ? "text-success" : "text-night-text"}`}>
                        {result.finalHome}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-night-text text-lg font-semibold">vs</Text>
                  )}
                </View>

                {/* Home */}
                <View className="flex-1 items-end">
                  <Text className={`font-semibold ${result && result.winnerTeamId === game.homeTeamId ? "text-success" : result ? "text-night-text" : "text-white"}`}>
                    {homeSchool?.shortName ?? game.homeTeamId}
                  </Text>
                  <Text className="text-night-text text-xs">
                    {fmtRecord(homeSchool?.wins ?? 0, homeSchool?.losses ?? 0)}
                  </Text>
                </View>
              </View>

              {/* Action */}
              {!result && (
                <View className="border-t border-night-border flex-row">
                  <TouchableOpacity
                    className="flex-1 py-2.5 items-center"
                    onPress={() => handleSimGame(game)}
                    disabled={!!simming}
                  >
                    {isSimmingThis ? (
                      <ActivityIndicator size="small" color="#22c55e" />
                    ) : (
                      <Text className="text-success font-semibold text-sm">▶ Simulate Game</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
