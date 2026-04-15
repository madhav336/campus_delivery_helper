import { View, Text, TextInput, Pressable, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import GradientButton from '@/components/ui/GradientButton';
import { auth } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const { theme, setUserRole } = useTheme();
  const [role, setRole] = useState<'student' | 'outlet_owner'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [hostel, setHostel] = useState('');
  const [outletName, setOutletName] = useState('');
  const [outletLocation, setOutletLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert('Validation', 'Fill all required fields');
      return;
    }

    if (role === 'student' && !hostel) {
      Alert.alert('Validation', 'Hostel is required for students');
      return;
    }

    if (role === 'outlet_owner' && (!outletName || !outletLocation)) {
      Alert.alert('Validation', 'Outlet details are required');
      return;
    }

    setLoading(true);
    try {
      const result = await auth.signup(role, {
        name,
        email,
        password,
        phone,
        ...(role === 'student' ? { hostel } : { outletName, outletLocation })
      });
      // Update the ThemeContext with the new user role
      setUserRole(result.user.role);
      Alert.alert('Success', 'Account created! Logging in...');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>

        {/* Role Selection */}
        <View style={styles.roleSelector}>
          {['student', 'outlet_owner'].map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r as any)}
              style={[
                styles.roleBtn,
                {
                  backgroundColor: role === r ? theme.primary : theme.card,
                  borderColor: theme.border
                }
              ]}
            >
              <Text style={{ color: role === r ? '#fff' : theme.text, fontWeight: '600' }}>
                {r === 'student' ? 'Student' : 'Outlet Owner'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Common Fields */}
        <TextInput
          placeholder="Full Name"
          placeholderTextColor={theme.subtext}
          value={name}
          onChangeText={setName}
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
        />

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

        <TextInput
          placeholder="Phone Number"
          placeholderTextColor={theme.subtext}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
        />

        {/* Role-Specific Fields */}
        {role === 'student' ? (
          <TextInput
            placeholder="Hostel/Residence"
            placeholderTextColor={theme.subtext}
            value={hostel}
            onChangeText={setHostel}
            style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
          />
        ) : (
          <>
            <TextInput
              placeholder="Outlet Name"
              placeholderTextColor={theme.subtext}
              value={outletName}
              onChangeText={setOutletName}
              style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
            />
            <TextInput
              placeholder="Outlet Location"
              placeholderTextColor={theme.subtext}
              value={outletLocation}
              onChangeText={setOutletLocation}
              style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
            />
          </>
        )}

        <GradientButton title={loading ? "Creating..." : "Create Account"} onPress={handleSignup} />

        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={[styles.link, { color: theme.primary }]}>Already have an account? Login</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  roleSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  passwordContainer: { position: 'relative', marginBottom: 12 },
  passwordInput: { borderWidth: 1, borderRadius: 10, padding: 12, paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 15, top: '50%', transform: [{ translateY: -10 }] },
  link: { textAlign: 'center', marginTop: 16, fontWeight: '600' }
});
