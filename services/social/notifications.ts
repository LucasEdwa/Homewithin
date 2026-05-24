import Constants from "expo-constants";
import { Platform } from "react-native";
import { currentUserId, supabase } from "../supabase";

// expo-notifications throws at import time in Expo Go SDK 53+ because remote
// push support was removed. Use a lazy require so it never loads there.
const isExpoGo = Constants.executionEnvironment === "storeClient";

type NotifModule = typeof import("expo-notifications");
let Notif: NotifModule | null = null;

if (!isExpoGo && Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notif = require("expo-notifications") as NotifModule;
    Notif.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // Module unavailable in this environment — notifications silently disabled.
  }
}

export async function registerForPushNotifications(): Promise<void> {
  if (!Notif) return;

  try {
    const { status: existing } = await Notif.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notif.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;
    if (!projectId) {
      console.warn("[notifications] No EAS projectId in app config");
      return;
    }

    let token: string;
    try {
      const result = await Notif.getExpoPushTokenAsync({ projectId });
      token = result.data;
    } catch (e: any) {
      console.warn("[notifications] Push token unavailable:", e?.message);
      return;
    }

    const uid = await currentUserId();
    if (!uid || !supabase) return;

    const { error } = await supabase
      .from("user_profiles")
      .update({ push_token: token })
      .eq("user_id", uid);
    if (error)
      console.warn("[notifications] Failed to save push token:", error.message);
  } catch (e: any) {
    console.warn(
      "[notifications] registerForPushNotifications failed:",
      e?.message,
    );
  }
}

export function addNotificationResponseListener(
  onMatchId: (matchId: string) => void,
  onScreen?: (screen: string) => void,
): { remove: () => void } {
  if (!Notif) return { remove: () => {} };
  return Notif.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data ?? {};
    const matchId = data.matchId as string | undefined;
    const screen = data.screen as string | undefined;
    if (matchId) onMatchId(matchId);
    else if (screen && onScreen) onScreen(screen);
  });
}
