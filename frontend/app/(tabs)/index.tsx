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
import { useCallback, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  acceptedBy?: string | { _id: string; name: string; phone?: string };
  createdAt: string;
}

export default function RequestsScreen() {
  const { theme } = useTheme();

  const [requestsList, setRequestsList] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "fee">("newest");
  const [filterOutlet, setFilterOutlet] = useState("ALL");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentUserId = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUserId(user._id);
        }
      } catch (error) {
        console.error('Failed to load user ID:', error);
      }
    };
    loadCurrentUserId();
  }, []);

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

  useFocusEffect(useCallback(() => {
    loadRequests();
  }, [loadRequests]));

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

  const filteredRequests = (requestsList || []).filter((req) => {
    const matchesSearch =
      req.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.hostel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof req.outlet === 'object' 
        ? req.outlet.name.toLowerCase().includes(searchQuery.toLowerCase())
        : req.outlet.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesOutlet = filterOutlet === "ALL" || 
      (typeof req.outlet === 'object' 
        ? req.outlet.name === filterOutlet 
        : req.outlet === filterOutlet
      );

    return matchesSearch && matchesOutlet;
  });

  const displayedRequests = sortBy === "newest" 
    ? filteredRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : filteredRequests.sort((a, b) => b.fee - a.fee);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Delivery Board" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Delivery Board" />

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {/* SEARCH AND FILTERS */}
        <Card>
          <Text style={[styles.label, { color: theme.text }]}>Search</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by item, hostel, or outlet..."
            placeholderTextColor={theme.subtext}
            style={[
              styles.searchInput,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.bg,
              },
            ]}
          />

          <View style={styles.filterRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }, { marginBottom: 6 }]}>
                Outlet
              </Text>
              <Pressable
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: filterOutlet === "ALL" ? theme.primary : theme.bg,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setFilterOutlet("ALL")}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: filterOutlet === "ALL" ? "#fff" : theme.text },
                  ]}
                >
                  All
                </Text>
              </Pressable>
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.label, { color: theme.text }, { marginBottom: 6 }]}>
                Sort
              </Text>
              <Pressable
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: sortBy === "newest" ? theme.primary : theme.bg,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setSortBy(sortBy === "newest" ? "fee" : "newest")}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: sortBy === "newest" ? "#fff" : theme.text },
                  ]}
                >
                  {sortBy === "newest" ? "🕐 Newest" : "💰 High Fee"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* REQUESTS LIST */}
        {displayedRequests.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              No delivery requests available
            </Text>
          </Card>
        ) : (
          displayedRequests.map((req) => {
            const canAccept = req.status === "OPEN" && 
              (typeof req.requestedBy === 'object' 
                ? req.requestedBy._id !== currentUserId 
                : req.requestedBy !== currentUserId
              );

            return (
              <Card key={req._id}>
                <View style={styles.header}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.item, { color: theme.text }]}>
                      {req.itemDescription}
                    </Text>
                    <Text style={[styles.details, { color: theme.subtext }]}>
                      {typeof req.outlet === 'object' ? req.outlet?.name : req.outlet} → {req.hostel}
                    </Text>
                  </View>
                  <View style={[styles.feeBadge, { backgroundColor: theme.primary + "20" }]}>
                    <Text style={[styles.fee, { color: theme.primary }]}>
                      ₹{req.fee}
                    </Text>
                  </View>
                </View>

                {canAccept && (
                  <Pressable
                    onPress={() => handleAccept(req._id)}
                    style={[styles.button, { backgroundColor: theme.primary, marginTop: 12 }]}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8 }}>
                      Accept Delivery
                    </Text>
                  </Pressable>
                )}

                {!canAccept && (
                  <Text style={[styles.disabledText, { color: theme.subtext, marginTop: 8 }]}>
                    {req.status === "IN_PROGRESS" ? "✓ In Progress" : "Your request"}
                  </Text>
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
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterTab: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  item: {
    fontSize: 14,
    fontWeight: "600",
  },
  details: {
    fontSize: 12,
    marginTop: 4,
  },
  feeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  fee: {
    fontSize: 13,
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
  emptyText: {
    textAlign: "center",
    paddingVertical: 20,
  },
  disabledText: {
    fontSize: 12,
    fontStyle: "italic",
  },
});
