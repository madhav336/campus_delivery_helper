import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { analytics } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";

interface AnalyticsSummary {
  totalUsers: number;
  totalRequests: number;
  completedRequests: number;
  avgRequestFee: number;
}

interface Trend {
  date: string;
  count: number;
}

interface ApiUsage {
  endpoint: string;
  method: string;
  count: number;
}

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [requestsTrend, setRequestsTrend] = useState<Trend[]>([]);
  const [usersTrend, setUsersTrend] = useState<Trend[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "trends" | "api">(
    "summary"
  );

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [summaryData, reqTrend, userTrend, apiData] = await Promise.all([
        analytics.getSummary(),
        analytics.getRequestsTrend(30),
        analytics.getUsersTrend(30),
        analytics.getApiUsage(),
      ]);
      setSummary(summaryData);
      setRequestsTrend(reqTrend);
      setUsersTrend(userTrend);
      setApiUsage(apiData);
    } catch (error) {
      Alert.alert("Error", "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Analytics" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Analytics" />

      {/* TABS */}
      <View
        style={[
          styles.tabContainer,
          { borderBottomColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <View style={styles.tabInner}>
          {["summary", "trends", "api"].map((tab) => (
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
                onPress={() => setActiveTab(tab as any)}
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

      {/* CONTENT */}
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        {activeTab === "summary" && summary && (
          <>
            {/* STAT CARDS */}
            <View style={styles.statsGrid}>
              <Card style={{ flex: 1 }}>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={24} color={theme.primary} />
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {summary.totalUsers}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.subtext }]}>
                    Total Users
                  </Text>
                </View>
              </Card>
              <Card style={{ flex: 1 }}>
                <View style={styles.statCard}>
                  <Ionicons name="list" size={24} color={theme.primary} />
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {summary.totalRequests}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.subtext }]}>
                    Total Requests
                  </Text>
                </View>
              </Card>
            </View>

            <View style={styles.statsGrid}>
              <Card style={{ flex: 1 }}>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {summary.completedRequests}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.subtext }]}>
                    Completed
                  </Text>
                </View>
              </Card>
              <Card style={{ flex: 1 }}>
                <View style={styles.statCard}>
                  <Ionicons name="cash" size={24} color={theme.primary} />
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    ₹{summary.avgRequestFee ? summary.avgRequestFee.toFixed(0) : "0"}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.subtext }]}>
                    Avg Fee
                  </Text>
                </View>
              </Card>
            </View>
          </>
        )}

        {activeTab === "trends" && (
          <>
            {/* REQUESTS TREND */}
            <Card>
              <Text style={[styles.trendTitle, { color: theme.text }]}>
                Requests Trend (30 days)
              </Text>
              {requestsTrend.length > 0 ? (
                <View style={styles.trendList}>
                  {requestsTrend.slice(-7).map((item, idx) => (
                    <View key={idx} style={styles.trendItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.trendDate, { color: theme.subtext }]}>
                          {new Date(item.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            width: `${Math.min(item.count * 10, 80)}%`,
                            backgroundColor: theme.primary,
                          },
                        ]}
                      />
                      <Text
                        style={[styles.trendCount, { color: theme.text, width: 30 }]}
                      >
                        {item.count}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: theme.subtext }}>No data available</Text>
              )}
            </Card>

            {/* USERS TREND */}
            <Card>
              <Text style={[styles.trendTitle, { color: theme.text }]}>
                Users Trend (30 days)
              </Text>
              {usersTrend.length > 0 ? (
                <View style={styles.trendList}>
                  {usersTrend.slice(-7).map((item, idx) => (
                    <View key={idx} style={styles.trendItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.trendDate, { color: theme.subtext }]}>
                          {new Date(item.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            width: `${Math.min(item.count * 10, 80)}%`,
                            backgroundColor: theme.primary,
                          },
                        ]}
                      />
                      <Text
                        style={[styles.trendCount, { color: theme.text, width: 30 }]}
                      >
                        {item.count}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: theme.subtext }}>No data available</Text>
              )}
            </Card>
          </>
        )}

        {activeTab === "api" && apiUsage.length > 0 && (
          <Card>
            <Text style={[styles.trendTitle, { color: theme.text }]}>
              API Usage
            </Text>
            <View style={styles.apiTable}>
              {/* HEADER */}
              <View style={[styles.apiRow, { backgroundColor: theme.bg }]}>
                <Text style={[styles.apiHeader, { color: theme.subtext, flex: 2 }]}>
                  Endpoint
                </Text>
                <Text style={[styles.apiHeader, { color: theme.subtext, flex: 1 }]}>
                  Method
                </Text>
                <Text style={[styles.apiHeader, { color: theme.subtext, flex: 1 }]}>
                  Calls
                </Text>
              </View>
              {/* ROWS */}
              {apiUsage.slice(0, 10).map((item, idx) => (
                <View key={idx} style={[styles.apiRow, { borderTopColor: theme.border }]}>
                  <Text style={[styles.apiCell, { color: theme.text, flex: 2 }]}>
                    {item.endpoint.substring(0, 25)}...
                  </Text>
                  <Text style={[styles.apiCell, { color: theme.subtext, flex: 1 }]}>
                    {item.method}
                  </Text>
                  <Text style={[styles.apiCell, { color: theme.text, flex: 1, fontWeight: "700" }]}>
                    {item.count}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
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
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    alignItems: "center",
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  trendList: {
    gap: 8,
  },
  trendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trendDate: {
    fontSize: 12,
  },
  trendBar: {
    height: 20,
    borderRadius: 4,
  },
  trendCount: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  apiTable: {
    borderRadius: 8,
    overflow: "hidden",
  },
  apiRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  apiHeader: {
    fontSize: 11,
    fontWeight: "700",
  },
  apiCell: {
    fontSize: 12,
  },
});
