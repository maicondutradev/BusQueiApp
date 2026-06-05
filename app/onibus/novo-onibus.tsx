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

export default function NovoOnibus() {
  const router = useRouter();
  const { tema } = useTheme();
  const params = useLocalSearchParams();

  const isEdicao = !!params.id;

  const [placa, setPlaca] = useState(params.placa ? String(params.placa) : "");
  const [modelo, setModelo] = useState(
    params.modelo ? String(params.modelo) : "",
  );
  const [capacidade, setCapacidade] = useState(
    params.capacidade ? String(params.capacidade) : "",
  );
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsubscribe();
  }, []);

  const handleSalvar = async () => {
    if (!placa || !modelo || !capacidade) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Por favor, preencha todos os campos do veículo.",
      });
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

    try {
      if (isEdicao) {
        await updateDoc(doc(db, "onibus", String(params.id)), {
          placa,
          modelo,
          capacidade,
        });
      } else {
        await addDoc(collection(db, "onibus"), {
          userId: user.uid,
          placa,
          modelo,
          capacidade,
          criadoEm: new Date(),
        });
      }

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: isEdicao
          ? "Veículo atualizado."
          : "Veículo adicionado à sua frota.",
      });

      setTimeout(() => router.back(), 1000);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível guardar os dados.",
      });
    }
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
