import { Tabs, useSegments, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

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
      if (!["availability", "pending", "profile"].includes(currentRoute)) {
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          href: userRole === "student" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          href: userRole === "student" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Board",
          href: userRole === "student" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="podium-outline" size={size} color={color} />
          ),
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {/* OUTLET SPECIFIC */}
      <Tabs.Screen
        name="pending"
        options={{
          title: "Pending",
          href: userRole === "outlet_owner" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ADMIN TABS */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          href: userRole === "admin" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          href: userRole === "admin" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="outlets"
        options={{
          title: "Outlets",
          href: userRole === "admin" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />

      {/* PROFILE - ALL ROLES */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Me",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}