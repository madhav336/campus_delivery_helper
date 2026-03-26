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
import { getOutlets, createOutlet, deleteOutlet, updateOutlet } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import Card from "@/components/ui/Card";
import GradientButton from "@/components/ui/GradientButton";
import TopBar from "@/components/ui/TopBar";

export default function OutletsScreen() {
  const { theme } = useTheme();

  const [outlets, setOutlets] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchOutlets = async () => {
    try {
      const data = await getOutlets();
      setOutlets(data);
    } catch (error) {
      console.error("Failed to fetch outlets", error);
      Alert.alert("Error", "Failed to fetch outlets");
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const handleCreate = async () => {
    if (!name || !locationDescription) {
      Alert.alert("Validation Error", "Please fill all fields");
      return;
    }

    try {
      await createOutlet({ name, locationDescription });
      setName("");
      setLocationDescription("");
      Alert.alert("Success", "Outlet created! ✅");
      fetchOutlets();
    } catch (error) {
      Alert.alert("Error", "Failed to create outlet");
      console.error("Failed to create outlet", error);
    }
  };

  const handleUpdate = async () => {
    if (!name || !locationDescription || !editingId) {
      Alert.alert("Validation Error", "Please fill all fields");
      return;
    }

    try {
      await updateOutlet(editingId, { name, locationDescription });
      setName("");
      setLocationDescription("");
      setEditingId(null);
      Alert.alert("Success", "Outlet updated! ✅");
      fetchOutlets();
    } catch (error) {
      Alert.alert("Error", "Failed to update outlet");
      console.error("Failed to update outlet", error);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Outlet", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteOutlet(id);
            Alert.alert("Success", "Outlet deleted! ✅");
            fetchOutlets();
          } catch (error) {
            Alert.alert("Error", "Failed to delete outlet");
            console.error("Failed to delete outlet", error);
          }
        },
      },
    ]);
  };

  const handleEditStart = (outlet: any) => {
    setEditingId(outlet._id);
    setName(outlet.name);
    setLocationDescription(outlet.locationDescription);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setName("");
    setLocationDescription("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={styles.container}>
        <TopBar title="Outlets" />

        {/* FORM CARD */}
        <Card>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            {editingId ? "Edit Outlet" : "Create Outlet"}
          </Text>

          <TextInput
            placeholder="Outlet Name"
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
            placeholder="Location Description"
            placeholderTextColor={theme.subtext}
            value={locationDescription}
            onChangeText={setLocationDescription}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.bg,
                borderColor: theme.border,
              },
            ]}
          />

          {/* ACTION BUTTONS */}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <GradientButton
                title={editingId ? "Update Outlet" : "Create Outlet"}
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

        {/* OUTLETS LIST */}
        <FlatList
          data={outlets}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: theme.subtext }}>
              No outlets yet
            </Text>
          }
          renderItem={({ item }) => (
            <Card>
              <Text style={[styles.name, { color: theme.text }]}>
                {item.name}
              </Text>

              <Text style={{ color: theme.subtext, marginBottom: 12 }}>
                📍 {item.locationDescription}
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
