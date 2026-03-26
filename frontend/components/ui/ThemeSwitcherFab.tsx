import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeSwitcherFab() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const themes = ["default", "dark", "foodie", "kopi"];

  return (
    <View style={styles.container}>
      {open && (
        <View
          style={[
            styles.menu,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {themes.map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                setTheme(t as any);
                setOpen(false);
              }}
              style={styles.option}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => setOpen(!open)}
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>🎨</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 16,
    alignItems: "flex-end",
    zIndex: 999,
  },

  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  menu: {
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    elevation: 5,
    bottom: 0,
  },

  option: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
