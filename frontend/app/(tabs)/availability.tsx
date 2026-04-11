import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState, useEffect } from "react";
import { availability, outlets } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";


interface AvailabilityRequest {
  _id: string;
  itemName: string;
  outlet: string;
  requestedBy: string;
  status: string;
  createdAt: string;
}

interface Outlet {
  _id: string;
  name: string;
  locationDescription: string;
}

export default function AvailabilityScreen() {
  const { theme, mode } = useTheme();

  const [item, setItem] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [outletSearch, setOutletSearch] = useState("");
  const [availabilityList, setAvailabilityList] = useState<AvailabilityRequest[]>([]);
  const [outletsList, setOutletsList] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState("");
  const [editSelectedOutlet, setEditSelectedOutlet] = useState<Outlet | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [availData, outletData] = await Promise.all([
        availability.getOwn(),
        outlets.getAll(),
      ]);
      setAvailabilityList(availData);
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

  const filteredOutlets = outletsList.filter((o) =>
    o.name.toLowerCase().includes(outletSearch.toLowerCase())
  );

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

  const handleUpdate = async (id: string) => {
    if (!editItem.trim() || !editSelectedOutlet) {
      Alert.alert("Validation", "Please enter item and outlet");
      return;
    }

    try {
      await availability.update(id, editItem, editSelectedOutlet._id);
      Alert.alert("Success", "Updated! ✅");
      setEditingId(null);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to update");
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

  if (mode === "OUTLET") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="My Details" />
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
          <Card>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              When are you available?  
            </Text>
            <Text style={[styles.description, { color: theme.subtext }]}>
              Students will check availability and you respond from Pending tab
            </Text>
            <View style={[styles.infoBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="information-circle" size={20} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                Pending check requests will appear in the "Pending" tab
              </Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // STUDENT MODE
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Check Availability" />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {/* CREATE SECTION */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Request Availability
          </Text>

          {/* ITEM INPUT */}
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

          {/* OUTLET SELECTOR */}
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

          {/* CREATE BUTTON */}
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

        {/* MY REQUESTS SECTION */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Your Requests
          </Text>
          {availabilityList.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              No requests yet. Create one above!
            </Text>
          ) : (
            availabilityList.map((req) => (
              <View key={req._id} style={[styles.requestItem, { borderBottomColor: theme.border }]}>
                {editingId === req._id ? (
                  // EDIT MODE
                  <>
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
                    <View style={styles.editButtons}>
                      <Pressable
                        onPress={() => setEditingId(null)}
                        style={[styles.editBtn, { backgroundColor: theme.bg }]}
                      >
                        <Text style={{ color: theme.text }}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleUpdate(req._id)}
                        style={[styles.editBtn, { backgroundColor: theme.primary }]}
                      >
                        <Text style={{ color: "#fff" }}>Save</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  // VIEW MODE
                  <>
                    <View>
                      <Text style={[styles.itemName, { color: theme.text }]}>
                        {req.itemName}
                      </Text>
                      <Text style={[styles.outletName, { color: theme.subtext }]}>
                        📍 {req.outlet}
                      </Text>
                      <Text style={[styles.status, { color: theme.subtext, fontSize: 11 }]}>
                        {req.status}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => {
                          setEditingId(req._id);
                          setEditItem(req.itemName);
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
  description: {
    fontSize: 12,
    marginBottom: 12,
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
  requestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  outletName: {
    fontSize: 12,
    marginTop: 2,
  },
  status: {
    marginTop: 4,
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
    paddingVertical: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
});
