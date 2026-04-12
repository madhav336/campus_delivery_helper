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

  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState<AvailabilityRequest[]>([]);
  const [outletsList, setOutletsList] = useState<Outlet[]>([]);
  const [filterOutlet, setFilterOutlet] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "responded">(
    "all"
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [availData, outletData] = await Promise.all([
        availability.getAll(),
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Filter requests
  let filtered = allRequests.filter((req) => {
    if (filterOutlet) {
      const outletName =
        typeof req.outlet === "object" ? req.outlet.name : req.outlet;
      if (outletName !== filterOutlet) return false;
    }

    if (filterStatus === "pending" && req.status !== "PENDING") return false;
    if (filterStatus === "responded" && req.status !== "CONFIRMED") return false;

    return true;
  });

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Availability Board" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ===== OUTLET OWNER VIEW: HISTORY =====
  if (userRole === "outlet_owner") {
    const respondedRequests = allRequests.filter((r) => r.status === "CONFIRMED");

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Availability History" />
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
          {respondedRequests.length === 0 ? (
            <Card>
              <Text
                style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}
              >
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
                      from{" "}
                      {typeof req.requestedBy === "object"
                        ? req.requestedBy?.name
                        : "Student"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: req.response?.available
                          ? "#10b98120"
                          : "#ef444420",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: req.response?.available
                            ? "#10b981"
                            : "#ef4444",
                        },
                      ]}
                    >
                      {req.response?.available ? "✓ Available" : "✗ Not Available"}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== STUDENT VIEW: PUBLIC BOARD =====
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Availability Board" />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {/* FILTERS */}
        <Card>
          <Text style={[styles.label, { color: theme.text }]}>Filter by Status</Text>
          <View style={styles.row}>
            {["all", "pending", "responded"].map((status) => (
              <Pressable
                key={status}
                onPress={() => setFilterStatus(status as any)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      filterStatus === status ? theme.primary : theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: filterStatus === status ? "#fff" : theme.text,
                    fontWeight: "600",
                    fontSize: 11,
                  }}
                >
                  {status === "all"
                    ? "All"
                    : status === "pending"
                    ? "Pending"
                    : "Responded"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
            Filter by Outlet
          </Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => setFilterOutlet(null)}
              style={[
                styles.chip,
                {
                  backgroundColor: !filterOutlet ? theme.primary : theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={{
                  color: !filterOutlet ? "#fff" : theme.text,
                  fontWeight: "600",
                  fontSize: 11,
                }}
              >
                All Outlets
              </Text>
            </Pressable>
            {outletsList.slice(0, 4).map((outlet) => (
              <Pressable
                key={outlet._id}
                onPress={() =>
                  setFilterOutlet(filterOutlet === outlet.name ? null : outlet.name)
                }
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      filterOutlet === outlet.name ? theme.primary : theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: filterOutlet === outlet.name ? "#fff" : theme.text,
                    fontWeight: "600",
                    fontSize: 10,
                  }}
                >
                  {outlet.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* PENDING REQUESTS */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 12 }]}>
          Pending Checks
        </Text>
        {filtered.filter((r) => r.status === "PENDING").length === 0 ? (
          <Card>
            <Text
              style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}
            >
              No pending availability checks
            </Text>
          </Card>
        ) : (
          filtered
            .filter((r) => r.status === "PENDING")
            .map((req) => (
              <Card key={req._id}>
                <View>
                  <Text style={[styles.itemName, { color: theme.text }]}>
                    {req.itemName}
                  </Text>
                  <Text style={[styles.requesterName, { color: theme.subtext }]}>
                    from{" "}
                    {typeof req.requestedBy === "object"
                      ? req.requestedBy?.name
                      : "Student"}
                  </Text>
                  <Text style={[styles.outletInfo, { color: theme.subtext, marginTop: 4 }]}>
                    📍{" "}
                    {typeof req.outlet === "object"
                      ? req.outlet?.name
                      : req.outlet}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: theme.primary + "20", marginTop: 12 },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: theme.primary }]}
                  >
                    ⏳ Awaiting Response
                  </Text>
                </View>
              </Card>
            ))
        )}

        {/* RESPONDED REQUESTS */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
          Answered Checks
        </Text>
        {filtered.filter((r) => r.status === "CONFIRMED").length === 0 ? (
          <Card>
            <Text
              style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}
            >
              No answered checks yet
            </Text>
          </Card>
        ) : (
          filtered
            .filter((r) => r.status === "CONFIRMED")
            .map((req) => (
              <Card key={req._id}>
                <View style={styles.requestHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {req.itemName}
                    </Text>
                    <Text style={[styles.requesterName, { color: theme.subtext }]}>
                      from{" "}
                      {typeof req.requestedBy === "object"
                        ? req.requestedBy?.name
                        : "Student"}
                    </Text>
                    <Text
                      style={[styles.outletInfo, { color: theme.subtext, marginTop: 4 }]}
                    >
                      📍{" "}
                      {typeof req.outlet === "object"
                        ? req.outlet?.name
                        : req.outlet}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: req.response?.available
                          ? "#10b98120"
                          : "#ef444420",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: req.response?.available
                            ? "#10b981"
                            : "#ef4444",
                        },
                      ]}
                    >
                      {req.response?.available ? "✓ Yes" : "✗ No"}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
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
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
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
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    paddingVertical: 20,
    fontSize: 13,
  },
});
