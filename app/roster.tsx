import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useGameStore } from "../src/store/gameStore";
import { useRosterStore } from "../src/store/rosterStore";
import { Player, Position } from "../src/models/player";
import { fmtAvg, fmtEra, fmtRecord, ratingGrade, starString, fmtIp } from "../src/utils/formatting";

type SortKey = "name" | "rating" | "potential" | "year";
type FilterPos = "ALL" | Position;

const POSITIONS: FilterPos[] = ["ALL","SP","RP","C","1B","2B","3B","SS","LF","CF","RF","DH"];
const YEARS = ["ALL","FR","SO","JR","SR","GR"] as const;

function overallRating(player: Player): number {
  const { contact, power, eye, velocity, control, movement } = player.ratings;
  if (["SP","RP"].includes(player.position)) {
    return Math.round((velocity * 0.35 + control * 0.35 + movement * 0.30));
  }
  return Math.round((contact * 0.40 + power * 0.35 + eye * 0.25));
}

function ratingColor(rating: number): string {
  if (rating >= 80) return "#22c55e";
  if (rating >= 65) return "#f59e0b";
  if (rating >= 50) return "#94a3b8";
  return "#ef4444";
}

export default function RosterScreen() {
  const { gameState } = useGameStore();
  const getSchoolRoster = useRosterStore((s) => s.getSchoolRoster);
  const router = useRouter();

  const [posFilter, setPosFilter] = useState<FilterPos>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [search, setSearch] = useState("");

  const roster = useMemo(() => {
    if (!gameState) return [];
    return getSchoolRoster(gameState.userSchoolId);
  }, [gameState?.userSchoolId]);

  const filtered = useMemo(() => {
    return roster
      .filter((p) => posFilter === "ALL" || p.position === posFilter)
      .filter((p) => yearFilter === "ALL" || p.year === yearFilter)
      .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortKey === "rating") return overallRating(b) - overallRating(a);
        if (sortKey === "potential") return b.potential - a.potential;
        if (sortKey === "year") {
          const order = { FR: 0, SO: 1, JR: 2, SR: 3, GR: 4 };
          return (order[a.year] ?? 0) - (order[b.year] ?? 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [roster, posFilter, yearFilter, sortKey, search]);

  const isPitcher = (p: Player) => ["SP","RP"].includes(p.position);

  return (
    <View className="flex-1 bg-night">
      {/* Search */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-night-card border border-night-border rounded-xl px-3 py-2">
          <TextInput
            className="text-white"
            placeholder="Search players..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Position filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2">
        {POSITIONS.map((pos) => (
          <TouchableOpacity
            key={pos}
            className={`mr-2 px-3 py-1.5 rounded-lg ${posFilter === pos ? "bg-success" : "bg-night-card border border-night-border"}`}
            onPress={() => setPosFilter(pos)}
          >
            <Text className={posFilter === pos ? "text-white font-bold text-xs" : "text-night-text text-xs"}>{pos}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort tabs */}
      <View className="flex-row px-4 pb-2 gap-2">
        {(["rating","potential","year","name"] as SortKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            className={`px-3 py-1 rounded-lg ${sortKey === key ? "bg-info/20 border border-info" : "bg-night-card border border-night-border"}`}
            onPress={() => setSortKey(key)}
          >
            <Text className={sortKey === key ? "text-info text-xs font-bold" : "text-night-text text-xs"}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-night-text px-4 pb-1 text-xs">{filtered.length} players</Text>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        renderItem={({ item: player }) => {
          const ovr = overallRating(player);
          const isPit = isPitcher(player);
          const s = player.seasonStats;
          return (
            <TouchableOpacity
              className="mb-2 bg-night-card border border-night-border rounded-xl p-3 flex-row items-center"
              onPress={() => router.push(`/player/${player.id}`)}
            >
              {/* OVR */}
              <View className="w-12 h-12 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: ratingColor(ovr) + "22", borderWidth: 1, borderColor: ratingColor(ovr) }}>
                <Text style={{ color: ratingColor(ovr) }} className="font-bold text-lg">{ovr}</Text>
              </View>

              {/* Name + position */}
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-semibold">{player.name}</Text>
                  {player.injuryWeeksRemaining > 0 && (
                    <Text className="text-danger text-xs">🤕 DTD</Text>
                  )}
                </View>
                <Text className="text-night-text text-xs">
                  {player.position} · {player.year} · {starString(player.potential)}
                </Text>
              </View>

              {/* Stats */}
              <View className="items-end">
                {isPit ? (
                  <>
                    <Text className="text-white text-sm font-bold">{fmtEra(s.er, s.ip)}</Text>
                    <Text className="text-night-text text-xs">ERA · {fmtIp(s.ip)} IP</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white text-sm font-bold">{fmtAvg(s.h, s.ab)}</Text>
                    <Text className="text-night-text text-xs">{s.hr} HR · {s.rbi} RBI</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
