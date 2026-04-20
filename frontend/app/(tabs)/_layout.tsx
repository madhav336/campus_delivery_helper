import { Tabs, useSegments, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Returns a stable tabBarIcon renderer for a given Ionicons icon name.
 * Defined outside the component to avoid re-creating functions on each render.
 */
function makeTabIcon(name: React.ComponentProps<typeof Ionicons>['name']) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabLayout() {
  const { theme, userRole, loading } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if userRole becomes null (logout)
  useEffect(() => {
    if (mounted && !loading && userRole === null) {
      setTimeout(() => router.replace("/(auth)/login"), 0);
    }
  }, [userRole, mounted, loading]);

  useEffect(() => {
    if (!mounted || loading || !userRole) return;

    const currentRoute = segments[segments.length - 1];

    if (userRole === "student") {
      if (!["index", "create", "availability", "activity", "leaderboard", "profile"].includes(currentRoute)) {
        setTimeout(() => router.replace("/(tabs)"), 0);
      }
    }

    if (userRole === "outlet_owner") {
      if (!["availability", "profile"].includes(currentRoute)) {
        setTimeout(() => router.replace("/(tabs)/availability"), 0);
      }
    }

    if (userRole === "admin") {
      if (!["users", "outlets", "analytics", "profile"].includes(currentRoute)) {
        setTimeout(() => router.replace("/(tabs)/analytics"), 0);
      }
    }
  }, [userRole, mounted, loading]);

  if (!theme || loading || !userRole) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme?.bg }}>
        <ActivityIndicator size="large" color={theme?.primary} />
      </View>
    );
  }

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
      {/* STUDENT TABS */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Requests",
          href: userRole === "student" ? undefined : null,
          tabBarIcon: makeTabIcon("list-outline"),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          href: userRole === "student" ? undefined : null,
          tabBarIcon: makeTabIcon("add-circle-outline"),
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          href: userRole === "student" ? undefined : null,
          tabBarIcon: makeTabIcon("flash-outline"),
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Board",
          href: userRole === "student" ? undefined : null,
          tabBarIcon: makeTabIcon("podium-outline"),
        }}
      />

      {/* SHARED TABS */}
      <Tabs.Screen
        name="availability"
        options={{
          title: userRole === "outlet_owner" ? "Availability" : "Check",
          href:
            userRole === "student" || userRole === "outlet_owner"
              ? undefined
              : null,
          tabBarIcon: makeTabIcon("checkmark-circle-outline"),
        }}
      />

      {/* ADMIN TABS */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          href: userRole === "admin" ? undefined : null,
          tabBarIcon: makeTabIcon("bar-chart-outline"),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          href: userRole === "admin" ? undefined : null,
          tabBarIcon: makeTabIcon("people-outline"),
        }}
      />

      <Tabs.Screen
        name="outlets"
        options={{
          title: "Outlets",
          href: userRole === "admin" ? undefined : null,
          tabBarIcon: makeTabIcon("storefront-outline"),
        }}
      />

      {/* PROFILE - ALL ROLES */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Me",
          tabBarIcon: makeTabIcon("person-outline"),
        }}
      />
    </Tabs>
  );
}