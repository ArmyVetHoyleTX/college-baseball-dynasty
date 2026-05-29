import "../global.css";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../src/store/gameStore";

export default function RootLayout() {
  const gameState = useGameStore((s) => s.gameState);

  // If no game started, show the title/new game screen only
  if (!gameState) {
    return (
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f1f5f9",
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "College Baseball Dynasty", headerShown: false }} />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f1f5f9",
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#1e293b" },
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#64748b",
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: focused ? "home" : "home-outline",
            roster: focused ? "people" : "people-outline",
            schedule: focused ? "calendar" : "calendar-outline",
            recruiting: focused ? "school" : "school-outline",
            standings: focused ? "trophy" : "trophy-outline",
          };
          const icon = icons[route.name] ?? "ellipse-outline";
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="roster" options={{ title: "Roster" }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule" }} />
      <Tabs.Screen name="recruiting" options={{ title: "Recruiting" }} />
      <Tabs.Screen name="standings" options={{ title: "Standings" }} />
      <Tabs.Screen name="postseason" options={{ title: "Postseason", href: null }} />
      <Tabs.Screen name="school" options={{ title: "Program", href: null }} />
      <Tabs.Screen name="player/[id]" options={{ title: "Player", href: null }} />
      <Tabs.Screen name="career/index" options={{ title: "Career", href: null }} />
    </Tabs>
  );
}
