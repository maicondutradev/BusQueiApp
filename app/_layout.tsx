import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform, View, Text } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import Toast, { ToastConfig } from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import PWAInstallPrompt from "../components/PWAInstallPrompt";
import { configurarNotificacoes } from "../services/notificationService";
import { SyncProvider } from "../contexts/SyncContext";
import NetworkIndicator from "../components/NetworkIndicator";

function AppContent() {
  const { tema, isDarkMode } = useTheme();

  useEffect(() => {
    configurarNotificacoes();

    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(tema.background).catch(console.error);

      const ocultarBarra = async () => {
        try {
          await NavigationBar.setVisibilityAsync("hidden");
          await NavigationBar.setBehaviorAsync("overlay-swipe");
          await NavigationBar.setPositionAsync("absolute");
        } catch (error) {
          console.error(error);
        }
      };

      ocultarBarra();

      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          ocultarBarra();
        }
      });

      return () => subscription.remove();
    }
  }, [tema.background]);

  const getTextoToast = (props: any) => {
    if (
      props.text1 &&
      props.text2 &&
      (props.text1 === "Sucesso" ||
        props.text1 === "Sucesso!" ||
        props.text1 === "Erro" ||
        props.text1 === "Atenção" ||
        props.text1 === "Aguarde")
    ) {
      return props.text2;
    }
    return props.text1 || props.text2 || "";
  };

  const toastConfig: ToastConfig = {
    success: (props) => (
      <View
        style={{
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: tema.card,
          borderColor: tema.border,
          borderWidth: 1,
          borderRadius: 25,
          paddingVertical: 8,
          paddingHorizontal: 16,
          maxWidth: "80%",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 5,
          gap: 8,
        }}
      >
        <Ionicons name="checkmark-circle" size={17} color="#16a34a" />
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: tema.text,
            textAlign: "center",
          }}
        >
          {getTextoToast(props)}
        </Text>
      </View>
    ),
    error: (props) => (
      <View
        style={{
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: tema.card,
          borderColor: tema.border,
          borderWidth: 1,
          borderRadius: 25,
          paddingVertical: 8,
          paddingHorizontal: 16,
          maxWidth: "80%",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 5,
          gap: 8,
        }}
      >
        <Ionicons name="alert-circle" size={17} color="#dc3545" />
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: tema.text,
            textAlign: "center",
          }}
        >
          {getTextoToast(props)}
        </Text>
      </View>
    ),
    info: (props) => (
      <View
        style={{
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: tema.card,
          borderColor: tema.border,
          borderWidth: 1,
          borderRadius: 25,
          paddingVertical: 8,
          paddingHorizontal: 16,
          maxWidth: "80%",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 5,
          gap: 8,
        }}
      >
        <Ionicons name="information-circle" size={17} color="#2563eb" />
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: tema.text,
            textAlign: "center",
          }}
        >
          {getTextoToast(props)}
        </Text>
      </View>
    ),
  };

  const navTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: tema.background,
      card: tema.card,
      text: tema.text,
      border: tema.border,
      primary: tema.primary,
    },
  };

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={tema.card} />
      <Stack
        screenOptions={{
          animation: "fade",
          animationDuration: 200,
          contentStyle: { backgroundColor: tema.background },
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
          headerRight: () => <NetworkIndicator />,
        }}
      >
        <Stack.Screen name="index" options={{ title: "BusQuei" }} />
      </Stack>
      <PWAInstallPrompt />
      <Toast config={toastConfig} visibilityTime={1800} topOffset={48} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SyncProvider>
        <AppContent />
      </SyncProvider>
    </ThemeProvider>
  );
}
