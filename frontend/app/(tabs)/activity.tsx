import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  acceptedBy: string | { _id: string; name: string; phone?: string };
  createdAt: string;
}

export default function ActivityScreen() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<"requests" | "deliveries">("requests");
  const [allRequests, setAllRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
  const [rating, setRating] = useState("5");
  const [feedback, setFeedback] = useState("");
  const [ratingType, setRatingType] = useState<"requester" | "deliverer" | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const ownRequests = await requests.getAll("own");
      const inProgressRequests = await requests.getAll("inprogress");
      const completedRequests = await requests.getAll("completed");
      
      // Combine all requests
      setAllRequests([...ownRequests, ...inProgressRequests, ...completedRequests]);
    } catch (error) {
      Alert.alert("Error", "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const handleSubmitRating = async () => {
    if (!selectedRequest || !ratingType) return;

    try {
      await requests.rate(selectedRequest._id, Number(rating), feedback);
      Alert.alert("Success", "Rating submitted! ✅");
      setRatingModalVisible(false);
      setRating("5");
      setFeedback("");
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to submit rating");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Activity" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // REQUESTS MODE
  if (mode === "requests") {
    const pendingRequests = allRequests.filter((r) => r.status === "OPEN" && r.requestedBy);
    const completedRequests = allRequests.filter((r) => r.status === "COMPLETED" && r.requestedBy);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="My Requests" />
        
        {/* MODE TABS */}
        <View style={[styles.modeTabsContainer, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
          <Pressable
            onPress={() => setMode("requests")}
            style={[styles.modeTab, { borderBottomColor: mode === "requests" ? theme.primary : "transparent" }]}
          >
            <Ionicons name="document-text" size={18} color={mode === "requests" ? theme.primary : theme.subtext} />
            <Text style={[styles.modeTabText, { color: mode === "requests" ? theme.primary : theme.subtext, fontWeight: mode === "requests" ? "600" : "400" }]}>
              Requests
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("deliveries")}
            style={[styles.modeTab, { borderBottomColor: mode === "deliveries" ? theme.primary : "transparent" }]}
          >
            <Ionicons name="car" size={18} color={mode === "deliveries" ? theme.primary : theme.subtext} />
            <Text style={[styles.modeTabText, { color: mode === "deliveries" ? theme.primary : theme.subtext, fontWeight: mode === "deliveries" ? "600" : "400" }]}>
              Deliveries
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
          {/* PENDING REQUESTS SECTION */}
          <Card>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Pending Requests ({pendingRequests.length})
            </Text>
            {pendingRequests.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                No pending requests
              </Text>
            ) : (
              pendingRequests.map((req) => (
                <View key={req._id} style={[styles.requestCard, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {req.itemDescription}
                    </Text>
                    <Text style={[styles.details, { color: theme.subtext }]}>
                      {typeof req.outlet === 'object' ? req.outlet?.name : req.outlet} → {req.hostel}
                    </Text>
                    <Text style={[styles.fee, { color: theme.primary, marginTop: 6 }]}>
                      ₹{req.fee}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: "#fbbf2420" }]}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: "#f59e0b" }}>
                      ⏳ Open
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>

          {/* COMPLETED REQUESTS SECTION */}
          <Card>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Completed Requests ({completedRequests.length})
            </Text>
            {completedRequests.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                No completed requests
              </Text>
            ) : (
              completedRequests.map((req) => (
                <View key={req._id} style={[styles.requestCard, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {req.itemDescription}
                    </Text>
                    <Text style={[styles.details, { color: theme.subtext }]}>
                      {typeof req.outlet === 'object' ? req.outlet?.name : req.outlet} → {req.hostel}
                    </Text>
                    <Text style={[styles.fee, { color: theme.primary, marginTop: 6 }]}>
                      ₹{req.fee}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: "#d1fae520" }]}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: "#10b981" }}>
                      ✓ Done
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

  // DELIVERIES MODE
  else {
    const ongoingDeliveries = allRequests.filter((r) => r.status === "IN_PROGRESS" && r.acceptedBy);
    const completedDeliveries = allRequests.filter((r) => r.status === "COMPLETED" && r.acceptedBy);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="My Deliveries" />
        
        {/* MODE TABS */}
        <View style={[styles.modeTabsContainer, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
          <Pressable
            onPress={() => setMode("requests")}
            style={[styles.modeTab, { borderBottomColor: mode === "requests" ? theme.primary : "transparent" }]}
          >
            <Ionicons name="document-text" size={18} color={mode === "requests" ? theme.primary : theme.subtext} />
            <Text style={[styles.modeTabText, { color: mode === "requests" ? theme.primary : theme.subtext, fontWeight: mode === "requests" ? "600" : "400" }]}>
              Requests
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("deliveries")}
            style={[styles.modeTab, { borderBottomColor: mode === "deliveries" ? theme.primary : "transparent" }]}
          >
            <Ionicons name="car" size={18} color={mode === "deliveries" ? theme.primary : theme.subtext} />
            <Text style={[styles.modeTabText, { color: mode === "deliveries" ? theme.primary : theme.subtext, fontWeight: mode === "deliveries" ? "600" : "400" }]}>
              Deliveries
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
          {/* ONGOING DELIVERIES SECTION */}
          <Card>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Ongoing Deliveries ({ongoingDeliveries.length})
            </Text>
            {ongoingDeliveries.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                No ongoing deliveries
              </Text>
            ) : (
              ongoingDeliveries.map((req) => (
                <View key={req._id} style={[styles.requestCard, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {req.itemDescription}
                    </Text>
                    <Text style={[styles.details, { color: theme.subtext }]}>
                      {typeof req.outlet === 'object' ? req.outlet?.name : req.outlet} → {req.hostel}
                    </Text>
                    <Text style={[styles.fee, { color: theme.primary, marginTop: 6 }]}>
                      ₹{req.fee}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: "#bfdbfe20" }]}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: "#3b82f6" }}>
                      ↗ Ongoing
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>

          {/* COMPLETED DELIVERIES SECTION */}
          <Card>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Completed Deliveries ({completedDeliveries.length})
            </Text>
            {completedDeliveries.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                No completed deliveries
              </Text>
            ) : (
              completedDeliveries.map((req) => (
                <View key={req._id} style={[styles.requestCard, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {req.itemDescription}
                    </Text>
                    <Text style={[styles.details, { color: theme.subtext }]}>
                      {typeof req.outlet === 'object' ? req.outlet?.name : req.outlet} → {req.hostel}
                    </Text>
                    <Text style={[styles.fee, { color: theme.primary, marginTop: 6 }]}>
                      ₹{req.fee}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: "#d1fae520" }]}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: "#10b981" }}>
                      ✓ Done
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
  modeTabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  modeTabText: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  requestCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    marginBottom: 0,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  details: {
    fontSize: 12,
    marginTop: 4,
  },
  fee: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 13,
  },
  ratingText: {
    fontSize: 12,
    marginTop: 4,
  },
  ratingButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  ratingBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
});
