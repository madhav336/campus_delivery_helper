import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export default function TopBar({ title }: { title: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
});