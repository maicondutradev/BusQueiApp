import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import Toast from "react-native-toast-message";
import BotaoSalvar from "../../components/BotaoSalvar";
import InputPadrao from "../../components/InputPadrao";
import { useTheme } from "../../contexts/ThemeContext";
import { useSync } from "../../contexts/SyncContext";

export default function NovoMotorista() {
  const router = useRouter();
  const { tema } = useTheme();
  const { enfileirarDado, isConnected } = useSync();
  const params = useLocalSearchParams();
  const isEdicao = !!params.id;

  const [nome, setNome] = useState(params.nome ? String(params.nome) : "");
  const [cnh, setCnh] = useState(params.cnh ? String(params.cnh) : "");
  const [telefone, setTelefone] = useState(
    params.telefone ? String(params.telefone) : "",
  );
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser || null);

  useEffect(() => {
    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
    } else {
      AsyncStorage.getItem("@busquei_last_uid").then((cachedUid) => {
        if (cachedUid) {
          setCurrentUser({ uid: cachedUid });
        }
      });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSalvar = async () => {
    if (!nome || !cnh || !telefone) {
      Toast.show({
        type: "error",
        text1: "Preencha todos os campos.",
      });
      return;
    }

    let user = currentUser || auth.currentUser;
    if (!user) {
      const cachedUid = await AsyncStorage.getItem("@busquei_last_uid");
      if (cachedUid) {
        user = { uid: cachedUid };
      }
    }

    if (!user) {
      Toast.show({
        type: "error",
        text1: "Sessão inválida.",
      });
      return;
    }

    const data = isEdicao
      ? { nome, cnh, telefone }
      : { userId: user.uid, nome, cnh, telefone, criadoEm: Date.now() };

    await enfileirarDado("motoristas", data, isEdicao, isEdicao ? String(params.id) : undefined);

    if (isConnected) {
      Toast.show({
        type: "success",
        text1: isEdicao ? "Atualizado com sucesso" : "Cadastrado com sucesso",
      });
    } else {
      Toast.show({
        type: "info",
        text1: isEdicao ? "Atualização salva offline" : "Salvo offline",
        text2: "Pendente de sincronização com o servidor",
      });
    }

    setTimeout(() => router.back(), 1000);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tema.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { backgroundColor: tema.background },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen
          options={{
            title: isEdicao ? "Editar Motorista" : "Novo Motorista",
            headerStyle: { backgroundColor: tema.card },
            headerTintColor: tema.text,
          }}
        />
        <Text style={[styles.titulo, { color: tema.text }]}>
          {isEdicao ? "Atualizar Motorista" : "Adicionar Motorista"}
        </Text>

        <InputPadrao
          placeholder="Nome Completo"
          value={nome}
          onChangeText={setNome}
        />
        <InputPadrao
          placeholder="Número da CNH"
          keyboardType="numeric"
          value={cnh}
          onChangeText={setCnh}
        />
        <InputPadrao
          placeholder="Telefone com DDD"
          keyboardType="phone-pad"
          value={telefone}
          onChangeText={setTelefone}
        />

        <BotaoSalvar
          titulo={isEdicao ? "Atualizar" : "Salvar"}
          onPress={handleSalvar}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: "center" },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
});
