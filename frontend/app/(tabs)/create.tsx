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
import { requests } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/ui/Card";
import TopBar from "@/components/ui/TopBar";
import GradientButton from "@/components/ui/GradientButton";

export default function CreateScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [item, setItem] = useState("");
  const [outlet, setOutlet] = useState("");
  const [customOutlet, setCustomOutlet] = useState("");
  const [hostel, setHostel] = useState("");
  const [fee, setFee] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    item && hostel && (outlet !== "Other" || customOutlet) && Number(fee) > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert("Validation Error", "Please fill all fields correctly");
      return;
    }

    try {
      setLoading(true);
      await requests.create(
        item,
        outlet === "Other" ? customOutlet : outlet,
        hostel,
        Number(fee)
      );
      
      Alert.alert("Success", "Request created! ✅");
      
      // Reset form
      setItem("");
      setOutlet("");
      setCustomOutlet("");
      setHostel("");
      setFee("");
      
      // Navigate back
      router.push("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create request");
    } finally {
      setLoading(false);
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
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <TopBar title="Create Request" />

            <View style={styles.container}>
              <Card>
                {/* ITEM */}
                <Text style={[styles.label, { color: theme.text }]}>Item Description</Text>
                <TextInput
                  placeholder="What do you need?"
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
                <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                  Hostel
                </Text>
                <TextInput
                  placeholder="Your hostel"
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
                <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                  Outlet
                </Text>
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
                          borderColor: outlet === o ? theme.primary : theme.border,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: outlet === o ? "#fff" : theme.text,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {o}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* CUSTOM OUTLET */}
                {outlet === "Other" && (
                  <>
                    <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
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
                <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                  Delivery Fee (₹)
                </Text>
                <TextInput
                  placeholder="How much will you pay?"
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
              </Card>

              {/* SUBMIT BUTTON */}
              <Pressable
                onPress={handleSubmit}
                disabled={!isValid || loading}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: isValid && !loading ? theme.primary : theme.border,
                    opacity: isValid && !loading ? 1 : 0.5,
                  },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {loading ? "Creating..." : "Create Request"}
                </Text>
              </Pressable>
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
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 0.45,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

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