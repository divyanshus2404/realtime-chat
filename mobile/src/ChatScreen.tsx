import { useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView,
} from "react-native";
import { useChat, ChatMessage } from "./useChat";
import { theme } from "./theme";

const ROOMS = ["general", "random", "tech"];

export function ChatScreen({ user, token }: { user: string; token: string }) {
  const [room, setRoom] = useState(ROOMS[0]);
  const { messages, online, typing, connected, send, notifyTyping } = useChat(token, user, room);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  function submit() {
    if (!text.trim()) return;
    send(text);
    setText("");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}># {room}</Text>
        <View style={styles.presence}>
          <View style={[styles.dot, { backgroundColor: connected ? theme.online : theme.muted }]} />
          <Text style={styles.presenceText}>{online.length} online</Text>
        </View>
      </View>

      <View style={styles.rooms}>
        {ROOMS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roomChip, r === room && styles.roomChipActive]}
            onPress={() => setRoom(r)}
          >
            <Text style={[styles.roomText, r === room && styles.roomTextActive]}># {r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.user === user;
            return (
              <View style={[styles.msg, mine && styles.msgMine]}>
                <Text style={styles.meta}>
                  {item.user} · {new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <View style={[styles.bubble, mine && styles.bubbleMine]}>
                  <Text style={mine ? styles.bubbleTextMine : styles.bubbleText}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />

        <Text style={styles.typing}>
          {typing.length > 0
            ? `${typing.join(", ")} ${typing.length === 1 ? "is" : "are"} typing…`
            : ""}
        </Text>

        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder={`Message #${room}`}
            placeholderTextColor={theme.muted}
            value={text}
            onChangeText={(t) => { setText(t); notifyTyping(); }}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={submit}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { color: theme.text, fontSize: 18, fontWeight: "700" },
  presence: { flexDirection: "row", alignItems: "center", gap: 6 },
  presenceText: { color: theme.muted, fontSize: 13 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  rooms: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  roomChip: { backgroundColor: theme.panel2, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  roomChipActive: { backgroundColor: theme.accent },
  roomText: { color: theme.muted, fontWeight: "600", fontSize: 13 },
  roomTextActive: { color: "#fff" },
  messages: { padding: 16, gap: 12 },
  msg: { maxWidth: "80%", alignSelf: "flex-start" },
  msgMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  meta: { color: theme.muted, fontSize: 11, marginBottom: 3 },
  bubble: { backgroundColor: theme.panel2, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14 },
  bubbleMine: { backgroundColor: theme.accent },
  bubbleText: { color: theme.text, fontSize: 15 },
  bubbleTextMine: { color: "#fff", fontSize: 15 },
  typing: { color: theme.muted, fontSize: 13, fontStyle: "italic", height: 20, paddingHorizontal: 16 },
  composer: { flexDirection: "row", gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: theme.border },
  composerInput: { flex: 1, backgroundColor: theme.panel2, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  sendBtn: { backgroundColor: theme.accent, borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
  sendText: { color: "#fff", fontWeight: "700" },
});
