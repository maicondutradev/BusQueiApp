import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebaseConfig";
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

export default function NovaRota() {
  const router = useRouter();
  const { tema } = useTheme();
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
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

    const user = currentUser;
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Sessão inválida",
        text2: "Aguarde um momento e tente novamente.",
      });
      return;
    }

    if (isEdicao) {
      updateDoc(doc(db, "rotas", String(params.id)), {
        nomeRota,
        origem,
        destino,
      }).catch(console.error);
    } else {
      addDoc(collection(db, "rotas"), {
        userId: user.uid,
        nomeRota,
        origem,
        destino,
        criadoEm: new Date(),
      }).catch(console.error);
    }

    Toast.show({
      type: "success",
      text1: isEdicao ? "Rota Atualizada" : "Rota Criada",
      text2: "As alterações foram guardadas.",
    });

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
          {isEdicao ? "Editar Trajeto" : "Adicionar Rota"}
        </Text>

        <InputPadrao
          placeholder="Nome da Rota (ex: Linha 42)"
          value={nomeRota}
          onChangeText={setNomeRota}
        />

        <InputPadrao
          style={styles.inputCep}
          placeholder="CEP de Origem (opcional)"
          keyboardType="numeric"
          value={cepOrigem}
          onChangeText={setCepOrigem}
          onBlur={() => buscarCep(cepOrigem, setOrigem)}
          maxLength={8}
        />
        <InputPadrao
          placeholder="Origem"
          value={origem}
          onChangeText={setOrigem}
        />

        <InputPadrao
          style={styles.inputCep}
          placeholder="CEP de Destino (opcional)"
          keyboardType="numeric"
          value={cepDestino}
          onChangeText={setCepDestino}
          onBlur={() => buscarCep(cepDestino, setDestino)}
          maxLength={8}
        />
        <InputPadrao
          placeholder="Destino"
          value={destino}
          onChangeText={setDestino}
        />

        <BotaoSalvar
          titulo={isEdicao ? "Atualizar Rota" : "Salvar"}
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
  inputCep: { marginBottom: -8 },
});
