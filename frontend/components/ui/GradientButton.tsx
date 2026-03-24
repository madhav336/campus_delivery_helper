import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger";
};

export default function Button({
  title,
  onPress,
  variant = "primary",
}: ButtonProps) {
  const { theme } = useTheme();

  const getStyles = () => {
    switch (variant) {
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: theme.border,
          textColor: theme.text,
        };

      case "danger":
        return {
          backgroundColor: "#fee2e2",
          borderWidth: 0,
          borderColor: "transparent",
          textColor: "#dc2626",
        };

      default:
        return {
          backgroundColor: theme.primary,
          borderWidth: 0,
          borderColor: "transparent",
          textColor: "#fff",
        };
    }
  };

  const stylesVariant = getStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: stylesVariant.backgroundColor,
          borderWidth: stylesVariant.borderWidth,
          borderColor: stylesVariant.borderColor,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: stylesVariant.textColor },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  text: {
    fontSize: 15,
    fontWeight: "700",
  },
});