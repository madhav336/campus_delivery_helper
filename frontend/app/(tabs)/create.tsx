import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { Outlet } from "@/types/deliveryRequest";
import { createRequest } from "@/services/api";

export default function CreateScreen() {
  const [item, setItem] = useState("");
  const [outlet, setOutlet] = useState<Outlet | "">("");
  const [hostel, setHostel] = useState("");
  const [fee, setFee] = useState("");

  const itemError = item.trim() === "";
  const outletError = outlet === "";
  const hostelError = hostel.trim() === "";
  const feeError = Number(fee) <= 0;



  const isValid =
    !itemError &&
    !outletError &&
    !hostelError &&
    !feeError;


  const handleSubmit = async () => {
    if (!isValid) return;

    await createRequest({
      item,
      outlet: outlet as Outlet,
      hostel,
      fee: Number(fee),
    });


    // Clear form
    setItem("");
    setOutlet("");
    setHostel("");
    setFee("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Request</Text>

      <TextInput
        placeholder="Item"
        value={item}
        onChangeText={setItem}
        style={styles.input}
      />

      {itemError && (
        <Text style={styles.errorText}>Item is required</Text>
      )}


      <TextInput
        placeholder="Hostel"
        value={hostel}
        onChangeText={setHostel}
        style={styles.input}
      />

      {hostelError && (
        <Text style={styles.errorText}>Hostel is required</Text>
      )}



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

      {outletError && (
        <Text style={styles.errorText}>Outlet is required</Text>
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
        style={[
          styles.button,
          !isValid && styles.disabledButton,
        ]}
      >
        <Text>Create</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
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
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
  },


});
