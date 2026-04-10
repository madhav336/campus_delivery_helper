import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { analytics } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";

interface LeaderboardEntry {
  _id: string;
  email: string;
  requesterRating: number;
  delivererRating: number;
  completedDeliveries: number;
  role: string;
}

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requesters" | "deliverers">("requesters");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await analytics.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const sortedByRequesters = [...leaderboard].sort(
    (a, b) => (b.requesterRating || 0) - (a.requesterRating || 0)
  );

  const sortedByDeliverers = [...leaderboard].sort(
    (a, b) => (b.delivererRating || 0) - (a.delivererRating || 0)
  );

  const renderRow = (
    item: LeaderboardEntry,
    index: number,
    isRequester: boolean
  ) => {
    const rating = isRequester ? item.requesterRating : item.delivererRating;
    const medal =
      index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

    return (
      <Card key={item._id}>
        <View style={styles.row}>
          <Text style={[styles.medal, { color: theme.primary }]}>
            {medal}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>
              {item.email.split("@")[0]}
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              {item.role?.replace("_", " ").toUpperCase() || "Student"}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={theme.primary} />
            <Text style={[styles.rating, { color: theme.text }]}>
              {(rating || 0).toFixed(1)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Leaderboard" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Leaderboard" />

      {/* TABS */}
      <View
        style={[
          styles.tabContainer,
          { borderBottomColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <View style={styles.tabInner}>
          {["requesters", "deliverers"].map((tab) => (
            <View
              key={tab}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor:
                  activeTab === tab ? theme.primary : "transparent",
              }}
            >
              <Text
                onPress={() => setActiveTab(tab as "requesters" | "deliverers")}
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab ? theme.primary : theme.subtext,
                  },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* LIST */}
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {activeTab === "requesters"
          ? sortedByRequesters.map((item, index) =>
              renderRow(item, index, true)
            )
          : sortedByDeliverers.map((item, index) =>
              renderRow(item, index, false)
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
  tabContainer: {
    borderBottomWidth: 1,
  },
  tabInner: {
    flexDirection: "row",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  medal: {
    fontSize: 20,
    fontWeight: "700",
    width: 30,
    textAlign: "center",
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "700",
  },
});
