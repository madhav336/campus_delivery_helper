import { createContext, useContext, useState } from "react";
import { themes } from "@/theme/colors";

type ThemeType = "light" | "dark" | "anime";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [themeName, setThemeName] = useState<ThemeType>("light");

  const theme = themes[themeName]; // ✅ dynamic theme

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeName, // 👈 IMPORTANT (string setter)
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