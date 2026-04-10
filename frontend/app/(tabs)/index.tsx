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
import { useCallback, useState } from "react";
import { requests } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";

interface DeliveryRequest {
  _id: string;
  itemDescription: string;
  outlet: string;
  hostel: string;
  fee: number;
  status: string;
  requestedBy: string;
  acceptedBy?: string;
  createdAt: string;
}

export default function RequestsScreen() {
  const { theme, mode } = useTheme();

  const [requestsList, setRequestsList] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "fee">("newest");
  const [filterOutlet, setFilterOutlet] = useState("ALL");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await requests.getAll("all");
      setRequestsList(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(loadRequests);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Request", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await requests.delete(id);
            Alert.alert("Success", "Request deleted! ✅");
            loadRequests();
          } catch (error) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

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
  const filtered = requestsList
    .filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.itemDescription.toLowerCase().includes(q) ||
        r.outlet.toLowerCase().includes(q)
      );
    })
    .filter((r) => {
      if (filterOutlet === "ALL") return true;
      if (filterOutlet === "Other") {
        return !["ANC 1", "ANC 2", "CP"].includes(r.outlet);
      }
      return r.outlet === filterOutlet;
    });

  const sorted = [...filtered].sort((a, b) => {
    const statusOrder = { OPEN: 0, IN_PROGRESS: 1, COMPLETED: 2 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 0;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 0;

    if (aOrder !== bOrder) return aOrder - bOrder;
    if (sortBy === "fee") return b.fee - a.fee;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Requests" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Requests" />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 120 }]}>
        {/* SEARCH */}
        <Card>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search item or outlet..."
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
                  {type === "newest" ? "Newest" : "Fee"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>
            Outlet
          </Text>
          <View style={styles.row}>
            {["ALL", "ANC 1", "ANC 2", "CP", "Other"].map((outlet) => (
              <Pressable
                key={outlet}
                onPress={() => setFilterOutlet(outlet)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      filterOutlet === outlet
                        ? theme.primary
                        : theme.card,
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

        {/* LIST */}
        {sorted.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              No requests found
            </Text>
          </Card>
        ) : (
          sorted.map((req) => {
            const canAccept = req.status === "OPEN" && mode === "STUDENT" && req.requestedBy !== (global as any).currentUserId;
            const canDelete = req.status === "OPEN" && req.requestedBy === (global as any).currentUserId;
            const isAccepted = req.status === "IN_PROGRESS";
            const isCompleted = req.status === "COMPLETED";

            return (
              <Card key={req._id}>
                <View style={styles.header}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.item, { color: theme.text }]}>
                      {req.itemDescription}
                    </Text>
                    <Text style={[styles.details, { color: theme.subtext }]}>
                      {req.outlet} → {req.hostel}
                    </Text>
                  </View>
                  <View style={[styles.feeBadge, { backgroundColor: theme.primary + "20" }]}>
                    <Text style={[styles.fee, { color: theme.primary }]}>
                      ₹{req.fee}
                    </Text>
                  </View>
                </View>

                <View style={styles.status}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          req.status === "OPEN"
                            ? "#ef4444"
                            : req.status === "IN_PROGRESS"
                            ? "#f59e0b"
                            : "#10b981",
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>{req.status}</Text>
                  </View>
                  {isAccepted && (
                    <Text style={[styles.accepted, { color: theme.subtext }]}>
                      by {req.acceptedBy?.split("@")[0]}
                    </Text>
                  )}
                </View>

                {(canAccept || canDelete || isAccepted || isCompleted) && (
                  <View style={styles.actions}>
                    {canAccept && (
                      <Pressable
                        onPress={() => handleAccept(req._id)}
                        style={[
                          styles.button,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 4, fontSize: 12 }}>
                          Accept
                        </Text>
                      </Pressable>
                    )}
                    {canDelete && (
                      <Pressable
                        onPress={() => handleDelete(req._id)}
                        style={[
                          styles.button,
                          { backgroundColor: "#ef4444" },
                        ]}
                      >
                        <Ionicons name="trash" size={16} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 4, fontSize: 12 }}>
                          Delete
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Card>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  item: {
    fontSize: 14,
    fontWeight: "700",
  },
  details: {
    fontSize: 11,
    marginTop: 4,
  },
  feeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fee: {
    fontSize: 12,
    fontWeight: "700",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  accepted: {
    fontSize: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
});