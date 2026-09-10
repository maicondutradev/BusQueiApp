import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import BotaoSalvar from "../components/BotaoSalvar";
import InputPadrao from "../components/InputPadrao";
import NetworkIndicator from "../components/NetworkIndicator";
import { useTheme } from "../contexts/ThemeContext";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tema, isDarkMode, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email || !senha) {
      Toast.show({
        type: "error",
        text1: "Campos obrigatórios",
        text2: "Por favor, preencha seu e-mail e senha.",
        position: "top",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      Toast.show({
        type: "success",
        text1: `Bem-vindo de volta!`,
        text2: "Login realizado com sucesso.",
        position: "top",
      });

      setTimeout(() => {
        router.replace("/");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      Toast.show({
        type: "error",
        text1: "Acesso Negado",
        text2: "E-mail ou senha incorretos. Tente novamente.",
        position: "top",
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View 
        style={[styles.areaSuperiorDireita, { top: Math.max(insets.top + 10, 50) }]} 
      >
        <NetworkIndicator />
        <TouchableOpacity onPress={toggleTheme} style={styles.botaoHeader}>
          <Ionicons
            name={isDarkMode ? "sunny" : "moon"}
            size={28}
            color={tema.text}
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.titulo, { color: tema.text }]}>BusQuei - Login</Text>

      <InputPadrao
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <InputPadrao
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <BotaoSalvar titulo="Entrar" onPress={handleLogin} isLoading={isLoading} />

      <TouchableOpacity
        onPress={() => router.push("/cadastro")}
        style={styles.link}
      >
        <Text style={[styles.textoLink, { color: tema.primary }]}>
          Não tem conta? Cadastre-se
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  areaSuperiorDireita: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  botaoHeader: {
    padding: 10,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  link: { marginTop: 20, alignItems: "center" },
  textoLink: { fontSize: 16, fontWeight: "bold" },
});
