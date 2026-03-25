import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createRequest } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [item, setItem] = useState("");
  const [outlet, setOutlet] = useState("");
  const [customOutlet, setCustomOutlet] = useState("");
  const [hostel, setHostel] = useState("");
  const [fee, setFee] = useState("");

  const isValid =
    item && hostel && (outlet !== "Other" || customOutlet) && Number(fee) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    await createRequest({
      itemDescription: item,
      outlet: outlet === "Other" ? customOutlet : outlet,
      hostel,
      fee: Number(fee),
    });

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            
            {/* ✅ TITLE FIXED */}
            <Text style={[styles.title, { color: theme.text }]}>
              Create Request
            </Text>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* ITEM */}
              <TextInput
                placeholder="Item"
                placeholderTextColor={theme.subtext}
                value={item}
                onChangeText={setItem}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              />

              {/* HOSTEL */}
              <TextInput
                placeholder="Hostel"
                placeholderTextColor={theme.subtext}
                value={hostel}
                onChangeText={setHostel}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              />

              {/* OUTLET */}
              <View style={styles.row}>
                {["ANC 1", "ANC 2", "CP", "Other"].map((o) => (
                  <Pressable
                    key={o}
                    onPress={() => setOutlet(o)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          outlet === o ? theme.primary : theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: outlet === o ? "#fff" : theme.text,
                        fontWeight: "600",
                      }}
                    >
                      {o}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* CUSTOM */}
              {outlet === "Other" && (
                <TextInput
                  placeholder="Enter outlet name"
                  placeholderTextColor={theme.subtext}
                  value={customOutlet}
                  onChangeText={setCustomOutlet}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                />
              )}

              {/* FEE */}
              <TextInput
                placeholder="Fee"
                placeholderTextColor={theme.subtext}
                value={fee}
                onChangeText={setFee}
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              />

              {/* BUTTON */}
              <Pressable
                onPress={handleSubmit}
                style={[
                  styles.button,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text style={styles.buttonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },

  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});