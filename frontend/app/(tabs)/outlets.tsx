import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { outlets, users } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import Card from "@/components/ui/Card";
import TopBar from "@/components/ui/TopBar";
import { Ionicons } from "@expo/vector-icons";

export default function OutletsScreen() {
  const { theme } = useTheme();
  const [outletsList, setOutletsList] = useState<any[]>([]);
  const [outletOwners, setOutletOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<any>(null);

  useEffect(() => {
    fetchOutlets();
    fetchOutletOwners();
  }, []);

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const data = await outlets.getAll();
      setOutletsList(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch outlets");
    } finally {
      setLoading(false);
    }
  };

  const fetchOutletOwners = async () => {
    try {
      const data = await (users.getAll as any)('outlet_owner');
      setOutletOwners(data.users || []);
    } catch (error) {
      console.error("Failed to fetch outlet owners", error);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !location.trim() || !selectedOwner) {
      Alert.alert("Validation", "Please fill in all fields and select an owner");
      return;
    }

    try {
      await outlets.create(name, location, selectedOwner._id);
      Alert.alert("Success", "Outlet created and linked to owner! ✅");
      setName("");
      setLocation("");
      setSelectedOwner(null);
      setShowForm(false);
      fetchOutlets();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create outlet");
      console.error(error);
    }
  };

  const handleEdit = (outlet: any) => {
    setEditingId(outlet._id);
    setName(outlet.name);
    setLocation(outlet.locationDescription);
    setSelectedOwner(outlet.owner || null);
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !name.trim() || !location.trim() || !selectedOwner) {
      Alert.alert("Validation", "Please fill in all fields and select an owner");
      return;
    }

    try {
      await outlets.update(editingId, name, location, selectedOwner._id);
      Alert.alert("Success", "Outlet updated! ✅");
      setName("");
      setLocation("");
      setSelectedOwner(null);
      setEditingId(null);
      setShowForm(false);
      fetchOutlets();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update outlet");
      console.error(error);
    }
  };

  const handleDelete = (outletId: string) => {
    Alert.alert("Delete Outlet", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await outlets.delete(outletId);
            Alert.alert("Success", "Outlet deleted! ✅");
            fetchOutlets();
          } catch (error) {
            Alert.alert("Error", "Failed to delete outlet");
            console.error(error);
          }
        },
      },
    ]);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setLocation("");
    setSelectedOwner(null);
    setShowOwnerDropdown(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={styles.container}>
        <TopBar title="Outlets (Admin)" />

        {/* CREATE BUTTON */}
        <Pressable
          onPress={() => {
            setEditingId(null);
            setName("");
            setLocation("");
            setSelectedOwner(null);
            setShowForm(true);
          }}
          style={[styles.createButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.createButtonText}>New Outlet</Text>
        </Pressable>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={outletsList}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", color: theme.subtext, marginTop: 20 }}>
                No outlets available
              </Text>
            }
            renderItem={({ item }) => (
              <Card>
                <View style={styles.outletCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.text }]}>
                      {item.name}
                    </Text>
                    {item.locationDescription && (
                      <Text style={{ color: theme.subtext, marginTop: 8 }}>
                        📍 {item.locationDescription}
                      </Text>
                    )}
                    {item.owner && (
                      <Text style={[styles.ownerInfo, { color: theme.primary, marginTop: 6 }]}>
                        👤 {item.owner.name || item.owner.email}
                      </Text>
                    )}
                    {item.requestsCount !== undefined && (
                      <Text style={[styles.stats, { color: theme.subtext, marginTop: 8 }]}>
                        Availability requests: {item.requestsCount}
                      </Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => handleEdit(item)}
                      style={{ padding: 8 }}
                    >
                      <Ionicons name="pencil" size={18} color={theme.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(item._id)}
                      style={{ padding: 8 }}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              </Card>
            )}
          />
        )}

        {/* FORM MODAL */}
        <Modal visible={showForm} animationType="slide" transparent={true}>
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              style={{ backgroundColor: theme.bg }}
            >
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: theme.text }]}>
                  {editingId ? "Edit Outlet" : "Create New Outlet"}
                </Text>
                <Pressable onPress={closeForm}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <Card>
                <Text style={[styles.label, { color: theme.text }]}>Outlet Name</Text>
                <TextInput
                  placeholder="e.g., Central Canteen"
                  placeholderTextColor={theme.subtext}
                  value={name}
                  onChangeText={setName}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.bg,
                    },
                  ]}
                />

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
                  Location Description
                </Text>
                <TextInput
                  placeholder="e.g., Building A, Ground Floor"
                  placeholderTextColor={theme.subtext}
                  value={location}
                  onChangeText={setLocation}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.bg,
                    },
                  ]}
                />

                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
                  Outlet Owner
                </Text>
                <Pressable
                  onPress={() => setShowOwnerDropdown(!showOwnerDropdown)}
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.bg,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 12,
                    },
                  ]}
                >
                  <Text style={{ color: selectedOwner ? theme.text : theme.subtext }}>
                    {selectedOwner ? selectedOwner.name : "Select an outlet owner"}
                  </Text>
                  <Ionicons
                    name={showOwnerDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.primary}
                  />
                </Pressable>

                {showOwnerDropdown && (
                  <ScrollView style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]} scrollEnabled={true} nestedScrollEnabled>
                    {outletOwners.map((owner) => (
                      <Pressable
                        key={owner._id}
                        onPress={() => {
                          setSelectedOwner(owner);
                          setShowOwnerDropdown(false);
                        }}
                        style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                      >
                        <Text style={{ color: theme.text, fontWeight: "500" }}>
                          {owner.name}
                        </Text>
                        <Text style={[styles.ownerDesc, { color: theme.subtext }]}>
                          {owner.email}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={closeForm}
                    style={[styles.button, { flex: 1, backgroundColor: theme.border }]}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={editingId ? handleUpdate : handleCreate}
                    style={[
                      styles.button,
                      { flex: 1, backgroundColor: theme.primary, marginLeft: 8 },
                    ]}
                  >
                    <Text style={[styles.buttonText, { color: "#fff" }]}>
                      {editingId ? "Update" : "Create"}
                    </Text>
                  </Pressable>
                </View>
              </Card>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },

  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  outletCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  ownerInfo: {
    fontSize: 12,
    fontWeight: "500",
  },

  stats: {
    fontSize: 12,
  },

  actions: {
    flexDirection: "row",
    gap: 4,
  },

  // Form styles
  modalContent: {
    padding: 16,
    paddingBottom: 100,
  },

  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  formTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    marginBottom: 16,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },

  ownerDesc: {
    fontSize: 12,
    marginTop: 4,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 8,
  },

  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
