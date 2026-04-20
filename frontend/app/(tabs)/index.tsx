import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
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
  const [filterOutlet, setFilterOutlet] = useState("ALL");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, []);

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
      console.error("Failed to load requests:", error);
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
      if (filterOutlet === "ALL") return true;
      const outletStr = typeof r.outlet === "object" ? r.outlet.name : r.outlet;
      if (filterOutlet === "Other") {
        // Filter for "Other" includes anything not ANC 1, ANC 2, or CP
        return !["ANC 1", "ANC 2", "CP"].includes(outletStr);
      }
      return outletStr === filterOutlet;
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "fee") return b.fee - a.fee;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Group by outlet - ANC 1, ANC 2, CP, Other
  const outlets_order = ["ANC 1", "ANC 2", "CP", "Other"];
  const groupedByOutlet: { [key: string]: DeliveryRequest[] } = {};
  
  outlets_order.forEach((outlet) => {
    groupedByOutlet[outlet] = sorted.filter((r: DeliveryRequest) => {
      const outletStr = typeof r.outlet === "object" ? r.outlet.name : r.outlet;
      if (outlet === "Other") {
        // Group anything that's not ANC 1, ANC 2, or CP under "Other"
        return !["ANC 1", "ANC 2", "CP"].includes(outletStr);
      }
      return outletStr === outlet;
    });
  });

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
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* SEARCH */}
        <Card>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search item, location, or outlet..."
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
        </Card>

        {/* OUTLET FILTER */}
        <Card>
          <Text style={[styles.label, { color: theme.text }]}>Outlet</Text>
          <View style={styles.row}>
            {["ALL", "ANC 1", "ANC 2", "CP", "Other"].map((outlet) => (
              <Pressable
                key={outlet}
                onPress={() => setFilterOutlet(outlet)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      filterOutlet === outlet ? theme.primary : theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: filterOutlet === outlet ? "#fff" : theme.text,
                    fontWeight: "600",
                    fontSize: 11,
                  }}
                >
                  {outlet}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
        {sorted.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              No delivery requests available
            </Text>
          </Card>
        ) : (
          outlets_order
            .filter((outlet) => groupedByOutlet[outlet].length > 0)
            .map((outlet) => {
              const outletReqs = groupedByOutlet[outlet];

              return (
                <View key={outlet}>
                  {/* OUTLET GROUP HEADER */}
                  <View style={[styles.outletHeader, { backgroundColor: theme.primary + "15" }]}>
                    <Text style={[styles.outletTitle, { color: theme.primary }]}>
                      🏪 {outlet}
                    </Text>
                    <Text style={[styles.outletCount, { color: theme.subtext }]}>
                      {outletReqs.length}
                    </Text>
                  </View>

                  {/* REQUESTS IN THIS OUTLET */}
                  {outletReqs.map((req) => {
                    const canAccept =
                      req.status === "OPEN" &&
                      userRole === "student" &&
                      (typeof req.requestedBy === "object"
                        ? req.requestedBy._id !== currentUserId
                        : req.requestedBy !== currentUserId);

                    return (
                      <Card key={req._id} style={styles.requestCard}>
                        {/* ITEM NAME */}
                        <Text style={[styles.itemName, { color: theme.text }]}>
                          {req.itemDescription}
                        </Text>

                        {/* FROM & TO */}
                        <View style={styles.routeContainer}>
                          <View style={styles.routeRow}>
                            <Text style={[styles.routeLabel, { color: theme.subtext }]}>From:</Text>
                            <Text style={[styles.routeValue, { color: theme.text }]}>
                              {typeof req.outlet === "object"
                                ? req.outlet?.name
                                : req.outlet}
                            </Text>
                          </View>
                          <View style={styles.routeRow}>
                            <Text style={[styles.routeLabel, { color: theme.subtext }]}>To:</Text>
                            <Text style={[styles.routeValue, { color: theme.text }]}>
                              {req.hostel}
                            </Text>
                          </View>
                        </View>

                        {/* FEE */}
                        <View style={[styles.feeBadgeRow, { backgroundColor: theme.primary + "15" }]}>
                          <Ionicons name="wallet" size={16} color={theme.primary} />
                          <Text style={[styles.feeText, { color: theme.primary }]}>₹{req.fee}</Text>
                        </View>

                        {/* ACTION BUTTON */}
                        {canAccept && (
                          <Pressable
                            onPress={() => handleAccept(req._id)}
                            style={[
                              styles.acceptButton,
                              { backgroundColor: theme.primary },
                            ]}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color="#fff"
                            />
                            <Text style={styles.acceptButtonText}>
                              Accept Delivery
                            </Text>
                          </Pressable>
                        )}

                        {!canAccept && (
                          <View style={[styles.ownRequestBadge, { backgroundColor: theme.primary + "10" }]}>
                            <Ionicons name="information-circle" size={16} color={theme.primary} />
                            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "600" }}>
                              Your request
                            </Text>
                          </View>
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
  outletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  hostelTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  outletTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  hostelCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  outletCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  requestCard: {
    paddingVertical: 14,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  routeContainer: {
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: "600",
    width: 50,
  },
  routeValue: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  feeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  feeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  acceptButton: {
    flexDirection: "row",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  ownRequestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: "center",
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
