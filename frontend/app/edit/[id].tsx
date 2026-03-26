import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { updateRequest } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();

  const id = params.id as string;

  const [item, setItem] = useState("");
  const [outlet, setOutlet] = useState("");
  const [customOutlet, setCustomOutlet] = useState("");
  const [hostel, setHostel] = useState("");
  const [fee, setFee] = useState("");

  useEffect(() => {
    setItem((params.item as string) || "");
    const initialOutlet = (params.outlet as string) || "";
    if (["ANC 1", "ANC 2", "CP"].includes(initialOutlet)) {
      setOutlet(initialOutlet);
    } else if (initialOutlet) {
      setOutlet("Other");
      setCustomOutlet(initialOutlet);
    }
    setHostel((params.hostel as string) || "");
    setFee((params.fee as string) || "");
  }, [params]);

  const finalOutlet = outlet === "Other" ? customOutlet : outlet;

  const handleUpdate = async () => {
    try {
      await updateRequest(id, {
        itemDescription: item,
        outlet: finalOutlet,
        hostel,
        fee: Number(fee),
      });

      router.back(); // Smoothly returns to the requests list
    } catch {
      Alert.alert("Error", "Failed to update request");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Text style={[styles.title, { color: theme.text }]}>
              Edit Request
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
                    backgroundColor: theme.bg,
                  },
                ]}
              />

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
                    backgroundColor: theme.bg,
                  },
                ]}
              />

              {/* Outlet Selector (Replaced Picker with sleek buttons like Create Screen) */}
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
                      backgroundColor: theme.bg,
                    },
                  ]}
                />
              )}

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
                    backgroundColor: theme.bg,
                  },
                ]}
              />

              <Pressable
                onPress={handleUpdate}
                style={[styles.button, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.buttonText}>Update Request</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
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
  buttonText: { color: "#fff", fontWeight: "700" },
});
