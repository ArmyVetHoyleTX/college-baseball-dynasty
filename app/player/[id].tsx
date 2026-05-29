import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRosterStore } from "../../src/store/rosterStore";
import {
  fmtAvg, fmtEra, fmtIp, fmtObp, fmtWhip, fmtFip,
  ratingGrade, starString, ordinal,
} from "../../src/utils/formatting";
import { computeDerivedStats } from "../../src/models/player";

function RatingBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "#22c55e" : value >= 65 ? "#f59e0b" : value >= 50 ? "#94a3b8" : "#ef4444";
  return (
    <View className="mb-2">
      <View className="flex-row justify-between mb-0.5">
        <Text className="text-night-text text-xs">{label}</Text>
        <Text className="text-xs font-bold" style={{ color }}>{value} {ratingGrade(value)}</Text>
      </View>
      <View className="h-2 bg-night rounded-full overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const players = useRosterStore((s) => s.players);
  const player = players[id ?? ""];

  if (!player) {
    return (
      <View className="flex-1 bg-night items-center justify-center">
        <Text className="text-white">Player not found</Text>
      </View>
    );
  }

  const isPitcher = ["SP", "RP"].includes(player.position);
  const s = player.seasonStats;
  const derived = computeDerivedStats(s);

  return (
    <ScrollView className="flex-1 bg-night" contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View className="bg-night-card border border-night-border rounded-2xl p-4 mb-4">
        <View className="flex-row items-start">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">{player.name}</Text>
            <Text className="text-night-text">{player.position} · {player.year} · {player.bats}/{player.throws}</Text>
            <Text className="text-gold mt-1">{starString(player.potential)} ({player.potential}-star potential)</Text>
          </View>
          {player.injuryWeeksRemaining > 0 && (
            <View className="bg-danger/20 border border-danger/40 rounded-lg px-3 py-2">
              <Text className="text-danger font-bold text-sm">INJURED</Text>
              <Text className="text-danger text-xs">{player.injuryWeeksRemaining}w DTD</Text>
            </View>
          )}
        </View>
      </View>

      {/* Season stats */}
      <Text className="text-white font-bold text-lg mb-2">Season Stats</Text>
      <View className="bg-night-card border border-night-border rounded-xl p-4 mb-4">
        {isPitcher ? (
          <View>
            <View className="flex-row flex-wrap gap-x-6 gap-y-3">
              <StatPill label="ERA" value={fmtEra(s.er, s.ip)} />
              <StatPill label="IP" value={fmtIp(s.ip)} />
              <StatPill label="W-L" value={`${s.wins}-${s.losses}`} />
              <StatPill label="WHIP" value={fmtWhip(s.ha, s.bba, s.ip)} />
              <StatPill label="K" value={String(s.kp)} />
              <StatPill label="BB" value={String(s.bba)} />
              <StatPill label="FIP" value={fmtFip(s.hr, s.bba, s.hbp, s.kp, s.ip)} />
              <StatPill label="SV" value={String(s.sv)} />
              <StatPill label="GS" value={String(s.gs)} />
            </View>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-x-6 gap-y-3">
            <StatPill label="AVG" value={fmtAvg(s.h, s.ab)} />
            <StatPill label="OBP" value={fmtObp(s.h, s.bb, s.hbp, s.pa)} />
            <StatPill label="HR" value={String(s.hr)} />
            <StatPill label="RBI" value={String(s.rbi)} />
            <StatPill label="R" value={String(s.r)} />
            <StatPill label="SB" value={String(s.sb)} />
            <StatPill label="K" value={String(s.k)} />
            <StatPill label="BB" value={String(s.bb)} />
            <StatPill label="2B" value={String(s.doubles)} />
            <StatPill label="3B" value={String(s.triples)} />
          </View>
        )}
      </View>

      {/* Ratings */}
      <Text className="text-white font-bold text-lg mb-2">Ratings</Text>
      <View className="bg-night-card border border-night-border rounded-xl p-4 mb-4">
        {isPitcher ? (
          <>
            <Text className="text-night-text text-xs mb-2 uppercase tracking-wide">Pitching</Text>
            <RatingBar label="Velocity" value={player.ratings.velocity} />
            <RatingBar label="Control" value={player.ratings.control} />
            <RatingBar label="Movement" value={player.ratings.movement} />
            <RatingBar label="Stamina" value={player.ratings.stamina} />
          </>
        ) : (
          <>
            <Text className="text-night-text text-xs mb-2 uppercase tracking-wide">Hitting</Text>
            <RatingBar label="Contact" value={player.ratings.contact} />
            <RatingBar label="Power" value={player.ratings.power} />
            <RatingBar label="Eye / Discipline" value={player.ratings.eye} />
            <RatingBar label="Speed" value={player.ratings.speed} />
          </>
        )}
        <Text className="text-night-text text-xs mt-3 mb-2 uppercase tracking-wide">Fielding</Text>
        <RatingBar label="Range" value={player.ratings.range} />
        <RatingBar label="Arm" value={player.ratings.arm} />
        <RatingBar label="Glove" value={player.ratings.glove} />
      </View>

      {/* Career stats */}
      {player.careerStats.length > 0 && (
        <>
          <Text className="text-white font-bold text-lg mb-2">Career Stats</Text>
          <View className="bg-night-card border border-night-border rounded-xl overflow-hidden mb-4">
            {/* Header row */}
            <View className="flex-row px-3 py-2 border-b border-night-border">
              <Text className="text-night-text text-xs w-14">Season</Text>
              {isPitcher ? (
                <>
                  <Text className="text-night-text text-xs flex-1 text-right">ERA</Text>
                  <Text className="text-night-text text-xs flex-1 text-right">IP</Text>
                  <Text className="text-night-text text-xs flex-1 text-right">W-L</Text>
                  <Text className="text-night-text text-xs flex-1 text-right">K</Text>
                </>
              ) : (
                <>
                  <Text className="text-night-text text-xs flex-1 text-right">AVG</Text>
                  <Text className="text-night-text text-xs flex-1 text-right">HR</Text>
                  <Text className="text-night-text text-xs flex-1 text-right">RBI</Text>
                  <Text className="text-night-text text-xs flex-1 text-right">SB</Text>
                </>
              )}
            </View>
            {player.careerStats.map((cs, i) => (
              <View key={i} className="flex-row px-3 py-2 border-b border-night-border">
                <Text className="text-white text-xs w-14">{cs.season}</Text>
                {isPitcher ? (
                  <>
                    <Text className="text-white text-xs flex-1 text-right">{fmtEra(cs.er, cs.ip)}</Text>
                    <Text className="text-white text-xs flex-1 text-right">{fmtIp(cs.ip)}</Text>
                    <Text className="text-white text-xs flex-1 text-right">{cs.wins}-{cs.losses}</Text>
                    <Text className="text-white text-xs flex-1 text-right">{cs.kp}</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white text-xs flex-1 text-right">{fmtAvg(cs.h, cs.ab)}</Text>
                    <Text className="text-white text-xs flex-1 text-right">{cs.hr}</Text>
                    <Text className="text-white text-xs flex-1 text-right">{cs.rbi}</Text>
                    <Text className="text-white text-xs flex-1 text-right">{cs.sb}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-white font-bold text-lg">{value}</Text>
      <Text className="text-night-text text-xs">{label}</Text>
    </View>
  );
}
