import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requests } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";

interface DeliveryRequest {
  _id: string;
  itemDescription: string;
  outlet: string | { _id: string; name: string; locationDescription?: string };
  hostel: string;
  fee: number;
  status: string;
  requestedBy: string | { _id: string; name: string; phone?: string };
  acceptedBy?: string | { _id: string; name: string; phone?: string };
  createdAt: string;
}

export default function RequestsScreen() {
  const { theme, userRole } = useTheme();

  const [requestsList, setRequestsList] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "fee">("newest");
  const [filterHostel, setFilterHostel] = useState("ALL");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentUserId = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUserId(user._id);
        }
      } catch (error) {
        console.error("Failed to load user ID:", error);
      }
    };
    loadCurrentUserId();
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await requests.getAll("all");
      // Filter to only OPEN requests not created by current user
      const openRequests = data.filter(
        (r: DeliveryRequest) =>
          r.status === "OPEN" &&
          (typeof r.requestedBy === "object"
            ? r.requestedBy._id !== currentUserId
            : r.requestedBy !== currentUserId)
      );
      setRequestsList(openRequests);
    } catch (error) {
      Alert.alert("Error", "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const handleAccept = (id: string) => {
    Alert.alert("Accept Request", "Accept this delivery?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: async () => {
          try {
            await requests.accept(id);
            Alert.alert("Success", "Request accepted! ✅");
            loadRequests();
          } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to accept");
          }
        },
      },
    ]);
  };

  // Filter & sort
  const filtered = (requestsList || [])
    .filter((r: DeliveryRequest) => {
      const q = searchQuery.toLowerCase();
      const itemMatch = r.itemDescription.toLowerCase().includes(q);
      const hostelMatch = r.hostel.toLowerCase().includes(q);
      const outletMatch =
        typeof r.outlet === "object"
          ? r.outlet.name.toLowerCase().includes(q)
          : r.outlet.toLowerCase().includes(q);
      return itemMatch || hostelMatch || outletMatch;
    })
    .filter((r: DeliveryRequest) => {
      if (filterHostel === "ALL") return true;
      return r.hostel === filterHostel;
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "fee") return b.fee - a.fee;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Group by hostel
  const groupedByHostel = {
    "ANC 1": sorted.filter((r: DeliveryRequest) => r.hostel === "ANC 1"),
    "ANC 2": sorted.filter((r: DeliveryRequest) => r.hostel === "ANC 2"),
    CP: sorted.filter((r: DeliveryRequest) => r.hostel === "CP"),
    Other: sorted.filter((r: DeliveryRequest) => r.hostel === "Other"),
  };

  const hostelOrder = ["ANC 1", "ANC 2", "CP", "Other"];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Delivery Board" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Delivery Board" />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 120 }]}>
        {/* SEARCH */}
        <Card>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search item, hostel, or outlet..."
            placeholderTextColor={theme.subtext}
            style={[
              styles.input,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />
        </Card>

        {/* CONTROLS */}
        <Card>
          <Text style={[styles.label, { color: theme.text }]}>Sort</Text>
          <View style={styles.row}>
            {["newest", "fee"].map((type) => (
              <Pressable
                key={type}
                onPress={() => setSortBy(type as any)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      sortBy === type ? theme.primary : theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: sortBy === type ? "#fff" : theme.text,
                    fontWeight: "600",
                    fontSize: 11,
                  }}
                >
                  {type === "newest" ? "Newest" : "High Fee"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
            Hostel
          </Text>
          <View style={styles.row}>
            {["ALL", "ANC 1", "ANC 2", "CP", "Other"].map((hostel) => (
              <Pressable
                key={hostel}
                onPress={() => setFilterHostel(hostel)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      filterHostel === hostel ? theme.primary : theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: filterHostel === hostel ? "#fff" : theme.text,
                    fontWeight: "600",
                    fontSize: 11,
                  }}
                >
                  {hostel}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* GROUPED REQUESTS */}
        {sorted.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              No delivery requests available
            </Text>
          </Card>
        ) : (
          hostelOrder
            .filter(
              (hostel) =>
                filterHostel === "ALL" || filterHostel === hostel
            )
            .map((hostel) => {
              const hostelReqs = groupedByHostel[hostel as keyof typeof groupedByHostel];
              if (hostelReqs.length === 0) return null;

              return (
                <View key={hostel}>
                  {/* HOSTEL GROUP HEADER */}
                  <View style={[styles.hostelHeader, { backgroundColor: theme.primary + "15" }]}>
                    <Text style={[styles.hostelTitle, { color: theme.primary }]}>
                      📍 {hostel}
                    </Text>
                    <Text style={[styles.hostelCount, { color: theme.subtext }]}>
                      {hostelReqs.length}
                    </Text>
                  </View>

                  {/* REQUESTS IN THIS HOSTEL */}
                  {hostelReqs.map((req) => {
                    const canAccept =
                      req.status === "OPEN" &&
                      userRole === "student" &&
                      (typeof req.requestedBy === "object"
                        ? req.requestedBy._id !== currentUserId
                        : req.requestedBy !== currentUserId);

                    return (
                      <Card key={req._id}>
                        <View style={styles.header}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.item, { color: theme.text }]}>
                              {req.itemDescription}
                            </Text>
                            <Text style={[styles.details, { color: theme.subtext }]}>
                              {typeof req.outlet === "object"
                                ? req.outlet?.name
                                : req.outlet}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.feeBadge,
                              { backgroundColor: theme.primary + "20" },
                            ]}
                          >
                            <Text style={[styles.fee, { color: theme.primary }]}>
                              ₹{req.fee}
                            </Text>
                          </View>
                        </View>

                        {canAccept && (
                          <Pressable
                            onPress={() => handleAccept(req._id)}
                            style={[
                              styles.button,
                              { backgroundColor: theme.primary, marginTop: 12 },
                            ]}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color="#fff"
                            />
                            <Text
                              style={{
                                color: "#fff",
                                fontWeight: "600",
                                marginLeft: 8,
                              }}
                            >
                              Accept Delivery
                            </Text>
                          </Pressable>
                        )}

                        {!canAccept && (
                          <Text
                            style={[
                              styles.disabledText,
                              { color: theme.subtext, marginTop: 8 },
                            ]}
                          >
                            Your request
                          </Text>
                        )}
                      </Card>
                    );
                  })}
                </View>
              );
            })
        )}
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  hostelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  hostelTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  hostelCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  item: {
    fontSize: 14,
    fontWeight: "600",
  },
  details: {
    fontSize: 12,
    marginTop: 4,
  },
  feeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fee: {
    fontSize: 12,
    fontWeight: "700",
  },
  button: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 13,
  },
  disabledText: {
    fontSize: 12,
  },
});
