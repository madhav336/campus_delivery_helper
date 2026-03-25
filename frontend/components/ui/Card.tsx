import { View, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function Card({ children }: any) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    name: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    },
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,

    borderWidth: 1,

    // 👇 THIS is the magic (soft elevation)
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});