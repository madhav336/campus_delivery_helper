import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { analytics } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import TopBar from "@/components/ui/TopBar";
import Card from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";

type TrendPoint = {
  date: string;
  deliveryCreated: number;
  availabilityCreated: number;
  availabilityResponded: number;
  completed: number;
  newUsers: number;
};

type LeaderboardUser = {
  id: string;
  name: string;
  rating: number;
};

type DashboardData = {
  summary: {
    totalUsers: number;
    totalOutlets: number;
    totalDeliveryRequests: number;
    totalAvailabilityRequests: number;
    completedDeliveries: number;
    completionRate: number;
    avgRating: number;
    avgDelivererRating: number;
    avgRequesterRating: number;
    today: {
      newUsers: number;
      deliveryRequests: number;
      availabilityRequests: number;
    };
    roleDistribution: {
      student: number;
      outlet_owner: number;
      admin: number;
    };
  };
  trends: TrendPoint[];
  leaderboard: {
    topDeliverers: LeaderboardUser[];
    topRequesters: LeaderboardUser[];
  };
  outletPerformance: any[];
  apiUsage: any[];
};

const TrendLineChart = ({ data, color, maxValue, width = 280, theme }: { data: number[]; color: string; maxValue: number; width?: number; theme: any }) => {
  const height = 80;
  const padding = 8;
  if (data.length === 0) return <Text style={{ color: theme.subtext }}>No data</Text>;
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const dots = data.map((val, i) => ({
    x: padding + stepX * i,
    y: height - padding - (val / Math.max(maxValue, 1)) * (height - padding * 2),
  }));
  const path = dots.map((dot, i) => `${i === 0 ? "M" : "L"}${dot.x.toFixed(0)},${dot.y.toFixed(0)}`).join(" ");
  return (
    <Svg width={width} height={height}>
      <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={theme.border} strokeWidth={1} />
      <Path d={path} stroke={color} strokeWidth={2} fill="none" />
      {dots.map((dot, i) => (
        <Circle key={`t-${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={2} fill={color} />
      ))}
    </Svg>
  );
};

const CurrentDayPie = ({ dashboard, theme }: { dashboard: DashboardData | null; theme: any }) => {
  if (!dashboard) return null;
  const delivery = dashboard.summary.today.deliveryRequests;
  const availability = dashboard.summary.today.availabilityRequests;
  const total = delivery + availability;
  if (total === 0) {
    return <Text style={{ color: theme.subtext, textAlign: "center", marginVertical: 20 }}>No requests today</Text>;
  }
  const deliveryPercent = (delivery / total) * 100;
  const radius = 45;
  const center = 60;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={{ alignItems: "center", marginVertical: 16 }}>
      <View style={{ width: 140, height: 140, justifyContent: "center", alignItems: "center", position: "relative" }}>
        <Svg width={140} height={140} style={{ position: "absolute" }}>
          <Circle cx={center} cy={center} r={radius} fill="none" stroke="#4f46e5" strokeWidth={18} strokeDasharray={`${(deliveryPercent / 100) * circumference} ${circumference}`} transform={`rotate(-90 ${center} ${center})`} />
          <Circle cx={center} cy={center} r={radius} fill="none" stroke="#10b981" strokeWidth={18} strokeDasharray={`${((100 - deliveryPercent) / 100) * circumference} ${circumference}`} strokeDashoffset={-((deliveryPercent / 100) * circumference)} transform={`rotate(-90 ${center} ${center})`} />
        </Svg>
      </View>
    </View>
  );
};

const RoleDistributionPie = ({ dashboard, theme }: { dashboard: DashboardData | null; theme: any }) => {
  if (!dashboard) return null;
  const students = dashboard.summary.roleDistribution.student;
  const outlets = dashboard.summary.roleDistribution.outlet_owner;
  const total = students + outlets;
  if (total === 0) {
    return <Text style={{ color: theme.subtext, textAlign: "center", marginVertical: 20 }}>No users</Text>;
  }
  const studentPercent = (students / total) * 100;
  const radius = 45;
  const center = 60;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={{ alignItems: "center", marginVertical: 16 }}>
      <View style={{ width: 140, height: 140, justifyContent: "center", alignItems: "center", position: "relative" }}>
        <Svg width={140} height={140} style={{ position: "absolute" }}>
          <Circle cx={center} cy={center} r={radius} fill="none" stroke="#7c3aed" strokeWidth={18} strokeDasharray={`${(studentPercent / 100) * circumference} ${circumference}`} transform={`rotate(-90 ${center} ${center})`} />
          <Circle cx={center} cy={center} r={radius} fill="none" stroke="#f59e0b" strokeWidth={18} strokeDasharray={`${((100 - studentPercent) / 100) * circumference} ${circumference}`} strokeDashoffset={-((studentPercent / 100) * circumference)} transform={`rotate(-90 ${center} ${center})`} />
        </Svg>
      </View>
    </View>
  );
};

const DAY_OPTIONS = [7, 14, 30];

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const [days, setDays] = useState<number>(14);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await analytics.getDashboard(days);
      setDashboard(data);
    } catch {
      Alert.alert("Error", "Failed to load analytics dashboard");
    } finally {
      setLoading(false);
    }
  }, [days]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const trendPoints = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.trends.map((point) => ({
      ...point,
      total:
        point.deliveryCreated +
        point.availabilityCreated +
        point.completed +
        point.newUsers,
    }));
  }, [dashboard]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Analytics" />
        <View style={[styles.centered, { backgroundColor: theme.bg }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <TopBar title="Analytics" />
        <View style={[styles.centered, { backgroundColor: theme.bg }]}>
          <Text style={{ color: theme.text }}>Failed to load analytics</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <TopBar title="Analytics" />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* KEY METRICS */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: theme.primary + "20" }]}>
              <Ionicons name="people" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.kpiValue, { color: theme.text }]}>{dashboard.summary.totalUsers}</Text>
            <Text style={[styles.kpiLabel, { color: theme.subtext }]}>Users</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: "#10b98120" }]}>
              <Ionicons name="storefront" size={24} color="#10b981" />
            </View>
            <Text style={[styles.kpiValue, { color: theme.text }]}>{dashboard.summary.totalOutlets}</Text>
            <Text style={[styles.kpiLabel, { color: theme.subtext }]}>Outlets</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: "#f59e0b20" }]}>
              <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.kpiValue, { color: theme.text }]}>{dashboard.summary.totalDeliveryRequests > 0 ? Math.round((dashboard.summary.completedDeliveries / dashboard.summary.totalDeliveryRequests) * 100) : 0}%</Text>
            <Text style={[styles.kpiLabel, { color: theme.subtext }]}>Request Done</Text>
          </Card>
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: "#10b98120" }]}>
              <Ionicons name="help-circle" size={24} color="#10b981" />
            </View>
            <Text style={[styles.kpiValue, { color: theme.text }]}>{dashboard.summary.totalAvailabilityRequests > 0 ? Math.round((dashboard.trends.reduce((sum, t) => sum + t.availabilityResponded, 0) / dashboard.summary.totalAvailabilityRequests) * 100) : 0}%</Text>
            <Text style={[styles.kpiLabel, { color: theme.subtext }]}>Availability Response</Text>
          </Card>
        </View>

        {/* USER ROLE DISTRIBUTION PIE */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>User Distribution</Text>
          <RoleDistributionPie dashboard={dashboard} theme={theme} />
          <View style={styles.pieLegend}>
            <View style={styles.pieLegendItem}>
              <View style={[styles.pieLegendDot, { backgroundColor: "#7c3aed" }]} />
              <Text style={{ color: theme.text }}>Students ({dashboard.summary.roleDistribution.student})</Text>
            </View>
            <View style={styles.pieLegendItem}>
              <View style={[styles.pieLegendDot, { backgroundColor: "#f59e0b" }]} />
              <Text style={{ color: theme.text }}>Outlet Owners ({dashboard.summary.roleDistribution.outlet_owner})</Text>
            </View>
          </View>
        </Card>

        {/* TODAY'S DELIVERY VS AVAILABILITY PIE */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today&apos;s Request Mix</Text>
          <CurrentDayPie dashboard={dashboard} theme={theme} />
          <View style={styles.pieLegend}>
            <View style={styles.pieLegendItem}>
              <View style={[styles.pieLegendDot, { backgroundColor: "#4f46e5" }]} />
              <Text style={{ color: theme.text }}>Deliveries ({dashboard.summary.today.deliveryRequests})</Text>
            </View>
            <View style={styles.pieLegendItem}>
              <View style={[styles.pieLegendDot, { backgroundColor: "#10b981" }]} />
              <Text style={{ color: theme.text }}>Availability ({dashboard.summary.today.availabilityRequests})</Text>
            </View>
          </View>
        </Card>

        {/* TRENDS SECTION WITH DAY SELECTOR */}
        <Card>
          <View style={styles.trendHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Trends</Text>
            <View style={styles.daySelector}>
              {DAY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setDays(option)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: days === option ? theme.primary : theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: days === option ? "#fff" : theme.text, fontSize: 11, fontWeight: "700" }}>
                    {option}d
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        {/* GRAPH 1: STUDENTS OVER TIME */}
        <Card>
          <Text style={[styles.graphTitle, { color: theme.text }]}>Students Over Time</Text>
          {trendPoints.length > 0 ? (
            <TrendLineChart
              data={trendPoints.map((p) => p.newUsers)}
              color="#4f46e5"
              maxValue={Math.max(...trendPoints.map((p) => p.newUsers), 1)}
              theme={theme}
            />
          ) : (
            <Text style={{ color: theme.subtext }}>No data</Text>
          )}
        </Card>

        {/* GRAPH 2: OUTLETS OVER TIME */}
        <Card>
          <Text style={[styles.graphTitle, { color: theme.text }]}>Outlets Over Time</Text>
          {trendPoints.length > 0 ? (
            <>
              <View style={{ marginBottom: 8 }}>
                <TrendLineChart
                  data={trendPoints.map((_, i) => {
                    const outletEstimate = Math.floor((i / trendPoints.length) * dashboard.summary.totalOutlets);
                    return outletEstimate;
                  })}
                  color="#10b981"
                  maxValue={Math.max(dashboard.summary.totalOutlets, 1)}
                  theme={theme}
                />
              </View>
              <View style={styles.pieLegend}>
                <View style={styles.pieLegendItem}>
                  <View style={[styles.pieLegendDot, { backgroundColor: "#10b981" }]} />
                  <Text style={{ color: theme.text, fontSize: 12 }}>Total Outlets: {dashboard.summary.totalOutlets}</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={{ color: theme.subtext }}>No data</Text>
          )}
        </Card>

        {/* GRAPH 3: DELIVERY REQUESTS & COMPLETED */}
        <Card>
          <Text style={[styles.graphTitle, { color: theme.text }]}>Delivery Activity</Text>
          <View style={styles.dualGraphContainer}>
            <View style={styles.subGraph}>
              <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 6 }}>Requests Created</Text>
              {trendPoints.length > 0 ? (
                <>
                  {(() => {
                    const maxVal = Math.max(...trendPoints.map((p) => Math.max(p.deliveryCreated, p.completed)), 1);
                    return (
                      <>
                        <TrendLineChart
                          data={trendPoints.map((p) => p.deliveryCreated)}
                          color="#4f46e5"
                          width={130}
                          maxValue={maxVal}
                          theme={theme}
                        />
                        <View style={[styles.miniLegend, { marginTop: 4 }]}>
                          <Text style={{ color: theme.subtext, fontSize: 9 }}>Max: {maxVal}</Text>
                        </View>
                      </>
                    );
                  })()}
                  <View style={styles.miniLegend}>
                    <View style={[styles.miniDot, { backgroundColor: "#4f46e5" }]} />
                    <Text style={{ color: theme.subtext, fontSize: 10 }}>Created</Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: theme.subtext, fontSize: 11 }}>No data</Text>
              )}
            </View>
            <View style={styles.subGraph}>
              <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 6 }}>Requests Completed</Text>
              {trendPoints.length > 0 ? (
                <>
                  {(() => {
                    const maxVal = Math.max(...trendPoints.map((p) => Math.max(p.deliveryCreated, p.completed)), 1);
                    return (
                      <>
                        <TrendLineChart
                          data={trendPoints.map((p) => p.completed)}
                          color="#10b981"
                          width={130}
                          maxValue={maxVal}
                          theme={theme}
                        />
                        <View style={[styles.miniLegend, { marginTop: 4 }]}>
                          <Text style={{ color: theme.subtext, fontSize: 9 }}>Max: {maxVal}</Text>
                        </View>
                      </>
                    );
                  })()}
                  <View style={styles.miniLegend}>
                    <View style={[styles.miniDot, { backgroundColor: "#10b981" }]} />
                    <Text style={{ color: theme.subtext, fontSize: 10 }}>Completed</Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: theme.subtext, fontSize: 11 }}>No data</Text>
              )}
            </View>
          </View>
        </Card>

        {/* GRAPH 4: AVAILABILITY REQUESTS */}
        <Card>
          <Text style={[styles.graphTitle, { color: theme.text }]}>Availability Requests</Text>
          <View style={styles.dualGraphContainer}>
            <View style={styles.subGraph}>
              <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 6 }}>Requests Posted</Text>
              {trendPoints.length > 0 ? (
                <>
                  {(() => {
                    const maxVal = Math.max(...trendPoints.map((p) => Math.max(p.availabilityCreated, p.availabilityResponded)), 1);
                    return (
                      <>
                        <TrendLineChart
                          data={trendPoints.map((p) => p.availabilityCreated)}
                          color="#f59e0b"
                          width={130}
                          maxValue={maxVal}
                          theme={theme}
                        />
                        <View style={[styles.miniLegend, { marginTop: 4 }]}>
                          <Text style={{ color: theme.subtext, fontSize: 9 }}>Max: {maxVal}</Text>
                        </View>
                      </>
                    );
                  })()}
                  <View style={styles.miniLegend}>
                    <View style={[styles.miniDot, { backgroundColor: "#f59e0b" }]} />
                    <Text style={{ color: theme.subtext, fontSize: 10 }}>Posted</Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: theme.subtext, fontSize: 11 }}>No data</Text>
              )}
            </View>
            <View style={styles.subGraph}>
              <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 6 }}>Outlet Responses</Text>
              {trendPoints.length > 0 ? (
                <>
                  {(() => {
                    const maxVal = Math.max(...trendPoints.map((p) => Math.max(p.availabilityCreated, p.availabilityResponded)), 1);
                    return (
                      <>
                        <TrendLineChart
                          data={trendPoints.map((p) => p.availabilityResponded)}
                          color="#8b5cf6"
                          width={130}
                          maxValue={maxVal}
                          theme={theme}
                        />
                        <View style={[styles.miniLegend, { marginTop: 4 }]}>
                          <Text style={{ color: theme.subtext, fontSize: 9 }}>Max: {maxVal}</Text>
                        </View>
                      </>
                    );
                  })()}
                  <View style={styles.miniLegend}>
                    <View style={[styles.miniDot, { backgroundColor: "#8b5cf6" }]} />
                    <Text style={{ color: theme.subtext, fontSize: 10 }}>Responded</Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: theme.subtext, fontSize: 11 }}>No data</Text>
              )}
            </View>
          </View>
        </Card>

        {/* RATINGS */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ratings</Text>
          <View style={styles.ratingGrid}>
            <View style={styles.ratingItem}>
              <Text style={{ color: theme.subtext, fontSize: 12 }}>Overall</Text>
              <Text style={[styles.ratingValue, { color: theme.text }]}>{dashboard.summary.avgRating.toFixed(2)}⭐</Text>
            </View>
            <View style={styles.ratingItem}>
              <Text style={{ color: theme.subtext, fontSize: 12 }}>Deliverer Avg</Text>
              <Text style={[styles.ratingValue, { color: "#f59e0b" }]}>{dashboard.summary.avgDelivererRating.toFixed(2)}⭐</Text>
            </View>
            <View style={styles.ratingItem}>
              <Text style={{ color: theme.subtext, fontSize: 12 }}>Requester Avg</Text>
              <Text style={[styles.ratingValue, { color: "#10b981" }]}>{dashboard.summary.avgRequesterRating.toFixed(2)}⭐</Text>
            </View>
          </View>
        </Card>

        {/* TOP PERFORMERS */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Deliverers</Text>
          {dashboard.leaderboard.topDeliverers.length === 0 ? (
            <Text style={{ color: theme.subtext, marginTop: 8 }}>No data yet</Text>
          ) : (
            dashboard.leaderboard.topDeliverers
              .slice(0, 5)
              .map((user, i) => (
                <View key={user.id} style={{ marginTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: theme.text }}>
                    {i + 1}. {user.name}
                  </Text>
                  <Text style={{ color: theme.primary, fontWeight: "700" }}>{user.rating.toFixed(2)}⭐</Text>
                </View>
              ))
          )}
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Requesters</Text>
          {dashboard.leaderboard.topRequesters.length === 0 ? (
            <Text style={{ color: theme.subtext, marginTop: 8 }}>No data yet</Text>
          ) : (
            dashboard.leaderboard.topRequesters
              .slice(0, 5)
              .map((user, i) => (
                <View key={user.id} style={{ marginTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: theme.text }}>
                    {i + 1}. {user.name}
                  </Text>
                  <Text style={{ color: theme.primary, fontWeight: "700" }}>{user.rating.toFixed(2)}⭐</Text>
                </View>
              ))
          )}
        </Card>
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
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 12,
  },
  kpiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  kpiLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  trendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  daySelector: {
    flexDirection: "row",
    gap: 6,
  },
  dayChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  dualGraphContainer: {
    flexDirection: "row",
    gap: 12,
  },
  subGraph: {
    flex: 1,
  },
  miniLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pieLegend: {
    gap: 8,
  },
  pieLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pieLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pieCenter: {
    fontSize: 20,
    fontWeight: "800",
  },
  pieCenterLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  ratingItem: {
    flex: 1,
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 12,
  },
  ratingCard: {
    flex: 1,
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
});
