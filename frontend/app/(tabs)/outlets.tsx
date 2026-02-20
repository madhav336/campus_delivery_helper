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
      <Text style={styles.title}>
        {editingId ? "Edit Outlet" : "Create Outlet"}
      </Text>

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
        style={[styles.button, !isValid && styles.disabledButton]}
      >
        <Text>{editingId ? "Update" : "Create"}</Text>
      </Pressable>

      {outlets.map((o) => (
        <View key={o._id} style={styles.card}>
          <Text style={styles.name}>{o.name}</Text>
          <Text style={styles.meta}>
            Location: {o.locationDescription}
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => handleEdit(o)}
              style={styles.editButton}
            >
              <Text style={styles.editText}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => confirmDelete(o._id)}
              style={styles.deleteButton}
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
  container: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 16 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
  },

  button: {
    backgroundColor: "#eee",
    padding: 12,
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 16,
  },

  disabledButton: { opacity: 0.5 },

  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#555", marginTop: 4 },

  actionRow: { flexDirection: "row", marginTop: 10 },

  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#e5f0ff",
    borderRadius: 6,
    marginRight: 8,
  },

  editText: { color: "#0066cc", fontWeight: "600" },

  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#ffe5e5",
    borderRadius: 6,
  },

  deleteText: { color: "red", fontWeight: "600" },
});