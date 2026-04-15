import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState, useCallback } from "react";
import { users } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import Card from "@/components/ui/Card";
import TopBar from "@/components/ui/TopBar";
import { Ionicons } from "@expo/vector-icons";

type UserItem = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  hostel?: string | null;
  createdAt?: string;
};

export default function UsersScreen() {
  const { theme } = useTheme();
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, []);

  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editHostel, setEditHostel] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await users.getAll();
      setUsersList((data.users || []) as UserItem[]);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return usersList
      .filter((user) => user.role === "student")
      .filter((user) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          user.name?.toLowerCase().includes(q) ||
          user.email?.toLowerCase().includes(q) ||
          user.phone?.toLowerCase().includes(q)
        );
      });
  }, [usersList, query]);

  const openEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditPhone(user.phone || "");
    setEditHostel(user.hostel || "");
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditName("");
    setEditPhone("");
    setEditHostel("");
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert("Validation", "Name and phone are required");
      return;
    }

    try {
      await users.updateFields(editingUser._id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        hostel: editHostel.trim() || null,
      });
      Alert.alert("Success", "User updated");
      closeEdit();
      fetchUsers();
    } catch (error) {
      Alert.alert("Error", "Failed to update user");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    Alert.alert(
      "Delete User",
      `Delete ${name}? This will also delete related requests.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await users.delete(id);
              Alert.alert("Success", "User deleted");
              fetchUsers();
            } catch (error) {
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={styles.container}>
        <TopBar title="Students (Admin)" />

        <Card>
          <Text style={[styles.title, { color: theme.text }]}>Student Management</Text>

          <TextInput
            placeholder="Search by name, email, or phone"
            placeholderTextColor={theme.subtext}
            value={query}
            onChangeText={setQuery}
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg },
            ]}
          />

          <Text style={[styles.countText, { color: theme.subtext }]}>Showing {filteredUsers.length} students</Text>
        </Card>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            ListEmptyComponent={
              <Card>
                <Text style={{ textAlign: "center", color: theme.subtext }}>No students found</Text>
              </Card>
            }
            renderItem={({ item }) => (
              <Card>
                <View style={styles.userHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                    <Text style={{ color: theme.subtext, marginTop: 4 }}>{item.email}</Text>
                    <Text style={{ color: theme.subtext, marginTop: 2 }}>Phone: {item.phone}</Text>
                    {item.hostel && (
                      <Text style={{ color: theme.subtext, marginTop: 2 }}>Hostel: {item.hostel}</Text>
                    )}
                  </View>
                  <View style={styles.actionCol}>
                    <Pressable onPress={() => openEdit(item)} style={styles.iconButton}>
                      <Ionicons name="pencil" size={17} color={theme.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(item._id, item.name)}
                      style={styles.iconButton}
                    >
                      <Ionicons name="trash" size={17} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </View>

      <Modal visible={!!editingUser} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
          <ScrollView contentContainerStyle={styles.modalWrap}>
            <Card>
              <View style={styles.modalHeader}>
                <Text style={[styles.title, { color: theme.text }]}>Edit Student</Text>
                <Pressable onPress={closeEdit}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <Text style={[styles.label, { color: theme.text }]}>Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Name"
                placeholderTextColor={theme.subtext}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
              />

              <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone"
                placeholderTextColor={theme.subtext}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
              />

              <Text style={[styles.label, { color: theme.text }]}>Hostel</Text>
              <TextInput
                value={editHostel}
                onChangeText={setEditHostel}
                placeholder="Hostel"
                placeholderTextColor={theme.subtext}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg },
                ]}
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={closeEdit}
                  style={[styles.modalButton, { backgroundColor: theme.border }]}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveEdit}
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.modalButtonText, { color: "#fff" }]}>Save</Text>
                </Pressable>
              </View>
            </Card>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  roleFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  roleChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 12,
    marginTop: 2,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionCol: {
    gap: 6,
    marginLeft: 8,
  },
  iconButton: {
    padding: 8,
  },
  modalWrap: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    fontWeight: "700",
  },
});
