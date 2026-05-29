import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useGameStore } from "../src/store/gameStore";
import { fmtRecord, prestigeGrade, fmtNil } from "../src/utils/formatting";
import { School } from "../src/models/school";

function FacilitiesBar({ level }: { level: number }) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          className={`flex-1 h-2 rounded-full ${i <= level ? "bg-success" : "bg-night-border"}`}
        />
      ))}
    </View>
  );
}

function CoachCard({ name, level, xp, perkUnlocked, perkDescription }: {
  name: string; level: number; xp: number; perkUnlocked: boolean; perkDescription: string;
}) {
  return (
    <View className="bg-night border border-night-border rounded-xl p-3 mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-white font-semibold">{name}</Text>
        <View className={`rounded-full px-2 py-0.5 ${perkUnlocked ? "bg-success/20" : "bg-night-border"}`}>
          <Text className={perkUnlocked ? "text-success text-xs font-bold" : "text-night-text text-xs"}>
            Lv {level}
          </Text>
        </View>
      </View>
      {/* XP bar */}
      <View className="h-1.5 bg-night-border rounded-full mb-1">
        <View className="h-full rounded-full bg-info" style={{ width: `${xp}%` }} />
      </View>
      {perkUnlocked && (
        <Text className="text-success text-xs mt-1">✓ {perkDescription}</Text>
      )}
      {!perkUnlocked && (
        <Text className="text-night-text text-xs mt-1">Reach Lv 3 to unlock perk</Text>
      )}
    </View>
  );
}

export default function SchoolScreen() {
  const { gameState, schools, updateSchool } = useGameStore();
  if (!gameState) return null;

  const school = schools.find((s) => s.id === gameState.userSchoolId) as School;
  if (!school) return null;

  const upgradeCost = school.facilitiesLevel * 25; // prestige points cost

  const handleUpgrade = () => {
    if (school.facilitiesLevel >= 5) {
      Alert.alert("Max Level", "Facilities are already at maximum level.");
      return;
    }
    Alert.alert(
      "Upgrade Facilities",
      `Upgrade to Level ${school.facilitiesLevel + 1}? Cost: ${upgradeCost} prestige points.`,
      [
        { text: "Cancel" },
        {
          text: "Upgrade",
          onPress: () => updateSchool(school.id, {
            facilitiesLevel: (school.facilitiesLevel + 1) as 1|2|3|4|5,
            prestige: Math.max(1, school.prestige - upgradeCost),
          }),
        },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-night" contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View
        className="rounded-2xl p-5 mb-4 border border-transparent"
        style={{ backgroundColor: school.primaryColor }}
      >
        <Text className="text-white text-2xl font-bold">{school.name}</Text>
        <Text className="text-white/80">{school.nickname} · {school.conference.toUpperCase()}</Text>
        <View className="flex-row mt-3 gap-4">
          <View>
            <Text className="text-white font-bold text-xl">{fmtRecord(school.wins, school.losses)}</Text>
            <Text className="text-white/70 text-xs">Record</Text>
          </View>
          <View>
            <Text className="text-white font-bold text-xl">{school.prestige}</Text>
            <Text className="text-white/70 text-xs">Prestige ({prestigeGrade(school.prestige)})</Text>
          </View>
          <View>
            <Text className="text-white font-bold text-xl">{school.cwsAppearances}</Text>
            <Text className="text-white/70 text-xs">CWS Apps</Text>
          </View>
        </View>
      </View>

      {/* NIL Budget */}
      <Text className="text-white font-bold text-lg mb-2">NIL Budget</Text>
      <View className="bg-night-card border border-night-border rounded-xl p-4 mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-night-text">Total budget</Text>
          <Text className="text-white font-bold">{fmtNil(school.nilBudget)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-night-text">Committed</Text>
          <Text className="text-danger font-bold">{fmtNil(school.nilSpent)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-night-text">Available</Text>
          <Text className="text-success font-bold">{fmtNil(Math.max(0, school.nilBudget - school.nilSpent))}</Text>
        </View>
        <View className="h-2 bg-night rounded-full mt-3 overflow-hidden">
          <View
            className="h-full bg-success rounded-full"
            style={{ width: `${Math.min(100, ((school.nilBudget - school.nilSpent) / school.nilBudget) * 100)}%` }}
          />
        </View>
      </View>

      {/* Facilities */}
      <Text className="text-white font-bold text-lg mb-2">Facilities</Text>
      <View className="bg-night-card border border-night-border rounded-xl p-4 mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white">Level {school.facilitiesLevel} / 5</Text>
          <TouchableOpacity
            className={`px-4 py-2 rounded-xl ${school.facilitiesLevel >= 5 ? "bg-night-border" : "bg-gold/90"}`}
            onPress={handleUpgrade}
            disabled={school.facilitiesLevel >= 5}
          >
            <Text className="text-white font-bold text-sm">
              {school.facilitiesLevel >= 5 ? "Max" : `Upgrade (${upgradeCost}pts)`}
            </Text>
          </TouchableOpacity>
        </View>
        <FacilitiesBar level={school.facilitiesLevel} />
        <Text className="text-night-text text-xs mt-2">
          Better facilities → higher recruit appeal +{(school.facilitiesLevel - 1) * 2} recruiting pts/season
        </Text>
      </View>

      {/* Coaching staff */}
      <Text className="text-white font-bold text-lg mb-2">Coaching Staff</Text>
      <View className="bg-night-card border border-night-border rounded-xl p-4 mb-4">
        <CoachCard
          name={school.coaching.headCoach.name}
          level={school.coaching.headCoach.level}
          xp={school.coaching.headCoach.xp}
          perkUnlocked={school.coaching.headCoach.perkUnlocked}
          perkDescription="Head Coach Lv3: +5% win chance in close games"
        />
        <CoachCard
          name={school.coaching.pitchingCoach.name}
          level={school.coaching.pitchingCoach.level}
          xp={school.coaching.pitchingCoach.xp}
          perkUnlocked={school.coaching.pitchingCoach.perkUnlocked}
          perkDescription="Pitching Coach Lv3: +1 stamina for all starters"
        />
        <CoachCard
          name={school.coaching.hittingCoach.name}
          level={school.coaching.hittingCoach.level}
          xp={school.coaching.hittingCoach.xp}
          perkUnlocked={school.coaching.hittingCoach.perkUnlocked}
          perkDescription="Hitting Coach Lv3: +2 contact for all position players"
        />
        <CoachCard
          name={school.coaching.recruitingCoordinator.name}
          level={school.coaching.recruitingCoordinator.level}
          xp={school.coaching.recruitingCoordinator.xp}
          perkUnlocked={school.coaching.recruitingCoordinator.perkUnlocked}
          perkDescription="Recruiting Coord Lv3: +5 recruiting points per week"
        />
      </View>

      {/* Hall of Fame */}
      <Text className="text-white font-bold text-lg mb-2">Hall of Fame</Text>
      <View className="bg-night-card border border-night-border rounded-xl p-4 mb-8">
        {school.hallOfFame.length === 0 ? (
          <Text className="text-night-text text-center py-4">
            Build legends — HoF unlocks after a player completes their career here.
          </Text>
        ) : (
          school.hallOfFame.map((entry, i) => (
            <View key={i} className="flex-row items-center py-2 border-b border-night-border">
              <Text className="text-gold mr-2">🏆</Text>
              <View className="flex-1">
                <Text className="text-white font-semibold">{entry.playerName}</Text>
                <Text className="text-night-text text-xs">{entry.position} · {entry.seasons} seasons · {entry.careerAvgOrEra}</Text>
              </View>
              <Text className="text-night-text text-xs">{entry.year}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
