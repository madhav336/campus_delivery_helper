import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { getRequests } from "@/services/api";
import { DeliveryRequest } from "@/types/deliveryRequest";
import RequestCard from "@/components/RequestCard";

export default function RequestsScreen() {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "fee">("newest");
  const [filterOutlet, setFilterOutlet] =
    useState<"ALL" | "ANC 1" | "ANC 2" | "CP" | "Other">("ALL");

  const [searchQuery, setSearchQuery] = useState("");


const searchedRequests = requests.filter((r) => {
  const query = searchQuery.toLowerCase();
  return (
    r.item.toLowerCase().includes(query) ||
    r.outlet.toLowerCase().includes(query)
  );
});

const filteredRequests =
  filterOutlet === "ALL"
    ? searchedRequests
    : searchedRequests.filter((r) => r.outlet === filterOutlet);



    const sortedRequests = [...filteredRequests].sort((a, b) => {
      if (sortBy === "fee") {
        return b.fee - a.fee;
      }

      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    });

  useEffect(() => {
    getRequests()
      .then((data) => {
        setRequests(data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading requests...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Delivery Requests</Text>
        <Text>Something went wrong. Please try again.</Text>
      </View>
    );
  }
  if (requests.length === 0) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Requests</Text>
      <Text>No delivery requests yet.</Text>
    </View>
  );
}
  const groupedRequests = {
    "ANC 1": sortedRequests.filter((r) => r.outlet === "ANC 1"),
    "ANC 2": sortedRequests.filter((r) => r.outlet === "ANC 2"),
    CP: sortedRequests.filter((r) => r.outlet === "CP"),
    Other: sortedRequests.filter((r) => r.outlet === "Other"),
  };

  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Requests</Text>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by item or outlet"
        style={styles.searchInput}
      />


      <View style={styles.sortControls}>
        <Pressable
          onPress={() => setSortBy("newest")}
          style={[
            styles.sortButton,
            sortBy === "newest" && styles.activeSortButton,
          ]}
        >
          <Text>Newest</Text>
        </Pressable>

        <Pressable
          onPress={() => setSortBy("fee")}
          style={[
            styles.sortButton,
            sortBy === "fee" && styles.activeSortButton,
          ]}
        >
          <Text>Fee</Text>
        </Pressable>
      </View>

      <View style={styles.filterControls}>
        {["ALL", "ANC 1", "ANC 2", "CP", "Other"].map((outlet) => (
          <Pressable
            key={outlet}
            onPress={() =>
              setFilterOutlet(outlet as typeof filterOutlet)
            }
            style={[
              styles.filterButton,
              filterOutlet === outlet && styles.activeFilterButton,
            ]}
          >
            <Text>{outlet}</Text>
          </Pressable>
        ))}
      </View>


      {Object.entries(groupedRequests).map(([hostel, hostelRequests]) => {
        if (hostelRequests.length === 0) return null;

        return (
          <View key={hostel} style={styles.section}>
            <Text style={styles.sectionTitle}>{hostel}</Text>

            {hostelRequests.map((item) => (
              <RequestCard key={item.id} request={item} />
            ))}
          </View>
      );
    })}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sortControls: {
  flexDirection: "row",
  marginBottom: 16,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: "#eee",
  },
  filterControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterButton: {
    backgroundColor: "#eee",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
});