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
import { useRouter } from "expo-router";
import {
  getRequests,
  deleteRequest,
} from "@/services/api";
import { DeliveryRequest } from "@/types/deliveryRequest";
import RequestCard from "@/components/RequestCard";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";

export default function RequestsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();

  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<"newest" | "fee">("newest");
  const [filterOutlet, setFilterOutlet] =
    useState<"ALL" | "ANC 1" | "ANC 2" | "CP" | "Other">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRequests();
      setRequests(data);
    } catch {
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Request", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRequest(id);
          loadRequests();
        },
      },
    ]);
  };

  const handleEdit = (request: DeliveryRequest) => {
    router.push({
      pathname: "/edit/[id]",
      params: {
        id: request._id,
        item: request.itemDescription,
        outlet: request.outlet,
        hostel: request.hostel,
        fee: request.fee,
      },
    } as any);
  };

  const handleAccept = async (id: string) => {
    try {
      const { acceptRequest } = await import("@/services/api");
      await acceptRequest(id, "65f1a3b8c2d3e4f5a6b7c8d9");
      await loadRequests();
      Alert.alert("Success", "Request accepted! ✅");
    } catch (error) {
      Alert.alert("Error", "Failed to accept request");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const { completeRequest } = await import("@/services/api");
      await completeRequest(id, "65f1a3b8c2d3e4f5a6b7c8d9");
      await loadRequests();
      Alert.alert("Success", "Request completed! ✅");
    } catch (error) {
      Alert.alert("Error", "Failed to complete request");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  /* FILTER + SEARCH */
  const processedRequests = requests
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
        return r.outlet !== "ANC 1" && r.outlet !== "ANC 2" && r.outlet !== "CP";
      }
      return r.outlet === filterOutlet;
    });

  /* SORT */
  const sortedRequests = [...processedRequests].sort((a, b) => {
    const statusOrder = { "OPEN": 0, "IN_PROGRESS": 1, "COMPLETED": 2 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 0;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 0;

    if (aOrder !== bOrder) return aOrder - bOrder;

    if (sortBy === "fee") return b.fee - a.fee;

    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });

  /* GROUP */
  const groupedRequests = {
    "ANC 1": sortedRequests.filter((r) => r.outlet === "ANC 1"),
    "ANC 2": sortedRequests.filter((r) => r.outlet === "ANC 2"),
    CP: sortedRequests.filter((r) => r.outlet === "CP"),
    Other: sortedRequests.filter(
      (r) =>
        r.outlet !== "ANC 1" &&
        r.outlet !== "ANC 2" &&
        r.outlet !== "CP"
    ),
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Delivery Requests" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8, color: theme.text }}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Delivery Requests" />
        <View style={styles.centered}>
          <Text style={{ color: theme.text }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar title="Delivery Requests" />
        
        <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 120 }]}>
          {/* SEARCH */}
          <Card>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search item or outlet..."
              placeholderTextColor={theme.subtext}
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.bg,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
          </Card>

          {/* SORT */}
          <Card>
            <View style={styles.controlsRow}>
              <Text style={{ color: theme.text, fontWeight: "600", marginBottom: 10 }}>
                Sort by:
              </Text>
              <View style={styles.sortControls}>
                {["newest", "fee"].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setSortBy(type as any)}
                    style={[
                      styles.sortButton,
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
                        fontSize: 12,
                      }}
                    >
                      {type === "newest" ? "Newest" : "Fee"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>

          {/* FILTER */}
          <Card>
            <View style={styles.controlsRow}>
              <Text style={{ color: theme.text, fontWeight: "600", marginBottom: 10 }}>
                Filter by outlet:
              </Text>
              <View style={styles.filterControls}>
                {["ALL", "ANC 1", "ANC 2", "CP", "Other"].map((outlet) => (
                  <Pressable
                    key={outlet}
                    onPress={() =>
                      setFilterOutlet(outlet as typeof filterOutlet)
                    }
                    style={[
                      styles.filterButton,
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
                        color:
                          filterOutlet === outlet
                            ? "#fff"
                            : theme.text,
                        fontWeight: "600",
                        fontSize: 12,
                      }}
                    >
                      {outlet}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>

          {/* LIST */}
          {Object.entries(groupedRequests).map(([outlet, list]) => {
            if (list.length === 0) return null;

            return (
              <View key={outlet}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {outlet}
                </Text>
                {list.map((item) => (
                  <RequestCard
                    key={item._id}
                    request={item}
                    onDelete={
                      mode === "STUDENT"
                        ? () => handleDelete(item._id)
                        : undefined
                    }
                    onEdit={
                      mode === "STUDENT"
                        ? () => handleEdit(item)
                        : undefined
                    }
                    onAccept={() => handleAccept(item._id)}
                    onComplete={() => handleComplete(item._id)}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },

  controlsRow: {
    gap: 10,
  },

  sortControls: {
    flexDirection: "row",
    gap: 8,
  },

  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },

  filterControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 16,
  },
});