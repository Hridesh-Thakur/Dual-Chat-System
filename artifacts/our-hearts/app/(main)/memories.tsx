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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import {
  getGetMemoriesQueryKey,
  getMemories,
  createMemory,
  deleteMemory,
} from "@workspace/api-client-react";
import type { Memory } from "@workspace/api-client-react";

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

export default function MemoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, couple } = useAuth();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memoryDate, setMemoryDate] = useState(() => new Date().toISOString().split("T")[0] ?? "");

  const memoriesQ = useQuery({
    queryKey: getGetMemoriesQueryKey(),
    queryFn: getMemories,
  });

  const createMut = useMutation({
    mutationFn: () => createMemory({ data: { title: title.trim(), description: description.trim(), memoryDate } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetMemoriesQueryKey() });
      setShowModal(false);
      setTitle("");
      setDescription("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => Alert.alert("Error", e?.data?.error ?? "Failed to save memory"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMemory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: getGetMemoriesQueryKey() }),
  });

  const handleDelete = (m: Memory) => {
    Alert.alert("Delete memory?", "This cannot be undone", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(m.id) },
    ]);
  };

  const memories = memoriesQ.data ?? [];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: insets.top + 20 + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    titleBlock: { flex: 1 },
    title: { fontSize: 28, fontFamily: "Nunito_800ExtraBold", color: colors.foreground },
    subtitle: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, marginTop: 2 },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
    list: { paddingHorizontal: 20, paddingBottom: 120 + insets.bottom + (Platform.OS === "web" ? 34 : 0) },
    timelineItem: { flexDirection: "row", marginBottom: 20 },
    timelineLine: { width: 2, backgroundColor: colors.border, alignSelf: "stretch", marginRight: 16, marginLeft: 8 },
    timelineDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      position: "absolute",
      left: 1,
      top: 20,
      borderWidth: 2,
      borderColor: colors.background,
    },
    memoryCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    memoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
    memoryTitle: { fontSize: 17, fontFamily: "Nunito_700Bold", color: colors.foreground, flex: 1, marginRight: 8 },
    deleteBtn: { padding: 4 },
    memoryDate: { fontSize: 12, fontFamily: "Nunito_600SemiBold", color: colors.primary, marginBottom: 8 },
    memoryDesc: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.foreground, lineHeight: 21 },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
    avatarDot: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    avatarTxt: { fontSize: 9, fontFamily: "Nunito_700Bold", color: "#fff" },
    authorName: { fontSize: 12, fontFamily: "Nunito_400Regular", color: colors.mutedForeground },
    emptyContainer: { alignItems: "center", padding: 40, flex: 1 },
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
    label: { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: colors.foreground, marginBottom: 6 },
    inputWrap: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    input: { height: 48, fontSize: 15, fontFamily: "Nunito_400Regular", color: colors.foreground },
    textArea: {
      minHeight: 90,
      padding: 14,
      fontSize: 15,
      fontFamily: "Nunito_400Regular",
      color: colors.foreground,
      textAlignVertical: "top",
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Memories</Text>
          <Text style={styles.subtitle}>{memories.length} moment{memories.length !== 1 ? "s" : ""} together</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Feather name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {memoriesQ.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={[styles.list, memories.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="camera" size={48} color={colors.border} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>No memories yet{"\n"}Start adding special moments</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.createdByUserId === user?.id;
            return (
              <View style={styles.timelineItem}>
                <View style={{ width: 32, position: "relative" }}>
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineDot} />
                </View>
                <View style={styles.memoryCard}>
                  <View style={styles.memoryHeader}>
                    <Text style={styles.memoryTitle}>{item.title}</Text>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                      <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.memoryDate}>{formatDate(item.memoryDate)}</Text>
                  <Text style={styles.memoryDesc}>{item.description}</Text>
                  <View style={styles.authorRow}>
                    <View style={[styles.avatarDot, { backgroundColor: isMe ? (user?.avatarColor ?? colors.primary) : (couple?.partner.avatarColor ?? colors.accent) }]}>
                      <Text style={styles.avatarTxt}>{item.displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.authorName}>added by {item.displayName}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add a Memory</Text>

            <Text style={styles.label}>Title</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Our first date"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={memoryDate}
                onChangeText={setMemoryDate}
                placeholder="e.g. 2024-02-14"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputWrap, { paddingHorizontal: 0 }]}>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe this special moment..."
                placeholderTextColor={colors.mutedForeground}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => createMut.mutate()}
              disabled={createMut.isPending || !title.trim() || !description.trim()}
              activeOpacity={0.85}
            >
              {createMut.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalBtnText}>Save Memory</Text>
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
