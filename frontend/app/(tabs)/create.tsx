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
  Alert,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createRequest } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/ui/Card";
import TopBar from "@/components/ui/TopBar";

export default function CreateScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [item, setItem] = useState("");
  const [outlet, setOutlet] = useState("");
  const [customOutlet, setCustomOutlet] = useState("");
  const [hostel, setHostel] = useState("");
  const [fee, setFee] = useState("");

  const HARDCODED_USER_ID = "65f1a3b8c2d3e4f5a6b7c8d9";

  const isValid =
    item && hostel && (outlet !== "Other" || customOutlet) && Number(fee) > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert("Validation Error", "Please fill all fields correctly");
      return;
    }

    try {
      await createRequest({
        itemDescription: item,
        outlet: outlet === "Other" ? customOutlet : outlet,
        hostel,
        fee: Number(fee),
        userId: HARDCODED_USER_ID,
      });
      
      Alert.alert("Success", "Request created! ✅");
      
      // Reset form after successful creation
      setItem("");
      setOutlet("");
      setCustomOutlet("");
      setHostel("");
      setFee("");
      
      // Navigate back to requests list
      router.push("/(tabs)");
    } catch (error) {
      console.log("Error:", error);
      Alert.alert("Error", "Failed to create request. Please try again.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <TopBar title="Create Request" />

            <View style={styles.container}>
              <Card>
                {/* ITEM */}
                <Text style={[styles.label, { color: theme.text }]}>Item</Text>
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

                {/* HOSTEL */}
                <Text style={[styles.label, { color: theme.text }]}>Hostel</Text>
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

                {/* OUTLET */}
                <Text style={[styles.label, { color: theme.text }]}>Select Outlet</Text>
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
                  <>
                    <Text style={[styles.label, { color: theme.text }]}>
                      Custom Outlet Name
                    </Text>
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
                  </>
                )}

                {/* FEE */}
                <Text style={[styles.label, { color: theme.text }]}>Fee</Text>
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

                {/* BUTTON */}
                <Pressable
                  onPress={handleSubmit}
                  style={[
                    styles.button,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.buttonText}>Create Request</Text>
                </Pressable>
              </Card>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },

  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});