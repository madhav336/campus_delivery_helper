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
import { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { availability } from "@/services/api";
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
  expiresAt: string;
}

export default function PendingScreen() {
  const { theme } = useTheme();
  const [pending, setPending] = useState<AvailabilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AvailabilityRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [responding, setResponding] = useState(false);

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const data = await availability.getPending();
      setPending(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(loadPending);

  const handleRespond = (request: AvailabilityRequest, isAvailable: boolean) => {
    setSelectedRequest(request);
    setNotes("");
    if (isAvailable) {
      submitResponse(request._id, true);
    } else {
      setResponseModalVisible(true);
    }
  };

  const submitResponse = async (id: string, isAvailable: boolean) => {
    try {
      setResponding(true);
      await availability.respond(id, isAvailable);
      Alert.alert("Success", isAvailable ? "Item available! ✅" : "Response sent ✅");
      setResponseModalVisible(false);
      setNotes("");
      loadPending();
    } catch (error) {
      Alert.alert("Error", "Failed to respond");
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Pending Requests" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (pending.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Pending Requests" />
        <View style={styles.centered}>
          <Ionicons name="inbox" size={48} color={theme.subtext} />
          <Text style={[styles.emptyText, { color: theme.text, marginTop: 12 }]}>
            No pending requests
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.subtext, marginTop: 4 }]}>
            Students will send availability checks here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Pending Requests" />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {pending.map((request) => {
          const expiresAt = new Date(request.expiresAt);
          const now = new Date();
          const hoursLeft = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

          return (
            <Card key={request._id}>
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.item, { color: theme.text }]}>
                    {request.itemName}
                  </Text>
                  <Text style={[styles.requester, { color: theme.subtext }]}>
                    from {request.requestedBy?.split("@")[0]}
                  </Text>
                </View>
                <View
                  style={[
                    styles.timeBadge,
                    {
                      backgroundColor:
                        hoursLeft < 2 ? "#ef4444" : theme.primary,
                      opacity: 0.1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeText,
                      {
                        color:
                          hoursLeft < 2 ? "#ef4444" : theme.primary,
                      },
                    ]}
                  >
                    {hoursLeft}h left
                  </Text>
                </View>
              </View>

              <Text style={[styles.outlet, { color: theme.text, marginTop: 8 }]}>
                📍 {request.outlet}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  { color: theme.subtext, marginTop: 4 },
                ]}
              >
                Requested {new Date(request.createdAt).toLocaleDateString()}
              </Text>

              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() =>
                    handleRespond(request, false)
                  }
                  style={[
                    styles.button,
                    { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 },
                  ]}
                >
                  <Ionicons name="close" size={18} color="#ef4444" />
                  <Text style={{ color: "#ef4444", fontWeight: "600", marginLeft: 4 }}>
                    Not Available
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    handleRespond(request, true)
                  }
                  style={[
                    styles.button,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 4 }}>
                    Available
                  </Text>
                </Pressable>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* RESPONSE MODAL */}
      <Modal
        visible={responseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResponseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Not Available
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
              Add optional notes for the student
            </Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., Will be available tomorrow..."
              placeholderTextColor={theme.subtext}
              multiline
              numberOfLines={3}
              style={[
                styles.notesInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.bg,
                },
              ]}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setResponseModalVisible(false)}
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
                onPress={() => {
                  if (selectedRequest) {
                    submitResponse(selectedRequest._id, false);
                  }
                }}
                disabled={responding}
                style={[
                  styles.modalButton,
                  { backgroundColor: "#ef4444", opacity: responding ? 0.5 : 1 },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {responding ? "Sending..." : "Send"}
                </Text>
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
  },
  item: {
    fontSize: 15,
    fontWeight: "700",
  },
  requester: {
    fontSize: 12,
    marginTop: 2,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  outlet: {
    fontSize: 13,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 11,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
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
  emptySubtext: {
    fontSize: 13,
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
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    textAlignVertical: "top",
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
