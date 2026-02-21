import { View, Text, StyleSheet, TextInput, Pressable, Platform, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { updateRequest } from "@/services/api";

export default function EditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [item, setItem] = useState("");
  const [outlet, setOutlet] = useState("");
  const [customOutlet, setCustomOutlet] = useState("");
  const [hostel, setHostel] = useState("");
  const [fee, setFee] = useState("");

  useEffect(() => {
    setItem((params.item as string) || "");
    setOutlet((params.outlet as string) || "");
    setHostel((params.hostel as string) || "");
    setFee((params.fee as string) || "");
  }, []);

  const finalOutlet =
    outlet === "Other" ? customOutlet : outlet;

  const handleUpdate = async () => {
    await updateRequest(id, {
      itemDescription: item,
      outlet: finalOutlet,
      hostel,
      fee: Number(fee),
    });

    router.replace("/requests");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
              >
    <View style={styles.container}>
      <Text style={styles.title}>Edit Request</Text>

      <TextInput
        placeholder="Item"
        value={item}
        onChangeText={setItem}
        style={styles.input}
      />

      <TextInput
        placeholder="Hostel"
        value={hostel}
        onChangeText={setHostel}
        style={styles.input}
      />

      <Picker
        selectedValue={outlet}
        onValueChange={(value) => setOutlet(value)}
        style={styles.picker}
      >
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

      <Pressable onPress={handleUpdate} style={styles.button}>
        <Text>Update</Text>
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
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
  },
});