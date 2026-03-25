import { createContext, useContext, useState } from "react";
import { themes } from "@/theme/colors";

type ThemeType = "default" | "dark" | "foodie" | "kopi";
type ModeType = "STUDENT" | "OUTLET" | "ADMIN";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [themeName, setThemeName] = useState<ThemeType>("default");
  const [mode, setMode] = useState<ModeType>("STUDENT"); // ✅ ADD THIS

  const theme = themes[themeName];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeName,
        mode,        // ✅ ADD
        setMode,     // ✅ ADD
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