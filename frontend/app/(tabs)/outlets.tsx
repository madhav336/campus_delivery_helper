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
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import ModeSwitcher from "@/components/ui/ModeSwitcher";

export default function OutletsScreen() {
  const { theme } = useTheme();

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
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 8, color: theme.text }}>
          Loading outlets...
        </Text>
        <ModeSwitcher />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          
          {/* HEADER */}
          <Text style={[styles.title, { color: theme.text }]}>
            {editingId ? "Edit Outlet" : "Create Outlet"}
          </Text>

          {/* FORM */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Outlet Name"
              placeholderTextColor={theme.subtext}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            />

            <TextInput
              value={locationDescription}
              onChangeText={setLocationDescription}
              placeholder="Location Description"
              placeholderTextColor={theme.subtext}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={!isValid}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: theme.primary,
                  opacity: !isValid ? 0.4 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <Text style={styles.buttonText}>
                {editingId ? "Update Outlet" : "Create Outlet"}
              </Text>
            </Pressable>
          </View>

          {/* LIST */}
          {outlets.map((o) => (
            <View
              key={o._id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.name, { color: theme.text }]}>
                {o.name}
              </Text>

              <Text style={[styles.meta, { color: theme.subtext }]}>
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
      </SafeAreaView>
    </View>
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
  fontSize: 24,
  fontWeight: "700",
  marginBottom: 12,
},

  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  meta: {
    fontSize: 13,
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