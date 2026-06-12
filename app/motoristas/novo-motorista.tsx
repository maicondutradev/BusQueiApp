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

export default function NovoMotorista() {
  const router = useRouter();
  const { tema } = useTheme();
  const params = useLocalSearchParams();
  const isEdicao = !!params.id;

  const [nome, setNome] = useState(params.nome ? String(params.nome) : "");
  const [cnh, setCnh] = useState(params.cnh ? String(params.cnh) : "");
  const [telefone, setTelefone] = useState(
    params.telefone ? String(params.telefone) : "",
  );
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsubscribe();
  }, []);

  const handleSalvar = async () => {
    if (!nome || !cnh || !telefone) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Preencha os dados do motorista.",
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

    if (isEdicao) {
      updateDoc(doc(db, "motoristas", String(params.id)), {
        nome,
        cnh,
        telefone,
      }).catch(console.error);
    } else {
      addDoc(collection(db, "motoristas"), {
        userId: user.uid,
        nome,
        cnh,
        telefone,
        criadoEm: new Date(),
      }).catch(console.error);
    }

    Toast.show({
      type: "success",
      text1: isEdicao ? "Atualizado" : "Salvo",
      text2: "Dados do motorista armazenados com sucesso.",
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
          placeholder="Telefone para Contato"
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
