import { View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import GradientButton from '@/components/ui/GradientButton';
import { auth } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { theme, setUserRole } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password required');
      return;
    }

    setLoading(true);
    try {
      const result = await auth.login(email, password);
      // Update the ThemeContext with the new user role
      setUserRole(result.user.role);
      Alert.alert('Success', 'Logged in!');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={theme.subtext}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.subtext}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={[styles.passwordInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={theme.primary}
            />
          </Pressable>
        </View>

        <GradientButton title={loading ? "Logging in..." : "Login"} onPress={handleLogin} />

        <Pressable onPress={() => router.push('/(auth)/signup')}>
          <Text style={[styles.link, { color: theme.primary }]}>Don't have an account? Sign Up</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  passwordContainer: { position: 'relative', marginBottom: 16 },
  passwordInput: { borderWidth: 1, borderRadius: 10, padding: 14, paddingRight: 50, fontSize: 16 },
  eyeButton: { position: 'absolute', right: 15, top: '50%', transform: [{ translateY: -10 }] },
  link: { textAlign: 'center', marginTop: 20, fontWeight: '600' }
});
