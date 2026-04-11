import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { users } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import Card from "@/components/ui/Card";
import TopBar from "@/components/ui/TopBar";

export default function UsersScreen() {
  const { theme } = useTheme();

  const [usersList, setUsersList] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const data = await users.getAll();
      setUsersList(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      Alert.alert("Error", "Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    Alert.alert("Info", "New users are created through the signup process. This admin panel only allows deleting users.");
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete User", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await users.delete(id);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={styles.container}>
        <TopBar title="Users (Admin)" />

        {/* INFO */}
        <Card>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            User Management
          </Text>
          <Text style={{ color: theme.subtext, marginBottom: 12 }}>
            View all users and manage their accounts. New users are created through the signup process.
          </Text>
        </Card>

        {/* LIST */}
        <FlatList
          data={usersList}
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
                Email: {item.email}
              </Text>
              <Text style={{ color: theme.subtext, marginBottom: 4 }}>
                Role: {item.role}
              </Text>
              <Text style={{ color: theme.subtext, marginBottom: 12 }}>
                {item.role === "OUTLET_OWNER" ? "Outlet" : "Hostel"}: {item.hostel}
              </Text>

              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => handleDelete(item._id)}
                  style={[styles.deleteBtn, { flex: 1 }]}
                >
                  <Text style={styles.deleteText}>Delete User</Text>
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
