import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/api";

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [role, setRole] = useState<"REQUESTER" | "DELIVERER">("REQUESTER");
  const [hostel, setHostel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const isValid = name.trim() !== "" && hostel.trim() !== "";

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async () => {
    if (!isValid) return;

    if (editingId) {
      await updateUser(editingId, { name, role, hostel });
      setEditingId(null);
    } else {
      await createUser({ name, role, hostel });
    }

    setName("");
    setHostel("");
    setRole("REQUESTER");
    loadUsers();
  };

  const handleEdit = (user: any) => {
    setEditingId(user._id);
    setName(user.name);
    setRole(user.role);
    setHostel(user.hostel);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete User", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteUser(id);
          loadUsers();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading users...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {editingId ? "Edit User" : "Create User"}
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name"
        style={styles.input}
      />

      <TextInput
        value={hostel}
        onChangeText={setHostel}
        placeholder="Hostel"
        style={styles.input}
      />

      <View style={styles.roleRow}>
        <Pressable
          onPress={() => setRole("REQUESTER")}
          style={[
            styles.roleButton,
            role === "REQUESTER" && styles.selectedRole,
          ]}
        >
          <Text>Requester</Text>
        </Pressable>

        <Pressable
          onPress={() => setRole("DELIVERER")}
          style={[
            styles.roleButton,
            role === "DELIVERER" && styles.selectedRole,
          ]}
        >
          <Text>Deliverer</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={!isValid}
        style={[styles.button, !isValid && styles.disabledButton]}
      >
        <Text>{editingId ? "Update" : "Create"}</Text>
      </Pressable>

      {users.map((u) => (
        <View key={u._id} style={styles.card}>
          <Text style={styles.name}>{u.name}</Text>
          <Text style={styles.meta}>Role: {u.role}</Text>
          <Text style={styles.meta}>Hostel: {u.hostel}</Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => handleEdit(u)}
              style={styles.editButton}
            >
              <Text style={styles.editText}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => confirmDelete(u._id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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

  roleRow: { flexDirection: "row", marginBottom: 12 },

  roleButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginRight: 8,
    alignItems: "center",
  },

  selectedRole: {
    backgroundColor: "#d6e4ff",
    borderColor: "#3366ff",
  },

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