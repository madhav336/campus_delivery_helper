import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { getRequests, deleteRequest } from "@/services/api";
import { DeliveryRequest } from "@/types/deliveryRequest";
import RequestCard from "@/components/RequestCard";
import { ActivityIndicator, Alert } from "react-native";

export default function RequestsScreen() {
  const router = useRouter();

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
    Alert.alert(
      "Delete Request",
      "Are you sure you want to delete this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRequest(id);
              await loadRequests();
            } catch {
              setError("Failed to delete request");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (request: DeliveryRequest) => {
    router.push({
      pathname: "/edit/[id]",
      params: {
        id: request._id,
        item: request.itemDescription,
        outlet: request.outlet,
        hostel: request.hostel,
        fee: String(request.fee),
      },
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8 }}>Loading requests...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Delivery Requests</Text>
        <Text>{error}</Text>
      </View>
    );
  }

  const searchedRequests = requests.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      (r.itemDescription ?? "").toLowerCase().includes(query) ||
      (r.outlet ?? "").toLowerCase().includes(query)
    );
  });

  const filteredRequests =
    filterOutlet === "ALL"
      ? searchedRequests
      : filterOutlet === "Other"
      ? searchedRequests.filter(
          (r) =>
            r.outlet !== "ANC 1" &&
            r.outlet !== "ANC 2" &&
            r.outlet !== "CP"
        )
      : searchedRequests.filter((r) => r.outlet === filterOutlet);

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === "fee") return b.fee - a.fee;
    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });

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

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Delivery Requests</Text>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by item or outlet"
        style={styles.searchInput}
      />

      {/* Sort Controls */}
      <View style={styles.sortControls}>
        <Pressable
          onPress={() => setSortBy("newest")}
          style={[
            styles.sortButton,
            sortBy === "newest" && styles.activeButton,
          ]}
        >
          <Text>Newest</Text>
        </Pressable>

        <Pressable
          onPress={() => setSortBy("fee")}
          style={[
            styles.sortButton,
            sortBy === "fee" && styles.activeButton,
          ]}
        >
          <Text>Fee</Text>
        </Pressable>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterControls}>
        {["ALL", "ANC 1", "ANC 2", "CP", "Other"].map((outlet) => (
          <Pressable
            key={outlet}
            onPress={() =>
              setFilterOutlet(outlet as typeof filterOutlet)
            }
            style={[
              styles.filterButton,
              filterOutlet === outlet && styles.activeButton,
            ]}
          >
            <Text>{outlet}</Text>
          </Pressable>
        ))}
      </View>

      {sortedRequests.length === 0 && (
        <Text style={styles.emptyText}>
          No requests match your current filters.
        </Text>
      )}
      {Object.entries(groupedRequests).map(([outlet, outletRequests]) => {
        if (outletRequests.length === 0) return null;

        return (
          <View key={outlet} style={styles.section}>
            <Text style={styles.sectionTitle}>{outlet}</Text>

            {outletRequests.map((item) => (
              <RequestCard
                key={item._id}
                request={item}
                onDelete={() => handleDelete(item._id)}
                onEdit={() => handleEdit(item)}
              />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  sortControls: {
    flexDirection: "row",
    marginBottom: 12,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginRight: 8,
  },
  filterControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  activeButton: {
    backgroundColor: "#eee",
  },
emptyText: {
  textAlign: "center",
  marginTop: 20,
  color: "#666",
},
});