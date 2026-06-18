import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import {
  getGetMessagesQueryKey,
  getMessages,
  sendMessage,
} from "@workspace/api-client-react";
import type { Message } from "@workspace/api-client-react";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ message, isMe, colors }: { message: Message; isMe: boolean; colors: any }) {
  const styles = StyleSheet.create({
    row: {
      flexDirection: isMe ? "row-reverse" : "row",
      alignItems: "flex-end",
      marginBottom: 8,
      paddingHorizontal: 12,
    },
    avatarDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 6,
      backgroundColor: message.senderAvatarColor,
    },
    avatarText: { fontSize: 11, fontFamily: "Nunito_700Bold", color: "#fff" },
    bubble: {
      maxWidth: "72%",
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: isMe ? colors.bubbleMe : colors.bubblePartner,
      borderBottomRightRadius: isMe ? 4 : 18,
      borderBottomLeftRadius: isMe ? 18 : 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: isMe ? 0 : 1,
      borderColor: colors.border,
    },
    content: {
      fontSize: 15,
      fontFamily: "Nunito_400Regular",
      color: isMe ? colors.bubbleMeFg : colors.bubblePartnerFg,
      lineHeight: 21,
    },
    time: {
      fontSize: 11,
      fontFamily: "Nunito_400Regular",
      color: isMe ? "rgba(255,255,255,0.65)" : colors.mutedForeground,
      marginTop: 4,
      textAlign: isMe ? "right" : "left",
    },
  });

  return (
    <View style={styles.row}>
      {!isMe && (
        <View style={styles.avatarDot}>
          <Text style={styles.avatarText}>{message.senderDisplayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.bubble}>
        <Text style={styles.content}>{message.content}</Text>
        <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, couple } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const flatRef = useRef<FlatList>(null);

  const messagesQ = useQuery({
    queryKey: getGetMessagesQueryKey(),
    queryFn: () => getMessages(),
    refetchInterval: 3000,
  });

  const sendMut = useMutation({
    mutationFn: (content: string) => sendMessage({ data: { content } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sendMut.isPending) return;
    setText("");
    sendMut.mutate(trimmed);
  }, [text, sendMut]);

  const messages = messagesQ.data ?? [];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: insets.top + 12 + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    avatarGroup: { flexDirection: "row" },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
    avatar2: { marginLeft: -10 },
    avatarTxt: { fontSize: 13, fontFamily: "Nunito_700Bold", color: "#fff" },
    headerText: { flex: 1 },
    headerTitle: { fontSize: 16, fontFamily: "Nunito_800ExtraBold", color: colors.foreground },
    headerSub: { fontSize: 12, fontFamily: "Nunito_400Regular", color: colors.primary },
    listContent: {
      paddingTop: 12,
      paddingBottom: 12,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 12,
      paddingVertical: 10,
      paddingBottom: insets.bottom + 10 + (Platform.OS === "web" ? 34 : 0),
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    inputWrap: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 120,
    },
    input: {
      fontSize: 15,
      fontFamily: "Nunito_400Regular",
      color: colors.foreground,
      padding: 0,
    },
    sendBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 4,
    },
    sendBtnDisabled: { backgroundColor: colors.muted },
    emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
    emptyIcon: { marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontFamily: "Nunito_700Bold", color: colors.foreground, textAlign: "center", marginBottom: 8 },
    emptyText: { fontSize: 14, fontFamily: "Nunito_400Regular", color: colors.mutedForeground, textAlign: "center" },
  });

  const KAV = Platform.OS === "web" ? RNKeyboardAvoidingView : KeyboardAvoidingView;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarGroup}>
          <View style={[styles.avatar, { backgroundColor: user?.avatarColor ?? colors.primary }]}>
            <Text style={styles.avatarTxt}>{user?.displayName?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={[styles.avatar, styles.avatar2, { backgroundColor: couple?.partner.avatarColor ?? colors.accent }]}>
            <Text style={styles.avatarTxt}>{couple?.partner.displayName?.charAt(0).toUpperCase() ?? "?"}</Text>
          </View>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Our Chat</Text>
          <Text style={styles.headerSub}>
            {couple ? `${user?.displayName} & ${couple.partner.displayName}` : "Connecting..."}
          </Text>
        </View>
        {messagesQ.isFetching && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <KAV
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {messagesQ.isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={48} color={colors.border} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Start your conversation</Text>
            <Text style={styles.emptyText}>Send your first message to {couple?.partner.displayName ?? "your partner"}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={({ item }) => (
              <MessageBubble message={item} isMe={item.senderId === user?.id} colors={colors} />
            )}
            contentContainerStyle={styles.listContent}
            inverted
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!!messages.length}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={`Message ${couple?.partner.displayName ?? "your love"}...`}
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={2000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sendMut.isPending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sendMut.isPending}
            activeOpacity={0.8}
          >
            {sendMut.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KAV>
    </View>
  );
}
