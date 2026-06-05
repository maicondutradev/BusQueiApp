import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import BotaoSalvar from "../../components/BotaoSalvar";
import InputPadrao from "../../components/InputPadrao";
import { useTheme } from "../../contexts/ThemeContext";

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

  const handleSalvar = () => {
    if (!nomeRota || !origem || !destino) {
      Toast.show({ type: "error", text1: "Preencha todos os campos." });
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

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

        <View style={styles.linhaCep}>
          <InputPadrao
            style={styles.inputCep}
            placeholder="CEP"
            keyboardType="numeric"
            value={cepOrigem}
            onChangeText={setCepOrigem}
            onBlur={() => buscarCep(cepOrigem, setOrigem)}
            maxLength={8}
          />
          <InputPadrao
            style={styles.inputEndereco}
            placeholder="Origem"
            value={origem}
            onChangeText={setOrigem}
          />
        </View>

        <View style={styles.linhaCep}>
          <InputPadrao
            style={styles.inputCep}
            placeholder="CEP"
            keyboardType="numeric"
            value={cepDestino}
            onChangeText={setCepDestino}
            onBlur={() => buscarCep(cepDestino, setDestino)}
            maxLength={8}
          />
          <InputPadrao
            style={styles.inputEndereco}
            placeholder="Destino"
            value={destino}
            onChangeText={setDestino}
          />
        </View>

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
  linhaCep: { flexDirection: "row", justifyContent: "space-between" },
  inputCep: { flex: 0.3, marginRight: 10 },
  inputEndereco: { flex: 0.7 },
});
