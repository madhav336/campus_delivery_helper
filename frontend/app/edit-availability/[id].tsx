import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { availability, outlets } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/ui/Card";
import TopBar from "@/components/ui/TopBar";
import { Ionicons } from "@expo/vector-icons";

export default function EditAvailabilityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();

  const id = params.id as string;

  const [itemName, setItemName] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [outletsList, setOutletsList] = useState<any[]>([]);
  const [outletSearch, setOutletSearch] = useState("");
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOutlets = async () => {
      try {
        const data = await outlets.getAll();
        setOutletsList(data || []);
      } catch (error) {
        console.warn("Failed to load outlets:", error);
      }
    };
    loadOutlets();

    // Initialize form from params
    if (id && params.itemName) {
      setItemName(params.itemName as string);
      setOutletSearch((params.outletName as string) || "");
      // Try to find matching outlet
      if (params.outletId) {
        const outletsList = params.outletsList ? JSON.parse(params.outletsList as string) : [];
        const outlet = outletsList.find((o: any) => o._id === params.outletId);
        if (outlet) {
          setSelectedOutlet(outlet);
        }
      }
    }
  }, [id]);

  const filteredOutlets = outletsList.filter((o) =>
    o.name.toLowerCase().includes(outletSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert("Validation", "Please enter item name");
      return;
    }
    if (!selectedOutlet) {
      Alert.alert("Validation", "Please select an outlet");
      return;
    }

    try {
      setLoading(true);
      await availability.update(id, itemName, selectedOutlet._id);
      Alert.alert("Success", "Availability check updated! ✅");
      router.back();
    } catch (error) {
      console.error("Failed to update availability check:", error);
      Alert.alert("Error", "Failed to update availability check");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TopBar title="Edit Availability Check" />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <View style={{ padding: 16 }}>
              <Card>
                {/* ITEM NAME */}
                <Text style={[styles.label, { color: theme.text }]}>Item Name</Text>
                <TextInput
                  placeholder="What are you checking availability for?"
                  placeholderTextColor={theme.subtext}
                  value={itemName}
                  onChangeText={setItemName}
                  editable={!loading}
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg },
                  ]}
                />

                {/* OUTLET SELECTION */}
                <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Outlet</Text>
                <TextInput
                  value={outletSearch}
                  onChangeText={(text) => {
                    setOutletSearch(text);
                    setShowOutletDropdown(true);
                  }}
                  onFocus={() => setShowOutletDropdown(true)}
                  placeholder="Search outlets..."
                  placeholderTextColor={theme.subtext}
                  editable={!loading}
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg },
                  ]}
                />

                {selectedOutlet && (
                  <View style={[styles.selectedPill, { backgroundColor: theme.primary + "20" }]}>
                    <Text style={{ color: theme.primary, fontWeight: "600" }}>
                      ✓ {selectedOutlet.name}
                    </Text>
                    <Pressable onPress={() => {
                      setSelectedOutlet(null);
                      setOutletSearch("");
                      setShowOutletDropdown(true);
                    }} disabled={loading}>
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
                        disabled={loading}
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

                {/* BUTTONS */}
                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={() => router.back()}
                    disabled={loading}
                    style={[
                      styles.button,
                      { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border },
                    ]}
                  >
                    <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSave}
                    disabled={loading || !itemName || !selectedOutlet}
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          loading || !itemName || !selectedOutlet ? theme.border : theme.primary,
                      },
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "700",
                            marginLeft: 8,
                          }}
                        >
                          Update
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </Card>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
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
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    marginVertical: 8,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  outletDesc: {
    fontSize: 11,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
});
