import Constants from "expo-constants";

/**
 * Server URL resolution.
 *
 * On a physical phone, "localhost" points at the phone, not your laptop — so
 * for local dev set this to your machine's LAN IP (e.g. http://192.168.1.5:4000)
 * in app.json > expo.extra.serverUrl, or to your deployed Render URL.
 */
export const SERVER_URL: string =
  (Constants.expoConfig?.extra?.serverUrl as string) ?? "http://localhost:4000";
