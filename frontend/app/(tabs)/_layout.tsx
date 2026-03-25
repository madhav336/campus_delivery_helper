import { Tabs, useSegments, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";

export default function TabLayout() {
  const { theme, mode } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const currentRoute = segments[segments.length - 1];

    if (mode === "STUDENT") {
      if (!["index", "create", "availability"].includes(currentRoute)) {
        setTimeout(() => router.replace("/(tabs)"), 0);
      }
    }

    if (mode === "OUTLET") {
      if (currentRoute !== "availability") {
        setTimeout(() => router.replace("/(tabs)/availability"), 0);
      }
    }

    if (mode === "ADMIN") {
      if (!["users", "outlets"].includes(currentRoute)) {
        setTimeout(() => router.replace("/(tabs)/users"), 0);
      }
    }
  }, [mode, mounted]);

  if (!theme) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: {
          position: "absolute",
          bottom: 10,
          left: 10,
          right: 10,
          height: 65,
          borderRadius: 16,
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Requests",
          href: mode === "STUDENT" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          href: mode === "STUDENT" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="availability"
        options={{
          title: "Availability",
          href:
            mode === "STUDENT" || mode === "OUTLET"
              ? undefined
              : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          href: mode === "ADMIN" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="outlets"
        options={{
          title: "Outlets",
          href: mode === "ADMIN" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}