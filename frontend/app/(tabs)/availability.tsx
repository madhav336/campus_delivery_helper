import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
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
  const [refreshing, setRefreshing] = useState(false);
  const [allRequests, setAllRequests] = useState<AvailabilityRequest[]>([]);
  const [outletsList, setOutletsList] = useState<Outlet[]>([]);
  const [filterOutlet, setFilterOutlet] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Outlet owners get their outlet's requests; students get all public confirmed
      let availData;
      if (userRole === "outlet_owner") {
        availData = await availability.getPending();
      } else {
        availData = await availability.getAll();
      }
      setAllRequests(availData || []);
      
      // Load outlets
      try {
        const outletData = await outlets.getAll();
        setOutletsList(outletData || []);
      } catch (err) {
        console.warn("Failed to load outlets");
        setOutletsList([]);
      }
    } catch (error) {
      console.error("Load error:", error);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Filter requests - only CONFIRMED and non-expired
  const now = new Date();
  const filtered = allRequests
    .filter((req) => req.status === "CONFIRMED" && new Date(req.expiresAt) > now)
    .filter((req) => {
      if (filterOutlet) {
        const outletName = typeof req.outlet === "object" ? req.outlet.name : req.outlet;
        if (outletName !== filterOutlet) return false;
      }
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

  // ===== OUTLET OWNER VIEW =====
  if (userRole === "outlet_owner") {
    // Filter by status and exclude expired requests
    const now = new Date();
    const pendingRequests = allRequests.filter(
      (r) => r.status === "PENDING" && new Date(r.expiresAt) > now
    );
    const historyRequests = allRequests.filter(
      (r) => r.status === "CONFIRMED" && new Date(r.expiresAt) > now
    );

    const handleRespond = async (requestId: string, isAvailable: boolean) => {
      try {
        await availability.respond(requestId, isAvailable);
        Alert.alert(
          "Success",
          isAvailable ? "Marked as available!" : "Marked as unavailable!"
        );
        loadData();
      } catch (error) {
        console.error("Failed to respond to availability request:", error);
        Alert.alert("Error", "Failed to respond to request");
      }
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Availability Requests" />
        <ScrollView 
          contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {/* PENDING REQUESTS SECTION */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Pending Requests ({pendingRequests.length})
          </Text>
          {pendingRequests.length === 0 ? (
            <Card>
              <Text style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}>
                No pending requests
              </Text>
            </Card>
          ) : (
            pendingRequests.map((req) => (
              <Card key={req._id}>
                <View style={styles.requestHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{req.itemName}</Text>
                    <Text style={[styles.requesterName, { color: theme.subtext }]}>
                      from {typeof req.requestedBy === "object" ? req.requestedBy?.name : "Student"}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: "#f59e0b20" }]}>
                    <Text style={[styles.statusText, { color: "#f59e0b" }]}>⏳ Pending</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                  <Pressable
                    onPress={() => handleRespond(req._id, true)}
                    style={[styles.respondButton, { backgroundColor: "#10b98180", flex: 1 }]}
                  >
                    <Text style={[styles.respondButtonText, { color: "#10b981" }]}>✓ Available</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRespond(req._id, false)}
                    style={[styles.respondButton, { backgroundColor: "#ef444480", flex: 1 }]}
                  >
                    <Text style={[styles.respondButtonText, { color: "#ef4444" }]}>✗ Unavailable</Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )}

          {/* HISTORY SECTION */}
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
            History ({historyRequests.length})
          </Text>
          {historyRequests.length === 0 ? (
            <Card>
              <Text style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}>
                No responded requests yet
              </Text>
            </Card>
          ) : (
            historyRequests.map((req) => (
              <Card key={req._id}>
                <View style={styles.requestHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{req.itemName}</Text>
                    <Text style={[styles.requesterName, { color: theme.subtext }]}>
                      from {typeof req.requestedBy === "object" ? req.requestedBy?.name : "Student"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: req.response?.available ? "#10b98120" : "#ef444420" },
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
                <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                  <Pressable
                    onPress={() => handleRespond(req._id, true)}
                    style={[styles.respondButton, { backgroundColor: "#10b98180", flex: 1 }]}
                  >
                    <Text style={[styles.respondButtonText, { color: "#10b981" }]}>✓ Available</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRespond(req._id, false)}
                    style={[styles.respondButton, { backgroundColor: "#ef444480", flex: 1 }]}
                  >
                    <Text style={[styles.respondButtonText, { color: "#ef4444" }]}>✗ Unavailable</Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== STUDENT VIEW: Only CONFIRMED =====
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Availability Board" />
      <ScrollView 
        contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* FILTERS */}
        <Card>
          <Text style={[styles.label, { color: theme.text }]}>Filter by Outlet</Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => setFilterOutlet(null)}
              style={[
                styles.chip,
                {
                  backgroundColor: filterOutlet === null ? theme.primary : theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={{
                  color: filterOutlet === null ? "#fff" : theme.text,
                  fontWeight: "600",
                  fontSize: 11,
                }}
              >
                All Outlets
              </Text>
            </Pressable>
            {outletsList.map((outlet) => (
              <Pressable
                key={outlet._id}
                onPress={() => setFilterOutlet(filterOutlet === outlet.name ? null : outlet.name)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: filterOutlet === outlet.name ? theme.primary : theme.card,
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

        {/* ANSWERED CHECKS ONLY */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 12 }]}>
          Answered Availability Checks
        </Text>
        {filtered.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}>
              No answered availability checks
            </Text>
          </Card>
        ) : (
          filtered.map((req) => (
            <Card key={req._id}>
              <View style={styles.requestHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: theme.text }]}>{req.itemName}</Text>
                  <Text style={[styles.requesterName, { color: theme.subtext }]}>
                    from {typeof req.requestedBy === "object" ? req.requestedBy?.name : "Student"}
                  </Text>
                  <Text style={[styles.outletInfo, { color: theme.subtext, marginTop: 4 }]}>
                    📍 {typeof req.outlet === "object" ? req.outlet?.name : req.outlet}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: req.response?.available ? "#10b98120" : "#ef444420" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: req.response?.available ? "#10b981" : "#ef4444" },
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
  container: { padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  requestHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  itemName: { fontSize: 14, fontWeight: "600" },
  requesterName: { fontSize: 12, marginTop: 4 },
  outletInfo: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  respondButton: { paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  respondButtonText: { fontSize: 12, fontWeight: "600" },
  emptyText: { paddingVertical: 20, fontSize: 13 },
  modeSelector: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ccc" },
  modeTab: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", borderBottomWidth: 3 },
  modeTabText: { fontSize: 13 },
});
