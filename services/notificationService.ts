import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function configurarNotificacoes() {
  if (Platform.OS === "web") return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Alertas Operacionais",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6c47ff",
    });
  }
}

export async function solicitarPermissaoNotificacao(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function enviarNotificacaoLocal(titulo: string, corpo: string) {
  if (Platform.OS === "web") return;

  try {
    const permitiu = await solicitarPermissaoNotificacao();
    if (!permitiu) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function agendarNotificacao(titulo: string, corpo: string, segundos: number) {
  if (Platform.OS === "web") return;

  try {
    const permitiu = await solicitarPermissaoNotificacao();
    if (!permitiu) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: segundos,
      },
    });
  } catch (error) {
    console.error(error);
  }
}
