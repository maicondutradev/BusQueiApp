import { Stack } from "expo-router";
import { useEffect } from "react";
import Toast, {
  BaseToast,
  ErrorToast,
  ToastConfig,
} from "react-native-toast-message";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import PWAInstallPrompt from "../components/PWAInstallPrompt";
import { configurarNotificacoes } from "../services/notificationService";

function AppContent() {
  const { tema } = useTheme();

  useEffect(() => {
    configurarNotificacoes();
  }, []);

  const toastConfig: ToastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: tema.primary,
          backgroundColor: tema.card,
          borderWidth: 1,
          borderColor: tema.border,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: "bold",
          color: tema.text,
        }}
        text2Style={{
          fontSize: 14,
          color: tema.text,
          opacity: 0.8,
        }}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: "#dc3545",
          backgroundColor: tema.card,
          borderWidth: 1,
          borderColor: tema.border,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: "bold",
          color: tema.text,
        }}
        text2Style={{
          fontSize: 14,
          color: tema.text,
          opacity: 0.8,
        }}
      />
    ),
  };

  return (
    <>
      <Stack screenOptions={{ animation: "fade", animationDuration: 300 }}>
        <Stack.Screen name="index" options={{ title: "BusQuei" }} />
      </Stack>
      <PWAInstallPrompt />
      <Toast config={toastConfig} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
