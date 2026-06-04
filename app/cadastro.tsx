import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BotaoSalvar from "../components/BotaoSalvar";
import InputPadrao from "../components/InputPadrao";
import { useTheme } from "../contexts/ThemeContext";

export default function Cadastro() {
  const router = useRouter();
  const { tema } = useTheme();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Por favor, preencha todos os campos.",
        position: "top",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        nome: nome,
        email: email,
        criadoEm: new Date()
      });

      Toast.show({
        type: "success",
        text1: "Bem-vindo ao BusQuei!",
        text2: "Sua conta foi criada com sucesso.",
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
        text1: "Ops!",
        text2: "Erro ao criar conta. Verifique os dados ou tente novamente.",
        position: "top",
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Criar Conta",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />
      <Text style={[styles.titulo, { color: tema.text }]}>Novo Usuário</Text>

      <InputPadrao
        placeholder="Nome Completo"
        value={nome}
        onChangeText={setNome}
      />
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

      <BotaoSalvar titulo="Cadastrar" onPress={handleCadastro} isLoading={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
});
