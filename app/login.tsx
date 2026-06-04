import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import BotaoSalvar from "../components/BotaoSalvar";
import InputPadrao from "../components/InputPadrao";
import { useTheme } from "../contexts/ThemeContext";

export default function Login() {
  const router = useRouter();
  const { tema, isDarkMode, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

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

      <TouchableOpacity style={styles.botaoTema} onPress={toggleTheme}>
        <Ionicons
          name={isDarkMode ? "sunny" : "moon"}
          size={28}
          color={tema.text}
        />
      </TouchableOpacity>

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

      <BotaoSalvar titulo="Entrar" onPress={handleLogin} />

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
  botaoTema: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
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
