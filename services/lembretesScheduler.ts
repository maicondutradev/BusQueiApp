import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CANAL_ID = "lembretes-viagem";

// Configura o comportamento da notificação quando o app está em primeiro plano
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
}

/**
 * Inicializa o canal de notificações no Android (obrigatório desde Android 8.0 / API 26)
 */
export async function inicializarCanalNotificacoes(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANAL_ID, {
      name: "Lembretes de Viagem - BusQuei",
      description: "Notificações de horários de ônibus e embarque",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0288D1",
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }
}

/**
 * Verifica e solicita permissão de notificações (POST_NOTIFICATIONS no Android 13+)
 */
export async function solicitarPermissaoNotificacoes(): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && "Notification" in window) {
      const status = await window.Notification.requestPermission();
      return status === "granted";
    }
    return true;
  }

  const { status: statusAtual } = await Notifications.getPermissionsAsync();
  let statusFinal = statusAtual;

  if (statusAtual !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    statusFinal = status;
  }

  await inicializarCanalNotificacoes();
  return statusFinal === "granted";
}

/**
 * Dispara uma notificação imediata para teste de canal e permissão
 */
export async function dispararNotificacaoImediata(
  titulo: string = "Teste de Notificação - BusQuei",
  mensagem: string = "O canal de notificações está ativo e configurado corretamente!",
): Promise<string | null> {
  const permitida = await solicitarPermissaoNotificacoes();
  if (!permitida) {
    throw new Error("Permissão para envio de notificações foi negada.");
  }

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && "Notification" in window) {
      new window.Notification(titulo, { body: mensagem });
    }
    return "web-teste";
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: mensagem,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { tipo: "teste" },
    },
    trigger: null, // Disparo imediato
  });

  return notificationId;
}

/**
 * Agenda uma notificação para uma data/hora futura (Lembrete de viagem)
 */
export async function agendarNotificacaoViagem(
  titulo: string,
  mensagem: string,
  dataHora: Date,
  dadosExtras?: Record<string, unknown>,
): Promise<string> {
  const permitida = await solicitarPermissaoNotificacoes();
  if (!permitida) {
    throw new Error(
      "Permissão de notificações não concedida. Habilite nas configurações.",
    );
  }

  const agora = Date.now();
  if (dataHora.getTime() <= agora) {
    throw new Error("A data e hora do lembrete devem ser no futuro.");
  }

  if (Platform.OS === "web") {
    // Fallback simulado para ambiente web
    const atrasoMs = dataHora.getTime() - agora;
    setTimeout(() => {
      if (typeof window !== "undefined" && "Notification" in window) {
        new window.Notification(titulo, { body: mensagem });
      }
    }, atrasoMs);
    return `web-agendamento-${Date.now()}`;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: mensagem,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        tipo: "lembrete_viagem",
        ...dadosExtras,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dataHora,
      channelId: CANAL_ID,
    },
  });

  return notificationId;
}

/**
 * Cancela um lembrete agendado antes do seu disparo
 */
export async function cancelarNotificacaoAgendada(
  notificationId?: string,
): Promise<void> {
  if (!notificationId) return;

  if (Platform.OS !== "web") {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.warn("Erro ao cancelar notificação agendada no sistema:", err);
    }
  }
}
