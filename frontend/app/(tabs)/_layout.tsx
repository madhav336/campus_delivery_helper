import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="requests"
        options={{ title: "Requests" }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: "Create" }}
      />
    </Tabs>
  );
}