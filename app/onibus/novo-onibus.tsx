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
import { enviarNotificacaoLocal } from "../../services/notificationService";
import { useSync } from "../../contexts/SyncContext";

export default function NovoOnibus() {
  const router = useRouter();
  const { tema } = useTheme();
  const { enfileirarDado, isConnected } = useSync();
  const params = useLocalSearchParams();

  const isEdicao = !!params.id;

  const [placa, setPlaca] = useState(params.placa ? String(params.placa) : "");
  const [modelo, setModelo] = useState(
    params.modelo ? String(params.modelo) : "",
  );
  const [capacidade, setCapacidade] = useState(
    params.capacidade ? String(params.capacidade) : "",
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
    if (!placa || !modelo || !capacidade) {
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
      ? { placa, modelo, capacidade }
      : { userId: user.uid, placa, modelo, capacidade, criadoEm: Date.now() };

    await enfileirarDado("onibus", data, isEdicao, isEdicao ? String(params.id) : undefined);

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

    await enviarNotificacaoLocal(
      "🚌 Frota BusQuei",
      isEdicao
        ? `O veículo ${modelo} (Placa ${placa}) foi atualizado na frota.`
        : `O veículo ${modelo} (Placa ${placa}) foi adicionado à frota.`
    );

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
            title: isEdicao ? "Editar Ônibus" : "Novo Ônibus",
            headerStyle: { backgroundColor: tema.card },
            headerTintColor: tema.text,
          }}
        />

        <Text style={[styles.titulo, { color: tema.text }]}>
          {isEdicao ? "Atualizar Dados" : "Adicionar Ônibus"}
        </Text>

        <InputPadrao
          placeholder="Placa (ex: ABC-1234)"
          value={placa}
          onChangeText={setPlaca}
        />
        <InputPadrao
          placeholder="Modelo do Veículo"
          value={modelo}
          onChangeText={setModelo}
        />
        <InputPadrao
          placeholder="Capacidade de Passageiros"
          keyboardType="numeric"
          value={capacidade}
          onChangeText={setCapacidade}
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
