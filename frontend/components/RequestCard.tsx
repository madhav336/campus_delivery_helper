import { View, Text, StyleSheet, Pressable } from "react-native";
import { DeliveryRequest } from "@/types/deliveryRequest";
import { useTheme } from "@/context/ThemeContext";

interface RequestCardProps {
  request: DeliveryRequest;
  onDelete?: () => void;
  onEdit?: () => void;
  onAccept?: () => void;
  onComplete?: () => void;
}

export default function RequestCard({
  request,
  onDelete,
  onEdit,
  onAccept,
  onComplete,
}: RequestCardProps) {
  const { theme } = useTheme();

  const getColor = (outlet: string) =>
    theme.outletColors?.[outlet] || theme.primary;

  const accent = getColor(request.outlet);

  // ✅ FORCE SAFE STATUS (THIS FIXES YOUR ISSUE)
  const status =
    request.status === "COMPLETED" ? "COMPLETED" : "OPEN";

  const getInitials = (text: string) => {
    const words = text.split(" ");
    if (words.length === 1) return words[0][0];
    return words[0][0] + words[1][0];
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.left}>
            <View
              style={[
                styles.initialCircle,
                { backgroundColor: accent + "20" },
              ]}
            >
              <Text style={[styles.initialText, { color: accent }]}>
                {getInitials(request.itemDescription).toUpperCase()}
              </Text>
            </View>

            <View>
              <Text style={[styles.title, { color: theme.text }]}>
                {request.itemDescription}
              </Text>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: accent + "15" },
                ]}
              >
                <Text style={{ color: accent, fontSize: 12 }}>
                  {request.outlet}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.price, { color: accent }]}>
            ₹{request.fee}
          </Text>
        </View>

        <Text style={[styles.sub, { color: theme.subtext }]}>
          Deliver to {request.hostel}
        </Text>

        <View style={styles.actions}>
          <View style={styles.leftActions}>
            {onEdit && (
              <Pressable style={styles.secondaryBtn} onPress={onEdit}>
                <Text style={styles.secondaryText}>Edit</Text>
              </Pressable>
            )}

            {onDelete && (
              <Pressable style={styles.deleteBtn} onPress={onDelete}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            )}
          </View>

          {/* ✅ ONLY CHANGE IS HERE */}
          <View style={{ flexDirection: "row" }}>
            {status === "OPEN" && (
              <Pressable
                style={[
                  styles.primaryBtn,
                  { backgroundColor: accent, marginRight: 8 },
                ]}
                onPress={onAccept} // 👉 THIS WILL TURN INTO COMPLETED
              >
                <Text style={styles.primaryText}>Accept</Text>
              </Pressable>
            )}

            {status === "COMPLETED" && (
              <Text style={{ color: theme.subtext, fontWeight: "600" }}>
                ✔ Completed
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },

  accent: {
    width: 5,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },

  content: {
    padding: 16,
    paddingLeft: 20,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  initialCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  initialText: {
    fontWeight: "700",
    fontSize: 14,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  price: {
    fontSize: 16,
    fontWeight: "700",
  },

  sub: {
    marginTop: 10,
    fontSize: 13,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    alignItems: "center",
  },

  leftActions: {
    flexDirection: "row",
  },

  secondaryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    marginRight: 8,
  },

  secondaryText: {
    color: "#4f46e5",
    fontWeight: "600",
  },

  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
  },

  deleteText: {
    color: "#dc2626",
    fontWeight: "600",
  },

  primaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
});