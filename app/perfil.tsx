import { signOut, deleteUser } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../services/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, Platform, Modal } from "react-native";
import Toast from "react-native-toast-message";
import BotaoSalvar from "../components/BotaoSalvar";
import InputPadrao from "../components/InputPadrao";
import { useTheme } from "../contexts/ThemeContext";

export default function Perfil() {
  const router = useRouter();
  const { tema } = useTheme();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);

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

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Perfil atualizado!",
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Falha ao atualizar o perfil.",
      });
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
    setModalVisivel(true);
  };

  const executarExclusao = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setModalVisivel(false);

    try {
      try {
        await deleteDoc(doc(db, "usuarios", user.uid));
      } catch (dbError) {
        console.warn("Erro ao apagar doc do firestore", dbError);
      }
      
      await deleteUser(user);
      
      Toast.show({
        type: "success",
        text1: "Conta Apagada",
        text2: "Sua conta foi removida com sucesso.",
        position: "top"
      });

      setTimeout(() => {
        router.replace("/login");
      }, 1500);

    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        Toast.show({
          type: "error",
          text1: "Atenção de Segurança",
          text2: "Saia do aplicativo e faça login novamente para excluir a conta.",
          position: "top"
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível apagar a conta.",
          position: "top"
        });
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tema.card }]}>
            <Text style={[styles.modalTitle, { color: tema.text }]}>Apagar Conta</Text>
            <Text style={[styles.modalText, { color: tema.text }]}>
              Tem certeza que deseja apagar sua conta permanentemente? Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: "#6c757d" }]} 
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: "#dc3545" }]} 
                onPress={executarExclusao}
              >
                <Text style={styles.modalButtonText}>Sim, apagar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
