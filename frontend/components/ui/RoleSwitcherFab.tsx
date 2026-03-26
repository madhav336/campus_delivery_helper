import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

export default function RoleSwitcherFab() {
  const { theme, mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);

  const roles = ["STUDENT", "OUTLET", "ADMIN"];

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
          {roles.map((r) => (
            <Pressable
              key={r}
              onPress={() => {
                setMode(r as any);
                setOpen(false);
              }}
              style={styles.option}
            >
              <Text
                style={{
                  color: r === mode ? theme.primary : theme.text,
                  fontWeight: "600",
                }}
              >
                {r}
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
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>👤</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 80,
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
    marginBottom: 8,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    elevation: 5,
  },

  option: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
