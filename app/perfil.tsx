import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BotaoSalvar from "../components/BotaoSalvar";
import InputPadrao from "../components/InputPadrao";
import { useTheme } from "../contexts/ThemeContext";

export default function Perfil() {
  const router = useRouter();
  const { tema } = useTheme();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      const user = auth.currentUser;
      if (user) {
        setEmail(user.email || "");
        try {
          const docSnap = await getDoc(doc(db, "usuarios", user.uid));
          if (docSnap.exists()) {
            setNome(docSnap.data().nome || "");
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    carregarDados();
  }, []);

  const handleSalvar = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, "usuarios", user.uid), {
        nome: nome
      });

      Alert.alert("Sucesso", "Perfil atualizado!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar o perfil.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // O index.tsx ou login.tsx vai lidar com o redirecionamento
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Meu Perfil",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />

      <InputPadrao placeholder="Nome" value={nome} onChangeText={setNome} />
      <InputPadrao
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={false}
      />

      <BotaoSalvar titulo="Atualizar Dados" onPress={handleSalvar} />

      <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
        <Text style={styles.textoBotaoSair}>Sair da Conta</Text>
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
  botaoSair: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  textoBotaoSair: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
