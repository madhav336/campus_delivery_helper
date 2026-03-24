import { View, Text, StyleSheet, Pressable } from "react-native";
import { DeliveryRequest } from "@/types/deliveryRequest";
import { acceptRequest } from "@/services/api";

interface RequestCardProps {
  request: DeliveryRequest;
  onDelete?: () => void;
  onEdit?: () => void;
  onRefresh?: () => void;
}

export default function RequestCard({
  request,
  onDelete,
  onEdit,
  onRefresh,
}: RequestCardProps) {

  const getColor = (outlet: string) => {
    if (outlet === "ANC 1") return "#f97316";
    if (outlet === "CP") return "#22c55e";
    if (outlet === "ANC 2") return "#3b82f6";
    return "#a855f7";
  };

  const handleAccept = async () => {
    try {
      await acceptRequest(request._id);
      alert("Accepted successfully ✅");
      onRefresh && onRefresh();
    } catch (err) {
      alert("Failed to accept request");
    }
  };

  return (
    <View
      style={[
        styles.card,
        { borderLeftWidth: 5, borderLeftColor: getColor(request.outlet) },
      ]}
    >
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <Text style={styles.item}>🍔 {request.itemDescription}</Text>
        <Text style={styles.fee}>₹{request.fee}</Text>
      </View>

      {/* DETAILS */}
      <View style={styles.detailsRow}>
        <Text style={styles.meta}>🏪 {request.outlet}</Text>
        <Text style={styles.meta}>🏠 {request.hostel}</Text>
      </View>

      {/* ACTION ROW */}
      <View style={styles.actionRow}>
        <View style={styles.leftButtons}>
          {onEdit && (
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [
                styles.editButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.editText}>✏️ Edit</Text>
            </Pressable>
          )}

          {onDelete && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.deleteText}>🗑 Delete</Text>
            </Pressable>
          )}
        </View>

        {request.status === "OPEN" ? (
          <Pressable
            onPress={handleAccept}
            style={({ pressed }) => [
              styles.acceptButton,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Text style={styles.acceptText}>⚡ Accept</Text>
          </Pressable>
        ) : (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✔ {request.status}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,

    elevation: 3,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  item: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  fee: {
    fontSize: 15,
    fontWeight: "700",
    color: "#16a34a",
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  meta: {
    fontSize: 13,
    color: "#6b7280",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },

  leftButtons: {
    flexDirection: "row",
  },

  editButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    marginRight: 8,
  },

  editText: {
    color: "#4f46e5",
    fontWeight: "600",
  },

  deleteButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
  },

  deleteText: {
    color: "#dc2626",
    fontWeight: "600",
  },

  acceptButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  acceptText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  statusBadge: {
    backgroundColor: "#dcfce7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  statusText: {
    color: "#15803d",
    fontWeight: "700",
    fontSize: 12,
  },
});