import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { requests, availability, outlets } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/ui/Card";
import TopBar from "@/components/ui/TopBar";
import { Ionicons } from "@expo/vector-icons";

interface Outlet {
  _id: string;
  name: string;
  locationDescription: string;
}

export default function CreateScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  // Mode selection
  const [mode, setMode] = useState<"delivery" | "availability">("delivery");

  // Shared states
  const [outletsList, setOutletsList] = useState<Outlet[]>([]);
  const [loadingOutlets, setLoadingOutlets] = useState(true);

  // DELIVERY mode states (simple text outlets, no DB)
  const [deliveryItem, setDeliveryItem] = useState("");
  const [deliveryOutlet, setDeliveryOutlet] = useState<string>("");
  const [deliveryCustomOutlet, setDeliveryCustomOutlet] = useState("");
  const [hostel, setHostel] = useState("");
  const [fee, setFee] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  // AVAILABILITY mode states (uses DB outlets)
  const [availabilityItem, setAvailabilityItem] = useState("");
  const [availabilityOutlet, setAvailabilityOutlet] = useState<Outlet | null>(null);
  const [availOutletSearch, setAvailOutletSearch] = useState("");
  const [showAvailOutletDropdown, setShowAvailOutletDropdown] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const loadOutlets = useCallback(async () => {
    try {
      setLoadingOutlets(true);
      const data = await outlets.getAll();
      setOutletsList(data);
    } catch (error) {
      // Silently fail - outlets are only needed for availability mode
      setOutletsList([]);
    } finally {
      setLoadingOutlets(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOutlets();
    }, [loadOutlets])
  );

  const filteredAvailOutlets = (outletsList || []).filter((o) =>
    o.name.toLowerCase().includes(availOutletSearch.toLowerCase())
  );

  // ===== DELIVERY CREATE (Simple Text Outlets) =====
  const finalDeliveryOutlet =
    deliveryOutlet === "Other" ? deliveryCustomOutlet : deliveryOutlet;
  const deliveryValid =
    deliveryItem && finalDeliveryOutlet && hostel && Number(fee) > 0;

  const handleDeliverySubmit = async () => {
    if (!deliveryValid) {
      Alert.alert("Validation", "Please fill all delivery fields");
      return;
    }

    try {
      setDeliveryLoading(true);
      await requests.create(
        deliveryItem,
        finalDeliveryOutlet,
        hostel,
        Number(fee)
      );

      Alert.alert("Success", "Delivery request created! ✅");
      setDeliveryItem("");
      setDeliveryOutlet("");
      setDeliveryCustomOutlet("");
      setHostel("");
      setFee("");

      router.push("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create delivery request");
    } finally {
      setDeliveryLoading(false);
    }
  };

  // ===== AVAILABILITY CREATE =====
  const availabilityValid = availabilityItem && availabilityOutlet;

  const handleAvailabilitySubmit = async () => {
    if (!availabilityValid) {
      Alert.alert("Validation", "Please fill all availability fields");
      return;
    }

    try {
      setAvailabilityLoading(true);
      await availability.create(availabilityItem, availabilityOutlet._id);

      Alert.alert("Success", "Availability request created! ✅");
      setAvailabilityItem("");
      setAvailabilityOutlet(null);
      setAvailOutletSearch("");
      setShowAvailOutletDropdown(false);

      router.push("/(tabs)/activity");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to create availability request"
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  if (loadingOutlets) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Create Request" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TopBar title="Create Request" />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* MODE SELECTOR */}
            <View style={[styles.container, { paddingTop: 0 }]}>
              <View style={styles.modeSelector}>
                <Pressable
                  onPress={() => setMode("delivery")}
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor:
                        mode === "delivery" ? theme.primary : theme.card,
                      borderBottomColor:
                        mode === "delivery" ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="cube"
                    size={20}
                    color={mode === "delivery" ? "#fff" : theme.text}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      {
                        color:
                          mode === "delivery" ? "#fff" : theme.text,
                      },
                    ]}
                  >
                    Delivery
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode("availability")}
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor:
                        mode === "availability" ? theme.primary : theme.card,
                      borderBottomColor:
                        mode === "availability" ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="search"
                    size={20}
                    color={mode === "availability" ? "#fff" : theme.text}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      {
                        color:
                          mode === "availability" ? "#fff" : theme.text,
                      },
                    ]}
                  >
                    Availability
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* DELIVERY MODE */}
            {mode === "delivery" && (
              <View style={styles.container}>
                <Card>
                  {/* ITEM */}
                  <Text style={[styles.label, { color: theme.text }]}>
                    Item Description
                  </Text>
                  <TextInput
                    placeholder="What do you need?"
                    placeholderTextColor={theme.subtext}
                    value={deliveryItem}
                    onChangeText={setDeliveryItem}
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.bg,
                      },
                    ]}
                  />

                  {/* OUTLET SELECTION (ANC 1, ANC 2, CP, Other) */}
                  <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                    Outlet
                  </Text>
                  <View style={styles.row}>
                    {["ANC 1", "ANC 2", "CP", "Other"].map((o) => (
                      <Pressable
                        key={o}
                        onPress={() => {
                          setDeliveryOutlet(o);
                          if (o !== "Other") {
                            setDeliveryCustomOutlet("");
                          }
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              deliveryOutlet === o ? theme.primary : theme.card,
                            borderColor: theme.border,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: deliveryOutlet === o ? "#fff" : theme.text,
                            fontWeight: "600",
                            fontSize: 12,
                          }}
                        >
                          {o}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* CUSTOM OUTLET NAME (if Other selected) */}
                  {deliveryOutlet === "Other" && (
                    <>
                      <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                        Outlet Name
                      </Text>
                      <TextInput
                        placeholder="Enter outlet name (e.g., Hotel, Mess, Cafe)"
                        placeholderTextColor={theme.subtext}
                        value={deliveryCustomOutlet}
                        onChangeText={setDeliveryCustomOutlet}
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

                  {/* DELIVERY LOCATION */}
                  <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                    Delivery Location
                  </Text>
                  <TextInput
                    placeholder="Enter delivery location"
                    placeholderTextColor={theme.subtext}
                    value={hostel}
                    onChangeText={setHostel}
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.text,
                        backgroundColor: theme.card,
                      },
                    ]}
                  />

                  {/* FEE */}
                  <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                    Delivery Fee (₹)
                  </Text>
                  <TextInput
                    placeholder="How much will you pay?"
                    placeholderTextColor={theme.subtext}
                    value={fee}
                    onChangeText={setFee}
                    keyboardType="numeric"
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.bg,
                      },
                    ]}
                  />

                  {/* SUBMIT BUTTON */}
                  <Pressable
                    onPress={handleDeliverySubmit}
                    disabled={!deliveryValid || deliveryLoading}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor:
                          deliveryValid && !deliveryLoading
                            ? theme.primary
                            : theme.border,
                        opacity: deliveryValid && !deliveryLoading ? 1 : 0.5,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                        marginLeft: 8,
                      }}
                    >
                      {deliveryLoading ? "Creating..." : "Create Delivery"}
                    </Text>
                  </Pressable>
                </Card>
              </View>
            )}

            {/* AVAILABILITY MODE */}
            {mode === "availability" && (
              <View style={styles.container}>
                <Card>
                  {/* ITEM */}
                  <Text style={[styles.label, { color: theme.text }]}>
                    Item Name
                  </Text>
                  <TextInput
                    placeholder="What are you checking availability for?"
                    placeholderTextColor={theme.subtext}
                    value={availabilityItem}
                    onChangeText={setAvailabilityItem}
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.bg,
                      },
                    ]}
                  />

                  {/* OUTLET SELECTION */}
                  <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
                    Outlet
                  </Text>
                  <TextInput
                    value={availOutletSearch}
                    onChangeText={(text) => {
                      setAvailOutletSearch(text);
                      setShowAvailOutletDropdown(true);
                    }}
                    onFocus={() => setShowAvailOutletDropdown(true)}
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

                  {availabilityOutlet && (
                    <View style={[styles.selectedPill, { backgroundColor: theme.primary + "20" }]}>
                      <Text style={{ color: theme.primary, fontWeight: "600" }}>
                        ✓ {availabilityOutlet.name}
                      </Text>
                      <Pressable onPress={() => setAvailabilityOutlet(null)}>
                        <Text style={{ color: theme.primary, fontSize: 16 }}>×</Text>
                      </Pressable>
                    </View>
                  )}

                  {showAvailOutletDropdown && filteredAvailOutlets.length > 0 && (
                    <ScrollView
                      style={[
                        styles.dropdown,
                        { backgroundColor: theme.bg, borderColor: theme.border },
                      ]}
                      scrollEnabled={filteredAvailOutlets.length > 4}
                      nestedScrollEnabled
                    >
                      {filteredAvailOutlets.map((o) => (
                        <Pressable
                          key={o._id}
                          onPress={() => {
                            setAvailabilityOutlet(o);
                            setAvailOutletSearch(o.name);
                            setShowAvailOutletDropdown(false);
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

                  {/* SUBMIT BUTTON */}
                  <Pressable
                    onPress={handleAvailabilitySubmit}
                    disabled={!availabilityValid || availabilityLoading}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor:
                          availabilityValid && !availabilityLoading
                            ? theme.primary
                            : theme.border,
                        opacity: availabilityValid && !availabilityLoading ? 1 : 0.5,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                        marginLeft: 8,
                      }}
                    >
                      {availabilityLoading ? "Creating..." : "Check Availability"}
                    </Text>
                  </Pressable>
                </Card>
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  modeSelector: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    paddingHorizontal: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 3,
    gap: 8,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
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
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 0.45,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
});
