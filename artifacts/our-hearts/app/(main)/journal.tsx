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
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from "@workspace/api-client-react";
import type { JournalEntry } from "@workspace/api-client-react";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
    "  " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DiaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, couple } = useAuth();
  const qc = useQueryClient();

  const [activeSide, setActiveSide] = useState<"me" | "partner">("me");
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [content, setContent] = useState("");

  const journalQ = useQuery({
    queryKey: getGetJournalEntriesQueryKey(),
    queryFn: getJournalEntries,
    refetchInterval: 5000,
  });

  const createMut = useMutation({
    mutationFn: (c: string) => createJournalEntry({ content: c }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
      closeModal();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, content: c }: { id: number; content: string }) =>
      updateJournalEntry(id, { content: c }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
      closeModal();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteJournalEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() }),
  });

  const openNew = () => {
    setEditingEntry(null);
    setContent("");
    setShowModal(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setContent(entry.content);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setContent("");
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    if (editingEntry) {
      updateMut.mutate({ id: editingEntry.id, content: content.trim() });
    } else {
      createMut.mutate(content.trim());
    }
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert("Delete entry?", "This cannot be undone", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteMut.mutate(entry.id);
        },
      },
    ]);
  };

  const allEntries = journalQ.data ?? [];
  const myEntries = allEntries.filter((e) => e.userId === user?.id);
  const partnerEntries = allEntries.filter((e) => e.userId !== user?.id);
  const shownEntries = activeSide === "me" ? myEntries : partnerEntries;
  const isViewingOwn = activeSide === "me";

  const myName = user?.displayName ?? "You";
  const partnerName = couple?.partner.displayName ?? "Partner";
  const myColor = user?.avatarColor ?? colors.primary;
  const partnerColor = couple?.partner.avatarColor ?? colors.accent;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: insets.top + 20 + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: 12,
    },
    title: { fontSize: 28, fontFamily: "Nunito_800ExtraBold", color: colors.foreground, marginBottom: 4 },
    subtitle: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, marginBottom: 16 },

    // Split selector
    selectorWrap: {
      flexDirection: "row",
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 4,
    },
    selectorBtn: {
      flex: 1,
      paddingVertical: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    selectorBtnActive: { backgroundColor: colors.primary },
    selectorBtnInactive: { backgroundColor: "transparent" },
    selectorDivider: { width: 1.5, backgroundColor: colors.primary },
    selectorText: {
      fontSize: 14,
      fontFamily: "Nunito_700Bold",
    },
    selectorTextActive: { color: "#fff" },
    selectorTextInactive: { color: colors.primary },

    readOnlyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    readOnlyText: { fontSize: 12, fontFamily: "Nunito_400Regular", color: colors.mutedForeground },

    list: {
      paddingHorizontal: 20,
      paddingBottom: 120 + insets.bottom + (Platform.OS === "web" ? 34 : 0),
    },
    entryCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    entryHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    avatarDot: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarTxt: { fontSize: 12, fontFamily: "Nunito_700Bold", color: "#fff" },
    authorName: { fontSize: 13, fontFamily: "Nunito_700Bold", color: colors.foreground },
    date: { fontSize: 11, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, marginTop: 1 },
    entryText: {
      fontSize: 15,
      fontFamily: "Nunito_400Regular",
      color: colors.foreground,
      lineHeight: 23,
    },
    actionBtns: { flexDirection: "row", gap: 8 },
    iconBtn: { padding: 4 },

    emptyContainer: { alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
    emptyText: {
      fontSize: 15,
      fontFamily: "Nunito_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 22,
      marginTop: 14,
    },

    // FAB
    fab: {
      position: "absolute",
      right: 20,
      bottom: 90 + insets.bottom + (Platform.OS === "web" ? 34 : 0),
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },

    // Modal
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: insets.bottom + 24 + (Platform.OS === "web" ? 34 : 0),
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: "Nunito_800ExtraBold",
      color: colors.foreground,
      marginBottom: 16,
    },
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

  const avatarColor = activeSide === "me" ? myColor : partnerColor;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diary</Text>
        <Text style={styles.subtitle}>Private thoughts, shared together</Text>

        {/* Split selector */}
        <View style={styles.selectorWrap}>
          <TouchableOpacity
            style={[styles.selectorBtn, activeSide === "me" ? styles.selectorBtnActive : styles.selectorBtnInactive]}
            onPress={() => { setActiveSide("me"); Haptics.selectionAsync(); }}
            activeOpacity={0.85}
          >
            <Text style={[styles.selectorText, activeSide === "me" ? styles.selectorTextActive : styles.selectorTextInactive]}>
              {myName}
            </Text>
          </TouchableOpacity>
          <View style={styles.selectorDivider} />
          <TouchableOpacity
            style={[styles.selectorBtn, activeSide === "partner" ? styles.selectorBtnActive : styles.selectorBtnInactive]}
            onPress={() => { setActiveSide("partner"); Haptics.selectionAsync(); }}
            activeOpacity={0.85}
          >
            <Text style={[styles.selectorText, activeSide === "partner" ? styles.selectorTextActive : styles.selectorTextInactive]}>
              {partnerName}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isViewingOwn && (
        <View style={styles.readOnlyBadge}>
          <Feather name="eye" size={12} color={colors.mutedForeground} />
          <Text style={styles.readOnlyText}>Read-only — {partnerName}'s diary</Text>
        </View>
      )}

      {journalQ.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shownEntries}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={[styles.list, shownEntries.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 44 }}>{"📖"}</Text>
              <Text style={styles.emptyText}>
                {isViewingOwn
                  ? "Your diary is empty\nTap + to write your first entry"
                  : `${partnerName} hasn't written anything yet`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isOwn = item.userId === user?.id;
            const dotColor = isOwn ? myColor : partnerColor;
            return (
              <View style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.authorRow}>
                    <View style={[styles.avatarDot, { backgroundColor: dotColor }]}>
                      <Text style={styles.avatarTxt}>{item.displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.authorName}>{item.displayName}</Text>
                      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </View>
                  {isOwn && (
                    <View style={styles.actionBtns}>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
                        <Feather name="edit-2" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
                        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <Text style={styles.entryText}>{item.content}</Text>
              </View>
            );
          }}
        />
      )}

      {isViewingOwn && (
        <TouchableOpacity
          style={styles.fab}
          onPress={openNew}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingEntry ? "Edit Entry" : "New Entry"}</Text>
            <TextInput
              style={styles.textArea}
              value={content}
              onChangeText={setContent}
              placeholder="Share what's in your heart..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
              activeOpacity={0.85}
            >
              {(createMut.isPending || updateMut.isPending) ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalBtnText}>{editingEntry ? "Save Changes" : "Save Entry"}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
