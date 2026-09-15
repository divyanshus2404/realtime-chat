import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./src/LoginScreen";
import { ChatScreen } from "./src/ChatScreen";

export default function App() {
  const [auth, setAuth] = useState<{ user: string; token: string } | null>(null);

  return (
    <>
      <StatusBar style="light" />
      {auth ? (
        <ChatScreen user={auth.user} token={auth.token} />
      ) : (
        <LoginScreen onLogin={(user, token) => setAuth({ user, token })} />
      )}
    </>
  );
}
