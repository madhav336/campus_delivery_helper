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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requests, availability } from "@/services/api";
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
  completedAt?: string;
  delivererRating?: { rating?: number; feedback?: string };
  requesterRating?: { rating?: number; feedback?: string };
}

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

export default function ActivityScreen() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<"deliveries" | "requests" | "availability">(
    "deliveries"
  );
  const [allDeliveries, setAllDeliveries] = useState<DeliveryRequest[]>([]);
  const [allAvailabilities, setAllAvailabilities] = useState<AvailabilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Edit/Delete states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState("");
  const [editOutlet, setEditOutlet] = useState("");

  // Rating modal
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
  const [rating, setRating] = useState("5");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const loadUserId = async () => {
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
    loadUserId();
  }, []);

  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const [ownRequests, ownAvailability] = await Promise.all([
        requests.getAll("own"),
        availability.getOwn(),
      ]);
      setAllDeliveries(ownRequests);
      setAllAvailabilities(ownAvailability);
    } catch (error) {
      Alert.alert("Error", "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteDelivery = (id: string) => {
    Alert.alert("Delete Request", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await requests.delete(id);
            Alert.alert("Success", "Deleted! ✅");
            loadData();
          } catch (error) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  const handleDeleteAvailability = (id: string) => {
    Alert.alert("Delete Request", "Are you sure?", [
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

  const handleCompleteDelivery = (id: string) => {
    Alert.alert("Complete Delivery", "Mark as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          try {
            await requests.complete(id);
            Alert.alert("Success", "Marked as completed! ✅");
            loadData();
          } catch (error) {
            Alert.alert("Error", "Failed to complete");
          }
        },
      },
    ]);
  };

  const handleRateDelivery = (req: DeliveryRequest) => {
    setSelectedRequest(req);
    setRating("5");
    setFeedback("");
    setRatingModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedRequest) return;
    try {
      // Call rating API
      await requests.rate(selectedRequest._id, Number(rating), feedback);
      Alert.alert("Success", "Rating submitted! ✅");
      setRatingModalVisible(false);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="My Activity" />

      {/* MODE SELECTOR */}
      <View style={[styles.modeSelector, { backgroundColor: theme.card }]}>
        {["deliveries", "requests", "availability"].map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m as any)}
            style={[
              styles.modeTab,
              {
                borderBottomColor: mode === m ? theme.primary : "transparent",
                borderBottomWidth: mode === m ? 3 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.modeTabText,
                {
                  color: mode === m ? theme.primary : theme.subtext,
                  fontWeight: mode === m ? "700" : "500",
                },
              ]}
            >
              {m === "deliveries"
                ? "Deliveries"
                : m === "requests"
                ? "Requests"
                : "Availability"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {/* DELIVERIES MODE */}
        {mode === "deliveries" && (
          <>
            <Text style={[styles.modeTitle, { color: theme.text, marginBottom: 12 }]}>
              Your Deliveries
            </Text>
            {allDeliveries.filter((d) => d.status === "IN_PROGRESS").length ===
              0 ? (
              <Card>
                <Text
                  style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}
                >
                  No active deliveries
                </Text>
              </Card>
            ) : (
              allDeliveries
                .filter((d) => d.status === "IN_PROGRESS")
                .map((delivery) => (
                  <Card key={delivery._id}>
                    <View style={styles.header}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.item, { color: theme.text }]}>
                          {delivery.itemDescription}
                        </Text>
                        <Text style={[styles.subtext, { color: theme.subtext }]}>
                          {typeof delivery.outlet === "object"
                            ? delivery.outlet?.name
                            : delivery.outlet}{" "}
                          → {delivery.hostel}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.feeBadge,
                          { backgroundColor: theme.primary + "20" },
                        ]}
                      >
                        <Text style={[styles.fee, { color: theme.primary }]}>
                          ₹{delivery.fee}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleCompleteDelivery(delivery._id)}
                      style={[
                        styles.button,
                        { backgroundColor: theme.primary, marginTop: 12 },
                      ]}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "600",
                          marginLeft: 8,
                        }}
                      >
                        Mark Complete
                      </Text>
                    </Pressable>
                  </Card>
                ))
            )}

            <Text
              style={[styles.modeTitle, { color: theme.text, marginBottom: 12, marginTop: 20 }]}
            >
              Completed Deliveries
            </Text>
            {allDeliveries.filter((d) => d.status === "COMPLETED").length ===
              0 ? (
              <Card>
                <Text
                  style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}
                >
                  No completed deliveries
                </Text>
              </Card>
            ) : (
              allDeliveries
                .filter((d) => d.status === "COMPLETED")
                .map((delivery) => (
                  <Card key={delivery._id}>
                    <View style={styles.header}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.item, { color: theme.text }]}>
                          {delivery.itemDescription}
                        </Text>
                        <Text style={[styles.subtext, { color: theme.subtext }]}>
                          {typeof delivery.outlet === "object"
                            ? delivery.outlet?.name
                            : delivery.outlet}{" "}
                          → {delivery.hostel}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.feeBadge,
                          { backgroundColor: "#10b98120" },
                        ]}
                      >
                        <Text style={[styles.fee, { color: "#10b981" }]}>
                          ✓ Done
                        </Text>
                      </View>
                    </View>

                    {!delivery.delivererRating ||
                    !delivery.delivererRating?.rating ? (
                      <Pressable
                        onPress={() => handleRateDelivery(delivery)}
                        style={[
                          styles.button,
                          { backgroundColor: theme.primary, marginTop: 12 },
                        ]}
                      >
                        <Ionicons name="star" size={16} color="#fff" />
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                            marginLeft: 8,
                          }}
                        >
                          Rate Deliverer
                        </Text>
                      </Pressable>
                    ) : (
                      <Text
                        style={[
                          styles.subtext,
                          { color: theme.subtext, marginTop: 8 },
                        ]}
                      >
                        ⭐ Rated {delivery.delivererRating.rating}/5
                      </Text>
                    )}
                  </Card>
                ))
            )}
          </>
        )}

        {/* REQUESTS MODE */}
        {mode === "requests" && (
          <>
            <Text style={[styles.modeTitle, { color: theme.text, marginBottom: 12 }]}>
              Pending Requests
            </Text>
            {allDeliveries.filter((r) => r.status === "OPEN").length === 0 ? (
              <Card>
                <Text
                  style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}
                >
                  No pending requests
                </Text>
              </Card>
            ) : (
              allDeliveries
                .filter((r) => r.status === "OPEN")
                .map((request) => (
                  <Card key={request._id}>
                    <View style={styles.header}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.item, { color: theme.text }]}>
                          {request.itemDescription}
                        </Text>
                        <Text style={[styles.subtext, { color: theme.subtext }]}>
                          {typeof request.outlet === "object"
                            ? request.outlet?.name
                            : request.outlet}{" "}
                          → {request.hostel}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.feeBadge,
                          { backgroundColor: theme.primary + "20" },
                        ]}
                      >
                        <Text style={[styles.fee, { color: theme.primary }]}>
                          ₹{request.fee}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => {
                          setEditingId(request._id);
                          setEditItem(request.itemDescription);
                          setEditOutlet(
                            typeof request.outlet === "object"
                              ? request.outlet?.name
                              : request.outlet
                          );
                        }}
                        style={[
                          styles.smallButton,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Ionicons name="pencil" size={16} color="#fff" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteDelivery(request._id)}
                        style={[styles.smallButton, { backgroundColor: "#ef4444" }]}
                      >
                        <Ionicons name="trash" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </Card>
                ))
            )}

            <Text
              style={[
                styles.modeTitle,
                { color: theme.text, marginBottom: 12, marginTop: 20 },
              ]}
            >
              Accepted Requests
            </Text>
            {allDeliveries.filter((r) => r.status === "IN_PROGRESS").length ===
              0 ? (
              <Card>
                <Text
                  style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}
                >
                  No accepted requests
                </Text>
              </Card>
            ) : (
              allDeliveries
                .filter((r) => r.status === "IN_PROGRESS")
                .map((request) => (
                  <Card key={request._id}>
                    <View style={styles.header}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.item, { color: theme.text }]}>
                          {request.itemDescription}
                        </Text>
                        <Text style={[styles.subtext, { color: theme.subtext }]}>
                          By{" "}
                          {typeof request.acceptedBy === "object"
                            ? request.acceptedBy?.name
                            : "User"}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.feeBadge,
                          { backgroundColor: "#f59e0b20" },
                        ]}
                      >
                        <Text style={[styles.fee, { color: "#f59e0b" }]}>
                          In Progress
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))
            )}
          </>
        )}

        {/* AVAILABILITY MODE */}
        {mode === "availability" && (
          <>
            <Text style={[styles.modeTitle, { color: theme.text, marginBottom: 12 }]}>
              Pending Checks
            </Text>
            {allAvailabilities.filter((a) => a.status === "PENDING").length ===
              0 ? (
              <Card>
                <Text
                  style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}
                >
                  No pending availability checks
                </Text>
              </Card>
            ) : (
              allAvailabilities
                .filter((a) => a.status === "PENDING")
                .map((avail) => (
                  <Card key={avail._id}>
                    <View style={styles.header}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.item, { color: theme.text }]}>
                          {avail.itemName}
                        </Text>
                        <Text style={[styles.subtext, { color: theme.subtext }]}>
                          {typeof avail.outlet === "object"
                            ? avail.outlet?.name
                            : avail.outlet}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.feeBadge,
                          { backgroundColor: theme.primary + "20" },
                        ]}
                      >
                        <Text style={[styles.fee, { color: theme.primary }]}>
                          ⏳ Pending
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => handleDeleteAvailability(avail._id)}
                        style={[styles.smallButton, { backgroundColor: "#ef4444" }]}
                      >
                        <Ionicons name="trash" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </Card>
                ))
            )}

            <Text
              style={[
                styles.modeTitle,
                { color: theme.text, marginBottom: 12, marginTop: 20 },
              ]}
            >
              Responded Checks
            </Text>
            {allAvailabilities.filter((a) => a.status === "CONFIRMED").length ===
              0 ? (
              <Card>
                <Text
                  style={[styles.emptyText, { color: theme.subtext, textAlign: "center" }]}
                >
                  No responded checks
                </Text>
              </Card>
            ) : (
              allAvailabilities
                .filter((a) => a.status === "CONFIRMED")
                .map((avail) => (
                  <Card key={avail._id}>
                    <View style={styles.header}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.item, { color: theme.text }]}>
                          {avail.itemName}
                        </Text>
                        <Text style={[styles.subtext, { color: theme.subtext }]}>
                          {typeof avail.outlet === "object"
                            ? avail.outlet?.name
                            : avail.outlet}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.feeBadge,
                          {
                            backgroundColor: avail.response?.available
                              ? "#10b98120"
                              : "#ef444420",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.fee,
                            {
                              color: avail.response?.available
                                ? "#10b981"
                                : "#ef4444",
                            },
                          ]}
                        >
                          {avail.response?.available ? "✓ Yes" : "✗ No"}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))
            )}
          </>
        )}
      </ScrollView>

      {/* RATING MODAL */}
      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Rate Deliverer
            </Text>
            <Text
              style={[styles.label, { color: theme.text, marginTop: 12 }]}
            >
              Rating
            </Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((r) => (
                <Pressable key={r} onPress={() => setRating(String(r))}>
                  <Text
                    style={[
                      styles.ratingButton,
                      {
                        color: Number(rating) >= r ? "#fbbf24" : theme.border,
                        fontSize: 28,
                      },
                    ]}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text
              style={[styles.label, { color: theme.text, marginTop: 12 }]}
            >
              Feedback (Optional)
            </Text>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Share your experience..."
              placeholderTextColor={theme.subtext}
              multiline
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.bg,
                  minHeight: 80,
                  textAlignVertical: "top",
                },
              ]}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setRatingModalVisible(false)}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: theme.bg,
                    borderWidth: 1,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitRating}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Submit</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  modeTabText: {
    fontSize: 12,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  item: {
    fontSize: 14,
    fontWeight: "600",
  },
  subtext: {
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
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  emptyText: {
    paddingVertical: 20,
    fontSize: 13,
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
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12,
  },
  ratingButton: {
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
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
