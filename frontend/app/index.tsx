import { Redirect } from 'expo-router';

export default function Index() {
  // Always redirect to login - no token validation
  return <Redirect href="/(auth)/login" />;
}