import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BotaoMenu from "../components/BotaoMenu";
import NetworkIndicator from "../components/NetworkIndicator";
import { useTheme } from "../contexts/ThemeContext";
import { baixarDadosParaCache } from "../services/offlineCache";

export default function Index() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const { tema, isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setVerificando(false);
        baixarDadosParaCache(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Menu Principal",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <NetworkIndicator />
              <TouchableOpacity onPress={toggleTheme} style={styles.botaoHeader}>
                <Ionicons
                  name={isDarkMode ? "sunny" : "moon"}
                  size={24}
                  color={tema.text}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      {verificando ? (
        <ActivityIndicator size="large" color={tema.primary} />
      ) : (
        <>
          <Text style={[styles.titulo, { color: tema.text }]}>BusQuei</Text>

          <BotaoMenu titulo="Gerenciar Ônibus" rota="onibus/onibus" />
          <BotaoMenu titulo="Gerenciar Motoristas" rota="motoristas/motoristas" />
          <BotaoMenu titulo="Gerenciar Rotas" rota="rotas/rotas" />
          <BotaoMenu titulo="Meu Perfil" rota="/perfil" />
        </>
      )}
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
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
