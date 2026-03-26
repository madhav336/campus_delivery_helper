import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  SectionList,
  FlatList,
  Alert,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import {
  getAvailability,
  createAvailability,
  respondAvailability,
  getOutlets,
  deleteAvailability,
  updateAvailability,
} from "@/services/api";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import TopBar from "@/components/ui/TopBar";

type AvailabilityRequest = {
  _id: string;
  requestedBy: string;
  item: string;
  outlet: string;
  status: "PENDING" | "AVAILABLE" | "NOT_AVAILABLE";
};

type Outlet = {
  _id: string;
  name: string;
  locationDescription: string;
};

export default function AvailabilityScreen() {
  const { theme, mode } = useTheme();

  const [item, setItem] = useState("");
  const [outletSearch, setOutletSearch] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState("");
  const [editOutletSearch, setEditOutletSearch] = useState("");
  const [editSelectedOutlet, setEditSelectedOutlet] = useState<string | null>(null);
  const [editShowDropdown, setEditShowDropdown] = useState(false);

  const HARDCODED_USER_ID = "65f1a3b8c2d3e4f5a6b7c8d9";

  const loadData = async () => {
    try {
      setLoading(true);
      const [availData, outletData] = await Promise.all([
        getAvailability(),
        getOutlets(),
      ]);
      setRequests(availData);
      setOutlets(outletData);
    } catch {
      console.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const filteredOutlets = outlets.filter((o) =>
    o.name.toLowerCase().includes(outletSearch.toLowerCase())
  );

  const filteredEditOutlets = outlets.filter((o) =>
    o.name.toLowerCase().includes(editOutletSearch.toLowerCase())
  );

  const handleCreate = async () => {
    if (!item.trim() || !selectedOutlet) {
      Alert.alert("Validation Error", "Please enter item and select an outlet");
      return;
    }

    try {
      await createAvailability({
        userId: HARDCODED_USER_ID,
        outlet: selectedOutlet,
        item,
      });
      setItem("");
      setOutletSearch("");
      setSelectedOutlet(null);
      setShowDropdown(false);
      Alert.alert("Success", "Availability request created! ✅");
      await loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to create request");
      console.error("Failed to create request", error);
    }
  };

  const handleUpdateAvailability = async (id: string) => {
    if (!editItem.trim() || !editSelectedOutlet) {
      Alert.alert("Validation Error", "Please enter item and outlet");
      return;
    }

    try {
      await updateAvailability(id, { item: editItem, outlet: editSelectedOutlet });
      setEditingId(null);
      Alert.alert("Success", "Updated! ✅");
      await loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to update");
      console.error("Failed to update", error);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAvailability(id);
            Alert.alert("Success", "Deleted! ✅");
            await loadData();
          } catch (error) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  const handleEditStart = (avail: AvailabilityRequest) => {
    setEditingId(avail._id);
    setEditItem(avail.item);
    setEditSelectedOutlet(avail.outlet);
    setEditOutletSearch(avail.outlet);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditItem("");
    setEditOutletSearch("");
    setEditSelectedOutlet(null);
    setEditShowDropdown(false);
  };

  const handleRespond = async (
    id: string,
    status: "AVAILABLE" | "NOT_AVAILABLE"
  ) => {
    try {
      await respondAvailability(id, status);
      await loadData();
    } catch (error) {
      console.error("Failed to respond:", error);
    }
  };

  // ===== STUDENT MODE =====
  if (mode === "STUDENT") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ flex: 1 }}>
          {/* FIXED HEADER */}
          <View style={[styles.headerContainer, { borderBottomColor: theme.border }]}>
            <Card>
              <Text style={[styles.title, { color: theme.text }]}>
                Request Availability
              </Text>

              {/* OUTLET SEARCH */}
              <Text style={[styles.label, { color: theme.text }]}>
                Select Outlet
              </Text>
              <TextInput
                placeholder="Search outlets..."
                placeholderTextColor={theme.subtext}
                value={outletSearch}
                onChangeText={(text) => {
                  setOutletSearch(text);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                style={[
                  styles.searchInput,
                  {
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: theme.bg,
                  },
                ]}
              />

              {selectedOutlet && (
                <View
                  style={[
                    styles.selectedPill,
                    {
                      backgroundColor: theme.primary + "20",
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Text style={{ color: theme.primary, fontWeight: "600" }}>
                    ✓ {selectedOutlet}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSelectedOutlet(null);
                      setOutletSearch("");
                    }}
                  >
                    <Text style={{ color: theme.primary, fontSize: 18 }}>×</Text>
                  </Pressable>
                </View>
              )}

              {/* DROPDOWN */}
              {showDropdown && filteredOutlets.length > 0 && (
                <ScrollView
                  style={[
                    styles.dropdown,
                    { backgroundColor: theme.bg, borderColor: theme.border },
                  ]}
                  scrollEnabled={filteredOutlets.length > 4}
                  nestedScrollEnabled
                >
                  {filteredOutlets.map((outlet) => (
                    <Pressable
                      key={outlet._id}
                      onPress={() => {
                        setSelectedOutlet(outlet.name);
                        setOutletSearch(outlet.name);
                        setShowDropdown(false);
                      }}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <Text style={{ color: theme.text, fontWeight: "500" }}>
                        {outlet.name}
                      </Text>
                      <Text style={{ color: theme.subtext, fontSize: 12 }}>
                        {outlet.locationDescription}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* ITEM INPUT */}
              <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                Item Name
              </Text>
              <TextInput
                placeholder="Enter item"
                placeholderTextColor={theme.subtext}
                value={item}
                onChangeText={setItem}
                style={[
                  styles.input,
                  {
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: theme.bg,
                  },
                ]}
              />

              <Pressable
                onPress={handleCreate}
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.primaryText}>Request Availability</Text>
              </Pressable>
            </Card>
          </View>

          {/* SCROLLABLE LIST */}
          <FlatList
            data={requests}
            keyExtractor={(item: AvailabilityRequest) => item._id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            renderItem={({ item }: { item: AvailabilityRequest }) => (
              <Card>
                <View style={styles.requestHeader}>
                  <View>
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: "600",
                        fontSize: 16,
                      }}
                    >
                      {item.item}
                    </Text>
                    <Text style={{ color: theme.subtext, marginTop: 4 }}>
                      {item.outlet}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.badge,
                      {
                        color:
                          item.status === "AVAILABLE"
                            ? "#10b981"
                            : item.status === "NOT_AVAILABLE"
                              ? "#ef4444"
                              : "#f59e0b",
                      },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  {item.status === "PENDING" && (
                    <Pressable
                      onPress={() => handleEditStart(item)}
                      style={[styles.smallBtn, { backgroundColor: theme.primary }]}
                    >
                      <Text style={styles.btnText}>Edit</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleDeleteAvailability(item._id)}
                    style={[styles.smallBtn, { backgroundColor: "#ef4444" }]}
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </Pressable>
                </View>
              </Card>
            )}
          />
        </View>

        {/* EDIT MODAL */}
        <Modal
          visible={editingId !== null}
          transparent
          animationType="slide"
          onRequestClose={handleEditCancel}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
                <View style={{ flex: 1, padding: 16 }}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Edit Availability
                  </Text>

                  <ScrollView style={{ flex: 1, marginBottom: 16 }}>
                    <Card>
                      {/* ITEM */}
                      <Text style={[styles.label, { color: theme.text }]}>
                        Item
                      </Text>
                      <TextInput
                        value={editItem}
                        onChangeText={setEditItem}
                        placeholderTextColor={theme.subtext}
                        style={[
                          styles.input,
                          {
                            borderColor: theme.border,
                            color: theme.text,
                            backgroundColor: theme.bg,
                          },
                        ]}
                      />

                      {/* OUTLET SEARCH */}
                      <Text style={[styles.label, { color: theme.text }]}>
                        Select Outlet
                      </Text>
                      <TextInput
                        placeholder="Search outlets..."
                        placeholderTextColor={theme.subtext}
                        value={editOutletSearch}
                        onChangeText={(text) => {
                          setEditOutletSearch(text);
                          setEditShowDropdown(true);
                        }}
                        onFocus={() => setEditShowDropdown(true)}
                        style={[
                          styles.searchInput,
                          {
                            borderColor: theme.border,
                            color: theme.text,
                            backgroundColor: theme.bg,
                          },
                        ]}
                      />

                      {editSelectedOutlet && (
                        <View
                          style={[
                            styles.selectedPill,
                            {
                              backgroundColor: theme.primary + "20",
                              borderColor: theme.primary,
                            },
                          ]}
                        >
                          <Text style={{ color: theme.primary, fontWeight: "600" }}>
                            ✓ {editSelectedOutlet}
                          </Text>
                          <Pressable
                            onPress={() => {
                              setEditSelectedOutlet(null);
                              setEditOutletSearch("");
                            }}
                          >
                            <Text style={{ color: theme.primary, fontSize: 18 }}>
                              ×
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      {/* DROPDOWN */}
                      {editShowDropdown && filteredEditOutlets.length > 0 && (
                        <ScrollView
                          style={[
                            styles.dropdown,
                            {
                              backgroundColor: theme.bg,
                              borderColor: theme.border,
                            },
                          ]}
                          scrollEnabled={filteredEditOutlets.length > 4}
                          nestedScrollEnabled
                        >
                          {filteredEditOutlets.map((outlet) => (
                            <Pressable
                              key={outlet._id}
                              onPress={() => {
                                setEditSelectedOutlet(outlet.name);
                                setEditOutletSearch(outlet.name);
                                setEditShowDropdown(false);
                              }}
                              style={[
                                styles.dropdownItem,
                                { borderBottomColor: theme.border },
                              ]}
                            >
                              <Text
                                style={{
                                  color: theme.text,
                                  fontWeight: "500",
                                }}
                              >
                                {outlet.name}
                              </Text>
                              <Text
                                style={{
                                  color: theme.subtext,
                                  fontSize: 12,
                                }}
                              >
                                {outlet.locationDescription}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}
                    </Card>
                  </ScrollView>

                  {/* BUTTONS */}
                  <View style={styles.modalButtonRow}>
                    <Pressable
                      onPress={() => handleUpdateAvailability(editingId!)}
                      style={[
                        styles.modalBtn,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text style={styles.btnText}>Save</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleEditCancel}
                      style={[
                        styles.modalBtn,
                        { backgroundColor: theme.subtext },
                      ]}
                    >
                      <Text style={styles.btnText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    );
  }

  // ===== OUTLET MODE =====
  const sections = [
    {
      title: "PENDING REQUESTS",
      data: requests.filter((r) => r.status === "PENDING"),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1 }}>
        <TopBar title="Availability Requests" />

        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: theme.subtext, marginTop: 20 }}>
              No requests yet
            </Text>
          }
          renderItem={({ item, section }) => (
            <Card>
              <View style={styles.requestHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 16 }}>
                    {item.item}
                  </Text>
                  <Text style={{ color: theme.subtext, marginTop: 4, fontSize: 14 }}>
                    {item.outlet}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.badge,
                    {
                      color:
                        item.status === "AVAILABLE"
                          ? "#10b981"
                          : item.status === "NOT_AVAILABLE"
                            ? "#ef4444"
                            : "#f59e0b",
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>

              {section.title === "PENDING REQUESTS" && (
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => handleRespond(item._id, "AVAILABLE")}
                    style={[
                      styles.acceptBtn,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text style={styles.btnText}>AVAILABLE</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleRespond(item._id, "NOT_AVAILABLE")}
                    style={[styles.rejectBtn, { backgroundColor: "#ef4444" }]}
                  >
                    <Text style={styles.btnText}>NOT AVAILABLE</Text>
                  </Pressable>
                </View>
              )}
            </Card>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              style={[
                styles.sectionHeader,
                {
                  color: theme.text,
                  backgroundColor: theme.bg,
                },
              ]}
            >
              {title}
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },

  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },

  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 200,
    marginBottom: 12,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  badge: {
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  acceptBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  rejectBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  changeStatusBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },

  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 8,
  },

  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },

  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
});
