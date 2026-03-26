import { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { themes } from "@/theme/colors";

type ThemeType = "default" | "dark" | "foodie" | "kopi";
type ModeType = "STUDENT" | "OUTLET" | "ADMIN";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const systemColorScheme = useColorScheme();
  // Start with system preference, or default if not available
  const [themeName, setThemeName] = useState<ThemeType>(
    systemColorScheme === "dark" ? "dark" : "default"
  );
  const [mode, setMode] = useState<ModeType>("STUDENT");

  // Update theme when system appearance changes
  useEffect(() => {
    if (systemColorScheme === "dark") {
      setThemeName("dark");
    } else if (systemColorScheme === "light") {
      setThemeName("default");
    }
  }, [systemColorScheme]);

  const theme = themes[themeName];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeName,
        mode,
        setMode,
        themeName,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};