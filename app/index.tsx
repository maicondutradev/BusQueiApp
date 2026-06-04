import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BotaoMenu from "../components/BotaoMenu";
import { useTheme } from "../contexts/ThemeContext";

export default function Index() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const { tema, isDarkMode, toggleTheme } = useTheme();

  useFocusEffect(
    useCallback(() => {
      const verificarSessao = async () => {
        const sessao = await AsyncStorage.getItem("sessaoAtiva");
        if (sessao !== "true") {
          router.replace("/login");
        } else {
          setVerificando(false);
        }
      };

      setVerificando(true);
      verificarSessao();
    }, []),
  );

  if (verificando) {
    return (
      <View style={[styles.container, { backgroundColor: tema.background }]}>
        <ActivityIndicator size="large" color={tema.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Menu Principal",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
          headerRight: () => (
            <TouchableOpacity onPress={toggleTheme} style={styles.botaoHeader}>
              <Ionicons
                name={isDarkMode ? "sunny" : "moon"}
                size={24}
                color={tema.text}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Text style={[styles.titulo, { color: tema.text }]}>BusQuei</Text>

      <BotaoMenu titulo="Gerenciar Ônibus" rota="onibus/onibus" />
      <BotaoMenu titulo="Gerenciar Motoristas" rota="motoristas/motoristas" />
      <BotaoMenu titulo="Gerenciar Rotas" rota="rotas/rotas" />
      <BotaoMenu titulo="Meu Perfil" rota="/perfil" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
  },
  botaoHeader: {
    padding: 10,
  },
});
