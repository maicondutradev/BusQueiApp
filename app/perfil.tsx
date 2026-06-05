import { signOut, deleteUser } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
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
    });

    return () => unsubscribe();
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
      router.replace("/login");
    } catch (error) {
      console.error(error);
    }
  };

  const handleApagarConta = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Tem certeza que deseja apagar sua conta permanentemente? Esta ação não pode ser desfeita.");
      if (confirmed) {
        executarExclusao(user);
      }
    } else {
      Alert.alert(
        "Apagar Conta",
        "Tem certeza que deseja apagar sua conta permanentemente? Esta ação não pode ser desfeita.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sim, apagar", style: "destructive", onPress: () => executarExclusao(user) }
        ]
      );
    }
  };

  const executarExclusao = async (user: any) => {
    try {
      // Tenta apagar do banco de dados primeiro. Se der erro de permissão (ex: regras do Firestore), 
      // não impede a exclusão da conta no Auth.
      try {
        await deleteDoc(doc(db, "usuarios", user.uid));
      } catch (dbError) {
        console.warn("Erro ao apagar doc do firestore (possivel erro de regra), continuando para o Auth...", dbError);
      }
      
      await deleteUser(user);
      
      if (Platform.OS === "web") {
        window.alert("Sua conta foi removida com sucesso.");
      } else {
        Alert.alert("Conta Apagada", "Sua conta foi removida com sucesso.");
      }
      router.replace("/login");
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        const msg = "Para apagar a conta, você precisa ter feito login recentemente. Saia do aplicativo, faça login novamente e tente excluir sua conta.";
        if (Platform.OS === "web") window.alert(msg);
        else Alert.alert("Atenção", msg);
      } else {
        const erroMsg = "Não foi possível apagar a conta.";
        if (Platform.OS === "web") window.alert(erroMsg);
        else Alert.alert("Erro", erroMsg);
        console.error(error);
      }
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

      <TouchableOpacity style={styles.botaoApagar} onPress={handleApagarConta}>
        <Text style={styles.textoBotaoApagar}>Apagar Minha Conta</Text>
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
    backgroundColor: "#ffc107",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  textoBotaoSair: { color: "#000", fontWeight: "bold", fontSize: 16 },
  botaoApagar: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  textoBotaoApagar: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
