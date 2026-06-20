import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  Alert,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { joinCouple } from "@workspace/api-client-react";

export default function PairScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshCouple, refreshUser } = useAuth();

  // Poll every 5 s so device 2 auto-navigates when device 1 pairs them
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      await refreshUser();
      await refreshCouple();
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshUser, refreshCouple]);
  const [partnerCode, setPartnerCode] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0] ?? "";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shareCode = async () => {
    await Share.share({
      message: `Join me on Our Hearts! Use my invite code: ${user?.inviteCode ?? ""}`,
    });
  };

  const handlePair = async () => {
    if (!partnerCode.trim()) {
      setError("Enter your partner's invite code");
      return;
    }
    if (!startDate) {
      setError("Pick your anniversary date");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await joinCouple({ partnerInviteCode: partnerCode.trim().toUpperCase(), startDate });
      await refreshUser();
      await refreshCouple();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.data?.error ?? "Could not pair. Check the invite code.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 28,
      paddingTop: insets.top + 32 + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: insets.bottom + 32 + (Platform.OS === "web" ? 34 : 0),
    },
    heartBig: { fontSize: 60, textAlign: "center", marginBottom: 16 },
    title: { fontSize: 28, fontFamily: "Nunito_800ExtraBold", color: colors.primary, textAlign: "center", marginBottom: 8 },
    subtitle: { fontSize: 15, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, textAlign: "center", marginBottom: 36 },
    sectionTitle: { fontSize: 13, fontFamily: "Nunito_700Bold", color: colors.mutedForeground, marginBottom: 10, letterSpacing: 0.8, textTransform: "uppercase" },
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    codeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    myCode: { fontSize: 28, fontFamily: "Nunito_800ExtraBold", color: colors.primary, letterSpacing: 4 },
    shareBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.secondary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 6,
    },
    shareBtnText: { fontSize: 14, fontFamily: "Nunito_700Bold", color: colors.primary },
    label: { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: colors.foreground, marginBottom: 8 },
    inputWrap: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 14,
      marginBottom: 16,
    },
    input: { height: 50, fontSize: 16, fontFamily: "Nunito_600SemiBold", color: colors.foreground, letterSpacing: 2 },
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
    },
    btnText: { fontSize: 17, fontFamily: "Nunito_700Bold", color: "#FFFFFF" },
    logoutBtn: { marginTop: 20, alignItems: "center" },
    logoutText: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.mutedForeground },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.heartBig}>💝</Text>
      <Text style={styles.title}>Connect with Partner</Text>
      <Text style={styles.subtitle}>Share your code and enter theirs to begin</Text>

      <Text style={styles.sectionTitle}>Your Invite Code</Text>
      <View style={styles.card}>
        <View style={styles.codeRow}>
          <Text style={styles.myCode}>{user?.inviteCode ?? "---"}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={shareCode}>
            <Feather name="share-2" size={16} color={colors.primary} />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Partner's Code</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Their invite code</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={partnerCode}
            onChangeText={(t) => setPartnerCode(t.toUpperCase())}
            placeholder="e.g. ABC123"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            maxLength={8}
          />
        </View>

        <Text style={styles.label}>Your anniversary date</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
          />
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.btn} onPress={handlePair} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Connect Together</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
