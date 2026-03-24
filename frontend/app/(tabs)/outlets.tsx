import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
} from "@/services/api";

export default function OutletsScreen() {
  const [outlets, setOutlets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const isValid =
    name.trim() !== "" && locationDescription.trim() !== "";

  const loadOutlets = async () => {
    setLoading(true);
    const data = await getOutlets();
    setOutlets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOutlets();
  }, []);

  const handleSubmit = async () => {
    if (!isValid) return;

    if (editingId) {
      await updateOutlet(editingId, {
        name,
        locationDescription,
      });
      setEditingId(null);
    } else {
      await createOutlet({ name, locationDescription });
    }

    setName("");
    setLocationDescription("");
    loadOutlets();
  };

  const handleEdit = (o: any) => {
    setEditingId(o._id);
    setName(o.name);
    setLocationDescription(o.locationDescription);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete Outlet", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteOutlet(id);
          loadOutlets();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading outlets...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* HEADER */}
      <Text style={styles.title}>
        {editingId ? "Edit Outlet" : "Create Outlet"}
      </Text>

      {/* FORM CARD */}
      <View style={styles.card}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Outlet Name"
          style={styles.input}
        />

        <TextInput
          value={locationDescription}
          onChangeText={setLocationDescription}
          placeholder="Location Description"
          style={styles.input}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={!isValid}
          style={({ pressed }) => [
            styles.button,
            !isValid && styles.disabledButton,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
        >
          <Text style={styles.buttonText}>
            {editingId ? "Update Outlet" : "Create Outlet"}
          </Text>
        </Pressable>
      </View>

      {/* LIST */}
      {outlets.map((o) => (
        <View key={o._id} style={styles.card}>
          <Text style={styles.name}>{o.name}</Text>

          <Text style={styles.meta}>
            📍 {o.locationDescription}
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => handleEdit(o)}
              style={({ pressed }) => [
                styles.editButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={styles.editText}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => confirmDelete(o._id)}
              style={({ pressed }) => [
                styles.deleteButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
  },

  /* 🔥 PREMIUM CARD */
  card: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 16,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: "#fff",
  },

  /* 🔥 INPUT */
  input: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
  },

  /* 🔥 BUTTON */
  button: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  disabledButton: {
    opacity: 0.4,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
  },

  meta: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 12,
  },

  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#e0ecff",
    borderRadius: 10,
    marginRight: 8,
  },

  editText: {
    color: "#2563eb",
    fontWeight: "600",
  },

  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fee2e2",
    borderRadius: 10,
  },

  deleteText: {
    color: "#dc2626",
    fontWeight: "600",
  },
});