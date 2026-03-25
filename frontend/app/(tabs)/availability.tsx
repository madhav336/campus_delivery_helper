import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { getAvailability, createAvailability, respondAvailability } from "@/services/api";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

type AvailabilityRequest = {
  _id: string;
  studentId: string;
  item: string;
  outlet: string;
  status: "PENDING" | "AVAILABLE" | "NOT_AVAILABLE";
};

export default function AvailabilityScreen() {
  const { theme, mode } = useTheme();

  const [item, setItem] = useState("");
  const [outlet, setOutlet] = useState("ANC 1");
  const [customOutlet, setCustomOutlet] = useState("");
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAvailability();
      setRequests(data);
    } catch {
      console.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleCreate = async () => {
    if (!item.trim()) return;
    if (outlet === "Other" && !customOutlet.trim()) return;

    const finalOutlet =
      outlet === "Other" ? customOutlet : outlet;

    try {
      // using hardcoded student ID since there is no auth context yet
      await createAvailability({ studentId: "65f1a3b8c2d3e4f5a6b7c8d9", outlet: finalOutlet, item });
      setItem("");
      setCustomOutlet("");
      setOutlet("ANC 1");
      await loadData();
    } catch {
      console.error("Failed to create request");
    }
  };

  const handleRespond = async (
    id: string,
    status: "AVAILABLE" | "NOT_AVAILABLE"
  ) => {
    try {
      await respondAvailability(id, status);
      await loadData();
    } catch {
      console.error("Failed to respond");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        
        {/* 🔥 FIX: moved padding INSIDE */}
        <View style={{ flex: 1, padding: 16 }}>

          <Text style={[styles.title, { color: theme.text }]}>
            Availability
          </Text>

          {mode === "STUDENT" && (
            <>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.outletRow}>
                  {["ANC 1", "ANC 2", "CP", "Other"].map((o) => (
                    <Pressable
                      key={o}
                      onPress={() => setOutlet(o)}
                      style={[
                        styles.outletBtn,
                        {
                          backgroundColor:
                            outlet === o
                              ? theme.primary
                              : "transparent",
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            outlet === o ? "#fff" : theme.text,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {o}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {outlet === "Other" && (
                  <TextInput
                    placeholder="Enter outlet name"
                    placeholderTextColor={theme.subtext}
                    value={customOutlet}
                    onChangeText={setCustomOutlet}
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                  />
                )}

                <TextInput
                  placeholder="Enter item"
                  placeholderTextColor={theme.subtext}
                  value={item}
                  onChangeText={setItem}
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />

                <Pressable
                  onPress={handleCreate}
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.primaryText}>
                    Request Availability
                  </Text>
                </Pressable>
              </View>

              <FlatList
                data={requests}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: "600",
                      }}
                    >
                      {item.item} → {item.outlet}
                    </Text>

                    <Text
                      style={{
                        color: theme.subtext,
                        marginTop: 4,
                      }}
                    >
                      Status: {item.status}
                    </Text>
                  </View>
                )}
              />
            </>
          )}

          {mode === "OUTLET" && (
            <FlatList
              data={requests.filter(
                (r) => r.status === "PENDING"
              )}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.text,
                      marginBottom: 10,
                    }}
                  >
                    {item.item} → {item.outlet}
                  </Text>

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() =>
                        handleRespond(item._id, "AVAILABLE")
                      }
                      style={[
                        styles.acceptBtn,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text style={styles.btnText}>
                        AVAILABLE
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        handleRespond(
                          item._id,
                          "NOT_AVAILABLE"
                        )
                      }
                      style={[
                        styles.rejectBtn,
                        { backgroundColor: theme.danger },
                      ]}
                    >
                      <Text style={styles.btnText}>
                        NOT AVAILABLE
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },

  card: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },

  outletRow: {
    flexDirection: "row",
    marginBottom: 10,
    flexWrap: "wrap",
  },

  outletBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },

  primaryBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  acceptBtn: {
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 6,
    alignItems: "center",
  },

  rejectBtn: {
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 6,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
});