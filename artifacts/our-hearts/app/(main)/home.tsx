import React, { useCallback } from "react"; 
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import {
  getGetMoodsQueryKey,
  getGetDailyNotesQueryKey,
  getMoods,
  setMood as apiSetMood,
  getDailyNotes,
} from "@workspace/api-client-react";

const MOODS = [
  { key: "happy", label: "Happy", emoji: "😊" },
  { key: "missing", label: "Missing You", emoji: "💭" },
  { key: "loving", label: "Loving", emoji: "💕" },
  { key: "sad", label: "Sad", emoji: "😢" },
  { key: "excited", label: "Excited", emoji: "⚡" },
];

function daysCount(startDate: string): { days: number; months: number; years: number } {
  const start = new Date(startDate);
  const now = new Date();
  const ms = now.getTime() - start.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  return { days, months, years };
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, couple, logout } = useAuth();
  const qc = useQueryClient();

  const moodsQ = useQuery({
    queryKey: getGetMoodsQueryKey(),
    queryFn: getMoods,
    refetchInterval: 15000,
  });

  const notesQ = useQuery({
    queryKey: getGetDailyNotesQueryKey(),
    queryFn: getDailyNotes,
    refetchInterval: 30000,
  });

  const moodMut = useMutation({
    mutationFn: (mood: string) => apiSetMood({ mood }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetMoodsQueryKey() });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getGetMoodsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetDailyNotesQueryKey() }),
    ]);
  }, [qc]);

  const counter = couple ? daysCount(couple.startDate) : null;
  const myMood = moodsQ.data?.find((m) => m.userId === user?.id);
  const partnerMood = moodsQ.data?.find((m) => m.userId !== user?.id);
  const todayNotes = notesQ.data ?? [];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      paddingTop: insets.top + 20 + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: 120 + insets.bottom + (Platform.OS === "web" ? 34 : 0),
      paddingHorizontal: 20,
    },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    greeting: { fontSize: 22, fontFamily: "Nunito_800ExtraBold", color: colors.foreground },
    greetingSub: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, marginTop: 2 },
    logoutBtn: { padding: 8 },
    counterCard: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 24,
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 8,
    },
    counterLabel: { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: "rgba(255,255,255,0.75)", marginBottom: 4, letterSpacing: 0.5 },
    counterMain: { fontSize: 54, fontFamily: "Nunito_800ExtraBold", color: "#FFFFFF", lineHeight: 60 },
    counterDaysLabel: { fontSize: 16, fontFamily: "Nunito_600SemiBold", color: "rgba(255,255,255,0.85)" },
    counterRow: { flexDirection: "row", gap: 20, marginTop: 12 },
    counterSub: { fontSize: 14, fontFamily: "Nunito_400Regular", color: "rgba(255,255,255,0.75)" },
    sectionTitle: { fontSize: 13, fontFamily: "Nunito_700Bold", color: colors.mutedForeground, marginBottom: 12, letterSpacing: 0.6, textTransform: "uppercase" },
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    moodRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    moodBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    moodBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    moodBtnText: { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: colors.foreground },
    moodBtnTextActive: { color: "#FFFFFF" },
    partnerMoodRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
    avatarDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 13, fontFamily: "Nunito_700Bold", color: "#FFFFFF" },
    partnerMoodText: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.foreground },
    partnerMoodBold: { fontFamily: "Nunito_700Bold", color: colors.primary },
    noteCard: {
      backgroundColor: colors.softPink,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteAuthor: { fontSize: 12, fontFamily: "Nunito_700Bold", color: colors.primary, marginBottom: 4 },
    noteText: { fontSize: 15, fontFamily: "Nunito_400Regular", color: colors.foreground, lineHeight: 22 },
    emptyText: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, textAlign: "center", paddingVertical: 8 },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.displayName} {"💝"}</Text>
          <Text style={styles.greetingSub}>
            {couple ? `Together with ${couple.partner.displayName}` : "Waiting for partner..."}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
          }}
          activeOpacity={0.6}
        >
          <Feather name="log-out" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {counter && (
        <View style={styles.counterCard}>
          <Text style={styles.counterLabel}>Days Together</Text>
          <Text style={styles.counterMain}>{counter.days}</Text>
          <Text style={styles.counterDaysLabel}>days of love</Text>
          <View style={styles.counterRow}>
            <Text style={styles.counterSub}>{counter.months} months  •  {counter.years} {counter.years === 1 ? "year" : "years"}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Mood Today</Text>
      <View style={styles.card}>
        <Text style={{ fontSize: 13, fontFamily: "Nunito_600SemiBold", color: colors.mutedForeground, marginBottom: 10 }}>How are you feeling?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => {
            const isActive = myMood?.mood === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.moodBtn, isActive && styles.moodBtnActive]}
                onPress={() => moodMut.mutate(m.key)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
                <Text style={[styles.moodBtnText, isActive && styles.moodBtnTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {partnerMood && (
          <View style={styles.partnerMoodRow}>
            <View style={[styles.avatarDot, { backgroundColor: couple?.partner.avatarColor ?? colors.primary }]}>
              <Text style={styles.avatarText}>{couple?.partner.displayName?.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.partnerMoodText}>
              <Text style={styles.partnerMoodBold}>{couple?.partner.displayName}</Text>
              {" is "}
              <Text style={styles.partnerMoodBold}>{MOODS.find((m) => m.key === partnerMood.mood)?.label ?? partnerMood.mood}</Text>
              {"  "}{MOODS.find((m) => m.key === partnerMood.mood)?.emoji}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Today's Love Notes</Text>
      {notesQ.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : todayNotes.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>No love notes today yet — send one from the Journal tab</Text>
        </View>
      ) : (
        todayNotes.map((n) => (
          <View key={n.id} style={styles.noteCard}>
            <Text style={styles.noteAuthor}>{n.displayName}</Text>
            <Text style={styles.noteText}>{n.content}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
