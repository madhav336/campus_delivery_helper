import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function TopBar({ title }: { title: string }) {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        borderBottomColor: theme.border,
        backgroundColor: theme.bg,
      }
    ]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
});