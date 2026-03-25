import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function ModeSwitcher() {
  const { theme, mode, setMode } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {["STUDENT", "OUTLET", "ADMIN"].map((m) => (
        <Pressable
          key={m}
          onPress={() => setMode(m as any)}
          style={[
            styles.button,
            {
              backgroundColor:
                mode === m ? theme.primary : "transparent",
            },
          ]}
        >
          <Text
            style={{
              color: mode === m ? "#fff" : theme.text,
              fontWeight: "600",
              fontSize: 12,
            }}
          >
            {m}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
  },

  button: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 8,
  },
});