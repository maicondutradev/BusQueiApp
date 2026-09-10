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

export default function NovaRota() {
  const router = useRouter();
  const { tema } = useTheme();
  const { enfileirarDado, isConnected } = useSync();
  const params = useLocalSearchParams();
  const isEdicao = !!params.id;

  const [nomeRota, setNomeRota] = useState(
    params.nomeRota ? String(params.nomeRota) : "",
  );
  const [cepOrigem, setCepOrigem] = useState("");
  const [origem, setOrigem] = useState(
    params.origem ? String(params.origem) : "",
  );
  const [cepDestino, setCepDestino] = useState("");
  const [destino, setDestino] = useState(
    params.destino ? String(params.destino) : "",
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

  const buscarCep = async (cep: string, setCampo: (valor: string) => void) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );
      const dados = await resposta.json();

      if (dados.erro) {
        Toast.show({ type: "error", text1: "CEP Inválido" });
        return;
      }

      setCampo(
        `${dados.logradouro}, ${dados.bairro} - ${dados.localidade}/${dados.uf}`,
      );
    } catch (erro) {
      Toast.show({ type: "error", text1: "Erro ao buscar endereço." });
    }
  };

  const handleSalvar = async () => {
    if (!nomeRota || !origem || !destino) {
      Toast.show({ type: "error", text1: "Preencha todos os campos." });
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
      ? { nomeRota, origem, destino }
      : { userId: user.uid, nomeRota, origem, destino, criadoEm: Date.now() };

    await enfileirarDado("rotas", data, isEdicao, isEdicao ? String(params.id) : undefined);

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
      "🚦 Malha de Rotas BusQuei",
      isEdicao
        ? `O trajeto da linha ${nomeRota} foi atualizado.`
        : `Nova rota cadastrada: ${nomeRota} (${origem} ➔ ${destino}).`
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
            title: isEdicao ? "Editar Rota" : "Nova Rota",
            headerStyle: { backgroundColor: tema.card },
            headerTintColor: tema.text,
          }}
        />

        <Text style={[styles.titulo, { color: tema.text }]}>
          {isEdicao ? "Atualizar Rota" : "Cadastrar Linha"}
        </Text>

        <InputPadrao
          placeholder="Nome ou Código da Linha"
          value={nomeRota}
          onChangeText={setNomeRota}
        />

        <InputPadrao
          placeholder="CEP de Origem (Ex: 01001-000)"
          value={cepOrigem}
          onChangeText={(texto) => {
            setCepOrigem(texto);
            buscarCep(texto, setOrigem);
          }}
          keyboardType="numeric"
          maxLength={9}
        />

        <InputPadrao
          placeholder="Ponto de Partida (Origem)"
          value={origem}
          onChangeText={setOrigem}
        />

        <InputPadrao
          placeholder="CEP de Destino (Ex: 01001-000)"
          value={cepDestino}
          onChangeText={(texto) => {
            setCepDestino(texto);
            buscarCep(texto, setDestino);
          }}
          keyboardType="numeric"
          maxLength={9}
        />

        <InputPadrao
          placeholder="Ponto Final (Destino)"
          value={destino}
          onChangeText={setDestino}
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
