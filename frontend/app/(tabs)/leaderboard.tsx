import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { analytics } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";

interface LeaderboardEntry {
  id: string;
  name: string;
  rating: number;
}

interface LeaderboardResponse {
  topDeliverers: LeaderboardEntry[];
  topRequesters: LeaderboardEntry[];
}

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse>({
    topDeliverers: [],
    topRequesters: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"requesters" | "deliverers">("requesters");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await analytics.getLeaderboard();
      setLeaderboard({
        topDeliverers: data?.topDeliverers || [],
        topRequesters: data?.topRequesters || [],
      });
    } catch {
      Alert.alert("Error", "Failed to load leaderboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderRow = (item: LeaderboardEntry, index: number) => {
    const medal =
      index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

    return (
      <Card key={item.id}>
        <View style={styles.row}>
          <Text style={[styles.medal, { color: theme.primary }]}>
            {medal}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>
              {item.name || "Student"}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={theme.primary} />
            <Text style={[styles.rating, { color: theme.text }]}>
              {(item.rating || 0).toFixed(1)}
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
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadLeaderboard();
            }}
            tintColor={theme.primary}
          />
        }
      >
        {activeTab === "requesters"
          ? leaderboard.topRequesters.map((item, index) =>
              renderRow(item, index)
            )
          : leaderboard.topDeliverers.map((item, index) =>
              renderRow(item, index)
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
  },  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },});
