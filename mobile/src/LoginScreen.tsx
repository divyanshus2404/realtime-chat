import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { SERVER_URL } from "./config";
import { theme } from "./theme";

export function LoginScreen({
  onLogin,
}: {
  onLogin: (user: string, token: string) => void;
}) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${SERVER_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: name.trim() }),
      });
      const data = await res.json();
      if (data.token) onLogin(data.user, data.token);
      else setErr(data.error ?? "login failed");
    } catch {
      setErr(`can't reach server at ${SERVER_URL}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.center}>
      <View style={styles.card}>
        <Text style={styles.title}>💬 Realtime Chat</Text>
        <Text style={styles.muted}>Pick a username to join.</Text>
        <TextInput
          style={styles.input}
          placeholder="username"
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          value={name}
          onChangeText={setName}
          onSubmitEditing={submit}
        />
        <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Join</Text>
          )}
        </TouchableOpacity>
        {!!err && <Text style={styles.error}>{err}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg, padding: 24 },
  card: { backgroundColor: theme.panel, padding: 28, borderRadius: 16, width: "100%", maxWidth: 360, gap: 14 },
  title: { color: theme.text, fontSize: 24, fontWeight: "700" },
  muted: { color: theme.muted, fontSize: 14 },
  error: { color: "#ff6b6b", fontSize: 13 },
  input: { backgroundColor: theme.panel2, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: "#2a2f3c" },
  button: { backgroundColor: theme.accent, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
