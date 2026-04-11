import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { users, auth } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { theme, mode } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [hostel, setHostel] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await users.getMe();
      setProfile(data);
      setPhone(data.phone || "");
      setHostel(data.hostel || "");
    } catch (error) {
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await users.updateProfile(phone, hostel);
      Alert.alert("Success", "Profile updated! ✅");
      setEditing(false);
      loadProfile();
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await auth.logout();
          router.replace("/(auth)/login" as any);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Profile" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Profile" />
        <View style={styles.centered}>
          <Text style={{ color: theme.text }}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Profile" />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {/* PROFILE CARD */}
        <Card>
          <View style={styles.profileHeader}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.primary, opacity: 0.2 },
              ]}
            >
              <Ionicons name="person" size={40} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.text }]}>
                {profile.email || "User"}
              </Text>
              <Text style={[styles.role, { color: theme.subtext }]}>
                {profile.role?.replace("_", " ").toUpperCase() || "Student"}
              </Text>
            </View>
          </View>
        </Card>

        {/* STATS */}
        {mode === "STUDENT" && (
          <Card>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Stats
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {profile.requesterRating?.toFixed(1) || "0"}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subtext }]}>
                  Requester Rating
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {profile.delivererRating?.toFixed(1) || "0"}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subtext }]}>
                  Deliverer Rating
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* EDIT FIELDS */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Contact Info
          </Text>

          {!editing ? (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.subtext }]}>
                  Phone
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {phone || "Not set"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.subtext }]}>
                  {mode === "STUDENT" ? "Hostel" : "Outlet"}
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {hostel || "Not set"}
                </Text>
              </View>
              <Pressable
                onPress={() => setEditing(true)}
                style={[styles.editButton, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8 }}>
                  Edit
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone"
                placeholderTextColor={theme.subtext}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.bg,
                  },
                ]}
              />

              <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                {mode === "STUDENT" ? "Hostel" : "Outlet"}
              </Text>
              <TextInput
                value={hostel}
                onChangeText={setHostel}
                placeholder="Enter details"
                placeholderTextColor={theme.subtext}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.bg,
                  },
                ]}
              />

              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => setEditing(false)}
                  style={[styles.cancelButton, { backgroundColor: theme.card }]}
                >
                  <Text style={{ color: theme.text, fontWeight: "600" }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleUpdate}
                  style={[styles.saveButton, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>
                </Pressable>
              </View>
            </>
          )}
        </Card>

        {/* LOGOUT */}
        <Pressable
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: theme.error || "#ef4444" }]}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8 }}>
            Logout
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
  },
  role: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  editButton: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
});
