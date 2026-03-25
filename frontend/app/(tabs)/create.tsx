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

export default function CreateScreen() {
  const router = useRouter();

  const [item, setItem] = useState("");
  const [outlet, setOutlet] = useState("");
  const [customOutlet, setCustomOutlet] = useState("");
  const [hostel, setHostel] = useState("");
  const [fee, setFee] = useState("");

  const itemError = item.trim() === "";
  const outletError =
    outlet === "" || (outlet === "Other" && customOutlet.trim() === "");
  const hostelError = hostel.trim() === "";
  const feeError = Number(fee) <= 0;

  const isValid =
    !itemError && !outletError && !hostelError && !feeError;

  const handleSubmit = async () => {
    if (!isValid) return;

    const finalOutlet =
      outlet === "Other" ? customOutlet : outlet;

    try {
      await createRequest({
        itemDescription: item,
        outlet: finalOutlet,
        hostel,
        fee: Number(fee),
      });

      setItem("");
      setOutlet("");
      setCustomOutlet("");
      setHostel("");
      setFee("");

      // ✅ Safe navigation inside tabs
      router.replace("/(tabs)");
    } catch (err) {
      console.error("Create failed", err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Create Request</Text>

          <View style={styles.card}>
            {/* ITEM */}
            <TextInput
              placeholder="Item"
              value={item}
              onChangeText={setItem}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {itemError && <Text style={styles.errorText}>Item required</Text>}

            {/* HOSTEL */}
            <TextInput
              placeholder="Hostel"
              value={hostel}
              onChangeText={setHostel}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {hostelError && <Text style={styles.errorText}>Hostel required</Text>}

            {/* OUTLET SELECTOR */}
            <View style={styles.outletRow}>
              {["ANC 1", "ANC 2", "CP", "Other"].map((o) => (
                <Pressable
                  key={o}
                  onPress={() => setOutlet(o)}
                  style={[
                    styles.outletButton,
                    outlet === o && styles.activeOutlet,
                  ]}
                >
                  <Text
                    style={[
                      styles.outletText,
                      outlet === o && styles.activeOutletText,
                    ]}
                  >
                    {o}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* CUSTOM OUTLET */}
            {outlet === "Other" && (
              <TextInput
                placeholder="Enter outlet name"
                value={customOutlet}
                onChangeText={setCustomOutlet}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            )}

            {/* FEE */}
            <TextInput
              placeholder="Fee"
              value={fee}
              onChangeText={setFee}
              keyboardType="numeric"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {feeError && (
              <Text style={styles.errorText}>
                Fee must be greater than 0
              </Text>
            )}

            {/* BUTTON */}
            <Pressable
              onPress={handleSubmit}
              disabled={!isValid}
              style={[styles.button, !isValid && styles.disabledButton]}
            >
              <Text style={styles.buttonText}>Create</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9fafb",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  card: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#fff",
  },

  input: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  outletRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },

  outletButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },

  activeOutlet: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },

  outletText: {
    color: "#000",
    fontWeight: "600",
  },

  activeOutletText: {
    color: "#fff",
  },

  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.4,
  },

  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
});