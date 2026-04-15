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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { outlets, users } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import Card from "@/components/ui/Card";
import TopBar from "@/components/ui/TopBar";
import { Ionicons } from "@expo/vector-icons";

export default function OutletsScreen() {
  const { theme } = useTheme();
  const [outletsList, setOutletsList] = useState<any[]>([]);
  const [filteredOutlets, setFilteredOutlets] = useState<any[]>([]);
  const [outletOwners, setOutletOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOutlets();
    setRefreshing(false);
  }, []);
  
  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  useEffect(() => {
    fetchOutlets();
    fetchOutletOwners();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    if (!query.trim()) {
      setFilteredOutlets(outletsList);
    } else {
      setFilteredOutlets(
        outletsList.filter((outlet) =>
          outlet.name?.toLowerCase().includes(query) ||
          outlet.locationDescription?.toLowerCase().includes(query) ||
          outlet.owner?.name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, outletsList]);

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const data = await outlets.getAll();
      setOutletsList(data);
      setFilteredOutlets(data);
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

  const handleEdit = (outlet: any) => {
    setEditingId(outlet._id);
    setName(outlet.name);
    setLocation(outlet.locationDescription);
    setSelectedOwner(outlet.owner || null);
    if (outlet.owner) {
      setOwnerName(outlet.owner.name || "");
      setOwnerEmail(outlet.owner.email || "");
      setOwnerPhone(outlet.owner.phone || "");
    }
    setOwnerPassword(""); // Don't pre-fill password
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !name.trim() || !location.trim() || !selectedOwner) {
      Alert.alert("Validation", "Please fill in all fields and select an owner");
      return;
    }

    try {
      const updatePayload: any = {
        name,
        locationDescription: location,
        ownerId: selectedOwner._id || selectedOwner.id
      };

      // Add owner details if they've been modified
      if (ownerName?.trim()) updatePayload.ownerName = ownerName;
      if (ownerEmail?.trim()) updatePayload.ownerEmail = ownerEmail;
      if (ownerPhone?.trim()) updatePayload.ownerPhone = ownerPhone;
      if (ownerPassword?.trim()) updatePayload.ownerPassword = ownerPassword;

      await outlets.update(editingId, updatePayload);
      Alert.alert("Success", "Outlet and owner updated! ✅");
      setName("");
      setLocation("");
      setSelectedOwner(null);
      setOwnerName("");
      setOwnerEmail("");
      setOwnerPhone("");
      setOwnerPassword("");
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
    setOwnerName("");
    setOwnerEmail("");
    setOwnerPhone("");
    setOwnerPassword("");
    setShowOwnerDropdown(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={styles.container}>
        <TopBar title="Outlets (Admin)" />

        <Card>
          <Text style={[styles.searchTitle, { color: theme.text }]}>Search Outlets</Text>
          <TextInput
            placeholder="Search by name, location, or owner"
            placeholderTextColor={theme.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg },
            ]}
          />
          <Text style={[styles.countText, { color: theme.subtext }]}>Showing {filteredOutlets.length} outlets</Text>
        </Card>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredOutlets}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", color: theme.subtext, marginTop: 20 }}>
                No outlets found
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
                  Edit Outlet
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

                {selectedOwner && (
                  <>
                    <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
                      Owner Details
                    </Text>

                    <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>Owner Name</Text>
                    <TextInput
                      placeholder={selectedOwner.name || "Name"}
                      placeholderTextColor={theme.subtext}
                      value={ownerName}
                      onChangeText={setOwnerName}
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderColor: theme.border,
                          backgroundColor: theme.bg,
                        },
                      ]}
                    />

                    <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>Email</Text>
                    <TextInput
                      placeholder={selectedOwner.email || "Email"}
                      placeholderTextColor={theme.subtext}
                      value={ownerEmail}
                      onChangeText={setOwnerEmail}
                      keyboardType="email-address"
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderColor: theme.border,
                          backgroundColor: theme.bg,
                        },
                      ]}
                    />

                    <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>Phone</Text>
                    <TextInput
                      placeholder={selectedOwner.phone || "Phone"}
                      placeholderTextColor={theme.subtext}
                      value={ownerPhone}
                      onChangeText={setOwnerPhone}
                      keyboardType="phone-pad"
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderColor: theme.border,
                          backgroundColor: theme.bg,
                        },
                      ]}
                    />

                    <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>New Password (optional)</Text>
                    <TextInput
                      placeholder="Leave blank to keep current"
                      placeholderTextColor={theme.subtext}
                      value={ownerPassword}
                      onChangeText={setOwnerPassword}
                      secureTextEntry
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderColor: theme.border,
                          backgroundColor: theme.bg,
                        },
                      ]}
                    />
                  </>
                )}

                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={closeForm}
                    style={[styles.button, { flex: 1, backgroundColor: theme.border }]}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUpdate}
                    style={[
                      styles.button,
                      { flex: 1, backgroundColor: theme.primary, marginLeft: 8 },
                    ]}
                  >
                    <Text style={[styles.buttonText, { color: "#fff" }]}>
                      Update
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

  searchTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },

  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  countText: {
    fontSize: 12,
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
