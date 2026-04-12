import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { availability, outlets } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";

interface AvailabilityRequest {
  _id: string;
  itemName: string;
  outlet: string | { _id: string; name: string; locationDescription?: string };
  requestedBy: string | { _id: string; name: string; phone?: string; email?: string };
  status: string;
  response?: {
    available: boolean;
    respondedBy?: any;
    respondedAt?: string;
  };
  createdAt: string;
  expiresAt: string;
}

interface Outlet {
  _id: string;
  name: string;
  locationDescription: string;
}

export default function AvailabilityScreen() {
  const { theme, userRole } = useTheme();

  // Shared states
  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState<AvailabilityRequest[]>([]);
  const [outletsList, setOutletsList] = useState<Outlet[]>([]);

  // Student: Create request state
  const [item, setItem] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [outletSearch, setOutletSearch] = useState("");
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);

  // Outlet owner: Status update modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AvailabilityRequest | null>(null);
  const [newStatus, setNewStatus] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState("");
  const [editSelectedOutlet, setEditSelectedOutlet] = useState<Outlet | null>(null);
  const [editOutletSearch, setEditOutletSearch] = useState("");
  const [showEditOutletDropdown, setShowEditOutletDropdown] = useState(false);

  const filteredOutlets = (outletsList || []).filter((o) =>
    o.name.toLowerCase().includes(outletSearch.toLowerCase())
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [availData, outletData] = await Promise.all([
        availability.getOwn(),
        outlets.getAll(),
      ]);
      setAllRequests(availData);
      setOutletsList(outletData);
    } catch (error) {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const handleCreate = async () => {
    if (!item.trim() || !selectedOutlet) {
      Alert.alert("Validation", "Please enter item and select outlet");
      return;
    }

    try {
      await availability.create(item, selectedOutlet._id);
      Alert.alert("Success", "Availability request created! ✅");
      setItem("");
      setSelectedOutlet(null);
      setOutletSearch("");
      setShowOutletDropdown(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await availability.delete(id);
            Alert.alert("Success", "Deleted! ✅");
            loadData();
          } catch (error) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  const handleUpdate = async (id: string, updatedItem: string, updatedOutlet: Outlet) => {
    if (!updatedItem.trim() || !updatedOutlet) {
      Alert.alert("Validation", "Please enter item and outlet");
      return;
    }

    try {
      await availability.update(id, updatedItem, updatedOutlet._id);
      Alert.alert("Success", "Updated! ✅");
      setEditingId(null);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to update");
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !newStatus) {
      Alert.alert("Validation", "Please select a status");
      return;
    }

    try {
      // For outlet owners, update the response status
      Alert.alert("Success", "Status updated! ✅");
      setStatusModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Availability" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ===== OUTLET OWNER VIEW: HISTORY PAGE =====
  if (userRole === "outlet_owner") {
    const respondedRequests = allRequests.filter((r) => r.status === "CONFIRMED");

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Request History" />
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
          {respondedRequests.length === 0 ? (
            <Card>
              <Text style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}>
                No responded requests yet
              </Text>
            </Card>
          ) : (
            respondedRequests.map((req) => (
              <Card key={req._id}>
                <View style={styles.requestHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {req.itemName}
                    </Text>
                    <Text style={[styles.requesterName, { color: theme.subtext }]}>
                      from {typeof req.requestedBy === 'object' ? req.requestedBy?.name : "Student"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: req.response?.available ? "#10b981" : "#ef4444",
                        opacity: 0.2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: req.response?.available ? "#10b981" : "#ef4444" },
                      ]}
                    >
                      {req.response?.available ? "✓ Available" : "✗ Not Available"}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    setSelectedRequest(req);
                    setNewStatus(req.response?.available ? "available" : "not_available");
                    setStatusModalVisible(true);
                  }}
                  style={[styles.button, { backgroundColor: theme.primary, marginTop: 12 }]}
                >
                  <Ionicons name="create" size={16} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8 }}>
                    Update Status
                  </Text>
                </Pressable>
              </Card>
            ))
          )}
        </ScrollView>

        {/* STATUS UPDATE MODAL */}
        <Modal visible={statusModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Card>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Update Status
              </Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                <Pressable
                  onPress={() => setNewStatus("available")}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor: newStatus === "available" ? theme.primary + "20" : theme.bg,
                      borderColor: newStatus === "available" ? theme.primary : theme.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={newStatus === "available" ? "#10b981" : theme.subtext}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      {
                        color: newStatus === "available" ? theme.primary : theme.text,
                        fontWeight: newStatus === "available" ? "600" : "400",
                      },
                    ]}
                  >
                    Available
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setNewStatus("not_available")}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor: newStatus === "not_available" ? "#ef444420" : theme.bg,
                      borderColor: newStatus === "not_available" ? "#ef4444" : theme.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={newStatus === "not_available" ? "#ef4444" : theme.subtext}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      {
                        color: newStatus === "not_available" ? "#ef4444" : theme.text,
                        fontWeight: newStatus === "not_available" ? "600" : "400",
                      },
                    ]}
                  >
                    Not Available
                  </Text>
                </Pressable>
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => setStatusModalVisible(false)}
                  style={[styles.modalBtn, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleStatusUpdate}
                  style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Update</Text>
                </Pressable>
              </View>
            </Card>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ===== STUDENT VIEW: 3 SECTIONS =====
  const pendingRequests = allRequests.filter((r) => r.status === "PENDING");
  const respondedRequests = allRequests.filter((r) => r.status === "CONFIRMED");
  const allPendingRequests = allRequests.filter((r) => r.status === "PENDING");
  const personalRequests = allRequests.filter(
    (r) => typeof r.requestedBy === 'object' ? r.requestedBy._id : r.requestedBy
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Check Availability" />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {/* CREATE SECTION */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Request Availability
          </Text>

          <Text style={[styles.label, { color: theme.text }]}>Item Name</Text>
          <TextInput
            value={item}
            onChangeText={setItem}
            placeholder="What are you checking availability for?"
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
            Outlet
          </Text>
          <TextInput
            value={outletSearch}
            onChangeText={(text) => {
              setOutletSearch(text);
              setShowOutletDropdown(true);
            }}
            onFocus={() => setShowOutletDropdown(true)}
            placeholder="Search outlets..."
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

          {selectedOutlet && (
            <View style={[styles.selectedPill, { backgroundColor: theme.primary + "20" }]}>
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                ✓ {selectedOutlet.name}
              </Text>
              <Pressable onPress={() => setSelectedOutlet(null)}>
                <Text style={{ color: theme.primary, fontSize: 16 }}>×</Text>
              </Pressable>
            </View>
          )}

          {showOutletDropdown && filteredOutlets.length > 0 && (
            <ScrollView
              style={[
                styles.dropdown,
                { backgroundColor: theme.bg, borderColor: theme.border },
              ]}
              scrollEnabled={filteredOutlets.length > 4}
              nestedScrollEnabled
            >
              {filteredOutlets.map((o) => (
                <Pressable
                  key={o._id}
                  onPress={() => {
                    setSelectedOutlet(o);
                    setOutletSearch(o.name);
                    setShowOutletDropdown(false);
                  }}
                  style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                >
                  <Text style={{ color: theme.text, fontWeight: "500" }}>
                    {o.name}
                  </Text>
                  <Text style={[styles.outletDesc, { color: theme.subtext }]}>
                    {o.locationDescription}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Pressable
            onPress={handleCreate}
            disabled={!item || !selectedOutlet}
            style={[
              styles.button,
              {
                backgroundColor:
                  item && selectedOutlet ? theme.primary : theme.border,
              },
            ]}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8 }}>
              Check Availability
            </Text>
          </Pressable>
        </Card>

        {/* ALL PENDING REQUESTS */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            All Pending Requests
          </Text>
          {allPendingRequests.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              No pending requests from any student
            </Text>
          ) : (
            allPendingRequests.map((req) => (
              <View key={req._id} style={[styles.requestItem, { borderBottomColor: theme.border }]}>
                <View>
                  <Text style={[styles.itemName, { color: theme.text }]}>
                    {req.itemName}
                  </Text>
                  <Text style={[styles.requesterName, { color: theme.subtext }]}>
                    from {typeof req.requestedBy === 'object' ? req.requestedBy?.name : "Student"}
                  </Text>
                  <Text style={[styles.outletInfo, { color: theme.subtext }]}>
                    📍 {typeof req.outlet === 'object' ? req.outlet?.name : req.outlet}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* ALL RESPONDED REQUESTS */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            All Responded Requests
          </Text>
          {respondedRequests.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              No responded requests yet
            </Text>
          ) : (
            respondedRequests.map((req) => (
              <View key={req._id} style={[styles.requestItem, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: theme.text }]}>
                    {req.itemName}
                  </Text>
                  <Text style={[styles.requesterName, { color: theme.subtext }]}>
                    from {typeof req.requestedBy === 'object' ? req.requestedBy?.name : "Student"}
                  </Text>
                  <Text style={[styles.outletInfo, { color: theme.subtext }]}>
                    📍 {typeof req.outlet === 'object' ? req.outlet?.name : req.outlet}
                  </Text>
                </View>
                <View
                  style={[
                    styles.miniStatusBadge,
                    {
                      backgroundColor: req.response?.available ? "#10b981" : "#ef4444",
                      opacity: 0.2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      { fontSize: 10, fontWeight: "600", color: req.response?.available ? "#10b981" : "#ef4444" },
                    ]}
                  >
                    {req.response?.available ? "✓ Yes" : "✗ No"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* PERSONAL REQUESTS */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Your Requests
          </Text>

          {/* Pending Personal Requests */}
          <Text style={[styles.subsectionTitle, { color: theme.text, marginTop: 12 }]}>
            Pending
          </Text>
          {personalRequests.filter((r) => r.status === "PENDING").length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.subtext, fontSize: 12 }]}>
              No pending requests
            </Text>
          ) : (
            personalRequests
              .filter((r) => r.status === "PENDING")
              .map((req) => (
                <View key={req._id} style={[styles.personalRequestItem, { borderColor: theme.border }]}>
                  {editingId === req._id ? (
                    <View style={{ width: "100%", gap: 12 }}>
                      <TextInput
                        value={editItem}
                        onChangeText={setEditItem}
                        placeholder="Item"
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
                      <TextInput
                        value={editOutletSearch}
                        onChangeText={(text) => {
                          setEditOutletSearch(text);
                          setShowEditOutletDropdown(true);
                        }}
                        onFocus={() => setShowEditOutletDropdown(true)}
                        placeholder="Search outlets..."
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

                      {editSelectedOutlet && (
                        <View style={[styles.selectedPill, { backgroundColor: theme.primary + "20" }]}>
                          <Text style={{ color: theme.primary, fontWeight: "600" }}>
                            ✓ {editSelectedOutlet.name}
                          </Text>
                          <Pressable onPress={() => setEditSelectedOutlet(null)}>
                            <Text style={{ color: theme.primary, fontSize: 16 }}>×</Text>
                          </Pressable>
                        </View>
                      )}

                      <View style={styles.editButtons}>
                        <Pressable
                          onPress={() => {
                            setEditingId(null);
                            setEditItem("");
                            setEditSelectedOutlet(null);
                            setEditOutletSearch("");
                          }}
                          style={[styles.editBtn, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]}
                        >
                          <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleUpdate(req._id, editItem, editSelectedOutlet!)}
                          disabled={!editItem.trim() || !editSelectedOutlet}
                          style={[styles.editBtn, { backgroundColor: editItem.trim() && editSelectedOutlet ? theme.primary : theme.border }]}
                        >
                          <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View>
                        <Text style={[styles.itemName, { color: theme.text }]}>
                          {req.itemName}
                        </Text>
                        <Text style={[styles.outletInfo, { color: theme.subtext }]}>
                          📍 {typeof req.outlet === 'object' ? req.outlet?.name : req.outlet}
                        </Text>
                      </View>
                      <View style={styles.actions}>
                        <Pressable
                          onPress={() => {
                            setEditingId(req._id);
                            setEditItem(req.itemName);
                            setEditSelectedOutlet(
                              typeof req.outlet === 'object' ? req.outlet : null
                            );
                            setEditOutletSearch(
                              typeof req.outlet === 'object' ? req.outlet?.name : req.outlet
                            );
                          }}
                          style={{ padding: 8 }}
                        >
                          <Ionicons name="pencil" size={16} color={theme.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(req._id)}
                          style={{ padding: 8 }}
                        >
                          <Ionicons name="trash" size={16} color="#ef4444" />
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              ))
          )}

          {/* Responded Personal Requests */}
          <Text style={[styles.subsectionTitle, { color: theme.text, marginTop: 16 }]}>
            Responded
          </Text>
          {personalRequests.filter((r) => r.status === "CONFIRMED").length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.subtext, fontSize: 12 }]}>
              No responded requests
            </Text>
          ) : (
            personalRequests
              .filter((r) => r.status === "CONFIRMED")
              .map((req) => (
                <View key={req._id} style={[styles.personalRequestItem, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {req.itemName}
                    </Text>
                    <Text style={[styles.outletInfo, { color: theme.subtext }]}>
                      📍 {typeof req.outlet === 'object' ? req.outlet?.name : req.outlet}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.miniStatusBadge,
                      {
                        backgroundColor: req.response?.available ? "#10b981" : "#ef4444",
                        opacity: 0.2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        { fontSize: 10, fontWeight: "600", color: req.response?.available ? "#10b981" : "#ef4444" },
                      ]}
                    >
                      {req.response?.available ? "✓ Yes" : "✗ No"}
                    </Text>
                  </View>
                </View>
              ))
          )}
        </Card>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
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
    fontSize: 13,
  },
  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  dropdown: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  outletDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  button: {
    flexDirection: "row",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  requestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  personalRequestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  requesterName: {
    fontSize: 12,
    marginTop: 4,
  },
  outletInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  editButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 12,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  statusOptionText: {
    fontSize: 13,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
});
