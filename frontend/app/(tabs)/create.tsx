import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
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
    <View style={styles.container}>
      <Text style={styles.title}>Create Request</Text>

      <View style={styles.card}>
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

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={outlet}
            onValueChange={(value) => setOutlet(value)}
          >
            <Picker.Item label="Select outlet" value="" />
            <Picker.Item label="ANC 1" value="ANC 1" />
            <Picker.Item label="ANC 2" value="ANC 2" />
            <Picker.Item label="CP" value="CP" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

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
        {feeError && (
          <Text style={styles.errorText}>
            Fee must be greater than 0
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={!isValid}
          style={({ pressed }) => [
            styles.button,
            !isValid && styles.disabledButton,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
        >
          <Text style={styles.buttonText}>Create</Text>
        </Pressable>
      </View>
    </View>
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

  /* 🔥 BOLD CARD */
  card: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#fff",
  },

  /* 🔥 BOLD INPUT */
  input: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  /* 🔥 PICKER */
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  /* 🔥 BUTTON */
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