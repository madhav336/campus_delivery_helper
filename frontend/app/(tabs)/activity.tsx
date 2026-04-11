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

interface InProgressRequest {
  _id: string;
  itemDescription: string;
  outlet: string;
  hostel: string;
  fee: number;
  status: string;
  requestedBy: string;
  acceptedBy: string;
  createdAt: string;
  estimatedDelivery?: string;
}

export default function ActivityScreen() {
  const { theme } = useTheme();
  const [inProgress, setInProgress] = useState<InProgressRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InProgressRequest | null>(null);
  const [rating, setRating] = useState("5");
  const [feedback, setFeedback] = useState("");

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true);
      const data = await requests.getAll("inprogress");
      setInProgress(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadActivity();
  }, [loadActivity]));

  const handleCompleteRequest = async (id: string) => {
    Alert.alert("Complete Request", "Mark this delivery as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          try {
            await requests.complete(id);
            const completeRequest = inProgress.find((r) => r._id === id);
            if (completeRequest) {
              setSelectedRequest(completeRequest);
              setRatingModalVisible(true);
            } else {
              Alert.alert("Success", "Delivery completed! ✅");
              loadActivity();
            }
          } catch (error) {
            Alert.alert("Error", "Failed to complete request");
          }
        },
      },
    ]);
  };

  const handleSubmitRating = async () => {
    if (!selectedRequest) return;
    try {
      await requests.rate(selectedRequest._id, Number(rating), feedback);
      Alert.alert("Success", "Thank you for rating! ✅");
      setRatingModalVisible(false);
      setRating("5");
      setFeedback("");
      loadActivity();
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

  if (inProgress.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Activity" />
        <View style={styles.centered}>
          <Ionicons name="checkmark-done" size={48} color={theme.subtext} />
          <Text style={[styles.emptyText, { color: theme.text, marginTop: 12 }]}>
            No active deliveries
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Activity" />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {inProgress.map((request) => (
          <Card key={request._id}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.item, { color: theme.text }]}>
                  {request.itemDescription}
                </Text>
                <Text style={[styles.outlet, { color: theme.subtext }]}>
                  {request.outlet} → {request.hostel}
                </Text>
              </View>
              <View style={[styles.feeBadge, { backgroundColor: theme.primary }]}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                  ₹{request.fee}
                </Text>
              </View>
            </View>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Ionicons name="time" size={14} color={theme.subtext} />
                <Text style={[styles.detailText, { color: theme.subtext }]}>
                  Created {new Date(request.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={14} color={theme.subtext} />
                <Text style={[styles.detailText, { color: theme.subtext }]}>
                  Accepted by {request.acceptedBy?.split("@")[0] || "User"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => handleCompleteRequest(request._id)}
              style={[
                styles.completeButton,
                { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8 }}>
                Mark Complete
              </Text>
            </Pressable>
          </Card>
        ))}
      </ScrollView>

      {/* RATING MODAL */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Rate this delivery
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
              How was your experience?
            </Text>

            {/* STAR RATING */}
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star.toString())}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name={star <= Number(rating) ? "star" : "star-outline"}
                    size={32}
                    color={star <= Number(rating) ? theme.primary : theme.border}
                  />
                </Pressable>
              ))}
            </View>

            {/* FEEDBACK */}
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Add feedback (optional)"
              placeholderTextColor={theme.subtext}
              multiline
              numberOfLines={3}
              style={[
                styles.feedbackInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.bg,
                },
              ]}
            />

            {/* BUTTONS */}
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setRatingModalVisible(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 },
                ]}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitRating}
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Submit</Text>
              </Pressable>
            </View>
          </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  item: {
    fontSize: 15,
    fontWeight: "700",
  },
  outlet: {
    fontSize: 12,
    marginTop: 4,
  },
  feeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
  },
  completeButton: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginBottom: 16,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
