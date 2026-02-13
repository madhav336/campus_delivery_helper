import { View, Text, StyleSheet } from "react-native";
import { DeliveryRequest } from "@/types/deliveryRequest";

interface RequestCardProps {
  request: DeliveryRequest;
}

export default function RequestCard({ request }: RequestCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.item}>{request.item}</Text>
      <Text>{request.outlet}</Text>
      <Text>₹{request.fee}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  item: {
    fontWeight: "600",
  },
});