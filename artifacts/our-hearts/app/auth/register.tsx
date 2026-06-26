import React, { useState } from "react"; 
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { registerUser } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!username.trim() || !displayName.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await registerUser({
        username: username.trim(),
        displayName: displayName.trim(),
        password,
        ...(inviteCode.trim() ? { inviteCode: inviteCode.trim().toUpperCase() } : {}),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.data?.error ?? "Registration failed");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: insets.bottom + 32 + (Platform.OS === "web" ? 34 : 0),
    },
    logo: { width: 64, height: 64, alignSelf: "center", marginBottom: 20, borderRadius: 16 },
    title: { fontSize: 30, fontFamily: "Nunito_800ExtraBold", color: colors.primary, textAlign: "center", marginBottom: 6 },
    subtitle: { fontSize: 15, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, textAlign: "center", marginBottom: 32 },
    label: { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: colors.foreground, marginBottom: 6 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 14,
      paddingHorizontal: 16,
    },
    input: { flex: 1, height: 50, fontSize: 15, fontFamily: "Nunito_400Regular", color: colors.foreground },
    hint: { fontSize: 12, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, marginTop: -10, marginBottom: 12, paddingLeft: 4 },
    optional: { fontSize: 12, fontFamily: "Nunito_400Regular", color: colors.mutedForeground },
    error: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.destructive, textAlign: "center", marginBottom: 12 },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
      marginTop: 4,
    },
    btnText: { fontSize: 17, fontFamily: "Nunito_700Bold", color: "#FFFFFF" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 6 },
    footerText: { fontSize: 15, fontFamily: "Nunito_400Regular", color: colors.mutedForeground },
    footerLink: { fontSize: 15, fontFamily: "Nunito_700Bold", color: colors.primary },
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image source={require("@/assets/images/icon.png")} style={styles.logo} />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your private love space</Text>

        <Text style={styles.label}>Your name (shown to partner)</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Sarah"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <Text style={styles.label}>Username</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Your invite code <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={inviteCode}
            onChangeText={(t) => setInviteCode(t.toUpperCase())}
            placeholder="e.g. VENUS07"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={10}
          />
        </View>
        <Text style={styles.hint}>Share this code with your partner so they can connect with you</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
