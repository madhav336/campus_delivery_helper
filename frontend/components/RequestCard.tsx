import { View, Text, StyleSheet, Pressable } from "react-native";
import { DeliveryRequest } from "@/types/deliveryRequest";

interface RequestCardProps {
  request: DeliveryRequest;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function RequestCard({
  request,
  onDelete,
  onEdit,
}: RequestCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.item}>{request.itemDescription}</Text>
        <Text style={styles.fee}>₹{request.fee}</Text>
      </View>

      <Text style={styles.meta}>Outlet: {request.outlet}</Text>
      <Text style={styles.meta}>Hostel: {request.hostel}</Text>

      <View style={styles.actionRow}>
        {onEdit && (
          <Pressable onPress={onEdit} style={styles.editButton}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        )}

        {onDelete && (
          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  item: {
    fontSize: 16,
    fontWeight: "600",
  },
  fee: {
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#e5f0ff",
    borderRadius: 6,
    marginRight: 8,
  },
  editText: {
    color: "#0066cc",
    fontWeight: "600",
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#ffe5e5",
    borderRadius: 6,
  },
  deleteText: {
    color: "red",
    fontWeight: "600",
  },
});