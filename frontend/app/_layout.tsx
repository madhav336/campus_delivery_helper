import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StatusBar } from "react-native";
import ThemeSwitcherFab from "@/components/ui/ThemeSwitcherFab";
import RoleSwitcherFab from "@/components/ui/RoleSwitcherFab";

function AppLayout() {
  const { theme } = useTheme();

  if (!theme) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* 🔥 STATUS BAR (important for dark theme look) */}
      <StatusBar
        barStyle={theme.bg === "#0f172a" ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      {/* 🔥 STACK */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.bg, // ✅ KEY FIX
          },
        }}
      />

      {/* FLOATING BUTTONS */}
      <RoleSwitcherFab />
      <ThemeSwitcherFab />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppLayout />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}