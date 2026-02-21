import { View, Text, StyleSheet, TextInput, Pressable, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { Picker } from "@react-native-picker/picker";
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

      router.replace("/requests");
    } catch (err) {
      console.error("Create failed", err);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={{ flex: 1 }}
  >
    <View style={styles.container}>
      <Text style={styles.title}>Create Request</Text>

      <TextInput
        placeholder="Item"
        value={item}
        onChangeText={setItem}
        style={styles.input}
      />
      {itemError && <Text style={styles.errorText}>Item required</Text>}

      <TextInput
        placeholder="Hostel"
        value={hostel}
        onChangeText={setHostel}
        style={styles.input}
      />
      {hostelError && <Text style={styles.errorText}>Hostel required</Text>}

      <Picker
        selectedValue={outlet}
        onValueChange={(value) => setOutlet(value)}
        style={styles.picker}
      >
        <Picker.Item label="Select outlet" value="" />
        <Picker.Item label="ANC 1" value="ANC 1" />
        <Picker.Item label="ANC 2" value="ANC 2" />
        <Picker.Item label="CP" value="CP" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      {outlet === "Other" && (
        <TextInput
          placeholder="Enter outlet name"
          value={customOutlet}
          onChangeText={setCustomOutlet}
          style={styles.input}
        />
      )}

      <TextInput
        placeholder="Fee"
        value={fee}
        onChangeText={setFee}
        keyboardType="numeric"
        style={styles.input}
      />
      {feeError && <Text style={styles.errorText}>Fee must be greater than 0</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={!isValid}
        style={[styles.button, !isValid && styles.disabledButton]}
      >
        <Text>Create</Text>
      </Pressable>
    </View>
    </KeyboardAvoidingView>
</TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  button: {
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 6,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.5 },
  errorText: { color: "red", fontSize: 12, marginBottom: 8 },
  picker: { borderWidth: 1, borderColor: "#ccc", marginBottom: 12 },
});