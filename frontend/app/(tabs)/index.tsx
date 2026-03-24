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
import { getRequests, deleteRequest } from "@/services/api";
import { DeliveryRequest } from "@/types/deliveryRequest";
import RequestCard from "@/components/RequestCard";
import { useTheme } from "@/context/ThemeContext";

export default function RequestsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

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
  console.log("Edit clicked:", request);
  alert("Edit feature coming soon");
};

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  /* FILTER + SEARCH */
  const processedRequests = requests
    .filter((r) => r.status === "OPEN")
    .filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.itemDescription.toLowerCase().includes(q) ||
        r.outlet.toLowerCase().includes(q)
      );
    })
    .filter((r) =>
      filterOutlet === "ALL" ? true : r.outlet === filterOutlet
    );

  /* SORT */
  const sortedRequests = [...processedRequests].sort((a, b) => {
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

  /* LOADING */
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading requests...</Text>
      </View>
    );
  }

  /* ERROR */
  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          {/* HEADER */}
          <Text style={[styles.title, { color: theme.text }]}>
            Delivery Requests
          </Text>

          {/* SEARCH */}
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search item or outlet..."
            placeholderTextColor={theme.subtext}
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />

          {/* SORT */}
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
                    color:
                      sortBy === type ? "#fff" : theme.text,
                    fontWeight: "600",
                  }}
                >
                  {type === "newest" ? "Newest" : "Fee"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* FILTER */}
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
                  }}
                >
                  {outlet}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* EMPTY */}
          {sortedRequests.length === 0 && (
            <Text
              style={[
                styles.emptyText,
                { color: theme.subtext },
              ]}
            >
              No active delivery requests.
            </Text>
          )}

          {/* LIST */}
          {Object.entries(groupedRequests).map(([outlet, list]) => {
            if (list.length === 0) return null;

            return (
              <View key={outlet} style={styles.section}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.text },
                  ]}
                >
                  {outlet}
                </Text>

                {list.map((item) => (
                  <RequestCard
                    key={item._id}
                    request={item}
                    onDelete={() => handleDelete(item._id)}
                    onEdit={() => handleEdit(item)}
                    onRefresh={loadRequests}
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

  /* 🔥 TITLE (match users) */
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  /* 🔥 INPUT (same as users) */
  searchInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  /* 🔥 SORT BUTTONS */
  sortControls: {
    flexDirection: "row",
    marginBottom: 10,
  },

  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: "#fff",
  },

  /* 🔥 FILTER BUTTONS */
  filterControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },

  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },

  /* 🔥 SECTION */
  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 13,
  },
});