import { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { themes } from "@/theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeType = "default" | "dark" | "foodie" | "kopi";
export type UserRole = "student" | "outlet_owner" | "admin";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const systemColorScheme = useColorScheme();
  // Start with system preference, or default if not available
  const [themeName, setThemeName] = useState<ThemeType>(
    systemColorScheme === "dark" ? "dark" : "default"
  );
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user role from async storage on mount
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
        }
      } catch (error) {
        console.error('Failed to load user role:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserRole();
  }, []);

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
        themeName,
        userRole,
        setUserRole,
        loading
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