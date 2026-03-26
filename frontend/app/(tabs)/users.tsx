import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { getUsers, createUser, deleteUser, updateUser } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import Card from "@/components/ui/Card";
import GradientButton from "@/components/ui/GradientButton";
import TopBar from "@/components/ui/TopBar";

export default function UsersScreen() {
  const { theme } = useTheme();

  const [users, setUsers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [hostel, setHostel] = useState("");
  const [role, setRole] = useState<"STUDENT" | "OUTLET_OWNER">("STUDENT");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      Alert.alert("Error", "Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    if (!name || !hostel) {
      Alert.alert("Validation Error", "Please fill all fields");
      return;
    }

    try {
      await createUser({ name, hostel, role });
      setName("");
      setHostel("");
      setRole("STUDENT");
      Alert.alert("Success", "User created! ✅");
      fetchUsers();
    } catch (error) {
      Alert.alert("Error", "Failed to create user");
      console.error("Failed to create user", error);
    }
  };

  const handleUpdate = async () => {
    if (!name || !hostel || !editingId) {
      Alert.alert("Validation Error", "Please fill all fields");
      return;
    }

    try {
      await updateUser(editingId, { name, hostel, role });
      setName("");
      setHostel("");
      setRole("STUDENT");
      setEditingId(null);
      Alert.alert("Success", "User updated! ✅");
      fetchUsers();
    } catch (error) {
      Alert.alert("Error", "Failed to update user");
      console.error("Failed to update user", error);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete User", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUser(id);
            Alert.alert("Success", "User deleted! ✅");
            fetchUsers();
          } catch (error) {
            Alert.alert("Error", "Failed to delete user");
            console.error("Failed to delete user", error);
          }
        },
      },
    ]);
  };

  const handleEditStart = (user: any) => {
    setEditingId(user._id);
    setName(user.name);
    setHostel(user.hostel);
    setRole(user.role);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setName("");
    setHostel("");
    setRole("STUDENT");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={styles.container}>
        <TopBar title="Users" />

        {/* FORM */}
        <Card>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            {editingId ? "Edit User" : "Create User"}
          </Text>

          <TextInput
            placeholder="Name"
            placeholderTextColor={theme.subtext}
            value={name}
            onChangeText={setName}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.bg,
                borderColor: theme.border,
              },
            ]}
          />

          <TextInput
            placeholder="Hostel"
            placeholderTextColor={theme.subtext}
            value={hostel}
            onChangeText={setHostel}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.bg,
                borderColor: theme.border,
              },
            ]}
          />

          {/* ROLE SELECT */}
          <View style={styles.roleRow}>
            {["STUDENT", "OUTLET_OWNER"].map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r as any)}
                style={[
                  styles.roleButton,
                  {
                    backgroundColor:
                      role === r ? theme.primary : theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: role === r ? "#fff" : theme.text,
                    fontWeight: "600",
                  }}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <GradientButton
                title={editingId ? "Update User" : "Create User"}
                onPress={editingId ? handleUpdate : handleCreate}
              />
            </View>
            {editingId && (
              <Pressable
                onPress={handleEditCancel}
                style={[styles.cancelBtn, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
            )}
          </View>
        </Card>

        {/* LIST */}
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: theme.subtext }}>
              No users yet
            </Text>
          }
          renderItem={({ item }) => (
            <Card>
              <Text style={[styles.name, { color: theme.text }]}>
                {item.name}
              </Text>

              <Text style={{ color: theme.subtext, marginBottom: 4 }}>
                Role: {item.role}
              </Text>
              <Text style={{ color: theme.subtext, marginBottom: 12 }}>
                Hostel: {item.hostel}
              </Text>

              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => handleEditStart(item)}
                  style={[styles.editBtn, { borderColor: theme.primary }]}
                >
                  <Text style={{ color: theme.primary, fontWeight: "600" }}>
                    Edit
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(item._id)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  cardActions: {
    flexDirection: "row",
    gap: 10,
  },

  editBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
  },

  deleteBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    alignItems: "center",
  },

  deleteText: {
    color: "#dc2626",
    fontWeight: "700",
  },
});
