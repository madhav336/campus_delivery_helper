import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { getUsers, createUser, deleteUser } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import Card from "@/components/ui/Card";
import GradientButton from "@/components/ui/GradientButton";

export default function UsersScreen() {
  const { theme, setTheme } = useTheme();

  const [users, setUsers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [hostel, setHostel] = useState("");
  const [role, setRole] = useState<"REQUESTER" | "DELIVERER">("REQUESTER");

  const fetchUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    if (!name || !hostel) return;
    await createUser({ name, hostel, role });
    setName("");
    setHostel("");
    setRole("REQUESTER");
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
    fetchUsers();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1 }}>
        
        <View style={styles.container}>
          {/* HEADER */}
          <Text style={[styles.title, { color: theme.text }]}>
            Users
          </Text>

          {/* THEME SWITCH */}
          <View style={styles.themeRow}>
            {["light", "dark", "anime"].map((t) => (
              <Pressable
                key={t}
                onPress={() => setTheme(t as any)}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* FORM */}
          <Card>
            <TextInput
              placeholder="Name"
              placeholderTextColor={theme.subtext}
              value={name}
              onChangeText={setName}
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
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
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            />

            <View style={styles.roleRow}>
              {["REQUESTER", "DELIVERER"].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r as any)}
                  style={({ pressed }) => [
                    styles.roleButton,
                    {
                      backgroundColor:
                        role === r ? theme.primary : theme.background,
                      borderColor: theme.border,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
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

            <GradientButton title="Create User" onPress={handleCreate} />
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

                <Text style={{ color: theme.subtext }}>
                  Role: {item.role}
                </Text>
                <Text style={{ color: theme.subtext }}>
                  Hostel: {item.hostel}
                </Text>

                <Pressable
                  onPress={() => handleDelete(item._id)}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </Card>
            )}
          />
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0, // 🔥 no extra gap
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },

  themeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  themeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
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

  name: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  deleteBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    alignSelf: "flex-start",
  },

  deleteText: {
    color: "#dc2626",
    fontWeight: "700",
  },
});