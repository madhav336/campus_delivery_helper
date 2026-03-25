import { createContext, useContext, useState } from "react";
import { themes } from "@/theme/colors";

type ThemeType = "default" | "dark" | "foodie" | "kopi";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [themeName, setThemeName] = useState<ThemeType>("default");

  const theme = themes[themeName]; // ✅ now always valid

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeName,
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