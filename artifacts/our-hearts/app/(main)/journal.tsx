import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import {
  getGetJournalEntriesQueryKey,
  getGetDailyNotesQueryKey,
  getJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
  getDailyNotes,
  createDailyNote,
} from "@workspace/api-client-react";
import type { JournalEntry } from "@workspace/api-client-react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, couple } = useAuth();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [isDailyNote, setIsDailyNote] = useState(false);
  const [content, setContent] = useState("");

  const journalQ = useQuery({
    queryKey: getGetJournalEntriesQueryKey(),
    queryFn: getJournalEntries,
  });

  const dailyQ = useQuery({
    queryKey: getGetDailyNotesQueryKey(),
    queryFn: getDailyNotes,
  });

  const createMut = useMutation({
    mutationFn: (c: string) => createJournalEntry({ content: c }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
      setShowModal(false);
      setContent("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const dailyNoteMut = useMutation({
    mutationFn: (c: string) => createDailyNote({ content: c }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetDailyNotesQueryKey() });
      setShowModal(false);
      setContent("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => {
      Alert.alert("Already sent", e?.data?.error ?? "You've already sent today's love note");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteJournalEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() }),
  });

  const openNew = (daily: boolean) => {
    setIsDailyNote(daily);
    setContent("");
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    if (isDailyNote) dailyNoteMut.mutate(content.trim());
    else createMut.mutate(content.trim());
  };

  const handleDelete = (entry: JournalEntry) => {
    if (entry.userId !== user?.id) {
      Alert.alert("Cannot delete", "You can only delete your own entries");
      return;
    }
    Alert.alert("Delete entry?", "This cannot be undone", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(entry.id) },
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: insets.top + 20 + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: 16,
    },
    title: { fontSize: 28, fontFamily: "Nunito_800ExtraBold", color: colors.foreground },
    subtitle: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, marginTop: 2 },
    actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
    actionBtn: {
      flex: 1,
      borderRadius: 14,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    primaryBtn: { backgroundColor: colors.primary },
    secondaryBtn: { backgroundColor: colors.secondary },
    primaryBtnText: { fontSize: 14, fontFamily: "Nunito_700Bold", color: "#fff" },
    secondaryBtnText: { fontSize: 14, fontFamily: "Nunito_700Bold", color: colors.primary },
    list: { paddingHorizontal: 20, paddingBottom: 120 + insets.bottom + (Platform.OS === "web" ? 34 : 0) },
    entryCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    avatarDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    avatarTxt: { fontSize: 11, fontFamily: "Nunito_700Bold", color: "#fff" },
    authorName: { fontSize: 13, fontFamily: "Nunito_700Bold", color: colors.foreground },
    date: { fontSize: 11, fontFamily: "Nunito_400Regular", color: colors.mutedForeground },
    entryText: { fontSize: 15, fontFamily: "Nunito_400Regular", color: colors.foreground, lineHeight: 23 },
    deleteBtn: { padding: 4 },
    emptyContainer: { alignItems: "center", padding: 40 },
    emptyText: { fontSize: 15, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, textAlign: "center" },
    // Modal
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: insets.bottom + 24 + (Platform.OS === "web" ? 34 : 0),
    },
    modalTitle: { fontSize: 20, fontFamily: "Nunito_800ExtraBold", color: colors.foreground, marginBottom: 16 },
    textArea: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: 16,
      fontSize: 16,
      fontFamily: "Nunito_400Regular",
      color: colors.foreground,
      minHeight: 140,
      textAlignVertical: "top",
      marginBottom: 16,
    },
    modalBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    modalBtnText: { fontSize: 16, fontFamily: "Nunito_700Bold", color: "#fff" },
    cancelBtn: { alignItems: "center", marginTop: 12 },
    cancelText: { fontSize: 15, fontFamily: "Nunito_400Regular", color: colors.mutedForeground },
  });

  const entries = journalQ.data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>Share your feelings with each other</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => openNew(false)} activeOpacity={0.85}>
            <Feather name="edit-3" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Write Feeling</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => openNew(true)} activeOpacity={0.85}>
            <Feather name="heart" size={16} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>Love Note</Text>
          </TouchableOpacity>
        </View>
      </View>

      {journalQ.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={[styles.list, entries.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="book-open" size={48} color={colors.border} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>Your journal is empty{"\n"}Write your first feeling</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.userId === user?.id;
            return (
              <View style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.authorRow}>
                    <View style={[styles.avatarDot, { backgroundColor: isMe ? (user?.avatarColor ?? colors.primary) : (couple?.partner.avatarColor ?? colors.accent) }]}>
                      <Text style={styles.avatarTxt}>{item.displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.authorName}>{item.displayName}</Text>
                      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </View>
                  {isMe && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                      <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.entryText}>{item.content}</Text>
              </View>
            );
          }}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isDailyNote ? "Today's Love Note" : "Write a Feeling"}</Text>
            <TextInput
              style={styles.textArea}
              value={content}
              onChangeText={setContent}
              placeholder={isDailyNote ? "Write something heartfelt for today..." : "Share what's in your heart..."}
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleSubmit}
              disabled={createMut.isPending || dailyNoteMut.isPending}
              activeOpacity={0.85}
            >
              {(createMut.isPending || dailyNoteMut.isPending) ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalBtnText}>{isDailyNote ? "Send Love Note" : "Save Entry"}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
