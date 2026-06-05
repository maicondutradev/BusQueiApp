import { signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
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
  const [modalVisivel, setModalVisivel] = useState(false);
  const [modalReauth, setModalReauth] = useState(false);
  const [senhaReauth, setSenhaReauth] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        setEmail(user.email || "");
        try {
          const docSnap = await getDoc(doc(db, "usuarios", user.uid));
          if (docSnap.exists()) {
            setNome(docSnap.data().nome || "");
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        setCurrentUser(null);
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

  const deletarTodosDadosUsuario = async (uid: string) => {
    const colecoes = ["onibus", "motoristas", "rotas"];
    for (const colecao of colecoes) {
      const q = query(collection(db, colecao), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref).catch(() => {});
      }
    }
    await deleteDoc(doc(db, "usuarios", uid)).catch(() => {});
  };

  const executarExclusao = async () => {
    const user = currentUser || auth.currentUser;
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Sessão inválida",
        text2: "Saia e entre novamente para excluir a conta.",
        position: "top"
      });
      return;
    }
    
    setModalVisivel(false);

    try {
      await deletarTodosDadosUsuario(user.uid);
      await deleteUser(user);
      
      Toast.show({
        type: "success",
        text1: "Conta Apagada",
        text2: "Sua conta e todos os dados foram removidos.",
        position: "top"
      });

      setTimeout(() => {
        router.replace("/login");
      }, 1500);

    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setSenhaReauth("");
        setModalReauth(true);
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

  const executarReauth = async () => {
    const user = currentUser || auth.currentUser;
    if (!user || !user.email) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, senhaReauth);
      await reauthenticateWithCredential(user, credential);
      setModalReauth(false);

      await deletarTodosDadosUsuario(user.uid);
      await deleteUser(user);

      Toast.show({
        type: "success",
        text1: "Conta Apagada",
        text2: "Sua conta e todos os dados foram removidos.",
        position: "top"
      });

      setTimeout(() => {
        router.replace("/login");
      }, 1500);

    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Senha incorreta",
        text2: "Verifique sua senha e tente novamente.",
        position: "top"
      });
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalReauth}
        onRequestClose={() => setModalReauth(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tema.card }]}>
            <Text style={[styles.modalTitle, { color: tema.text }]}>Confirme sua Identidade</Text>
            <Text style={[styles.modalText, { color: tema.text }]}>
              Por segurança, insira sua senha para confirmar a exclusão da conta.
            </Text>
            <InputPadrao
              placeholder="Sua senha atual"
              value={senhaReauth}
              onChangeText={setSenhaReauth}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#6c757d" }]}
                onPress={() => setModalReauth(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#dc3545" }]}
                onPress={executarReauth}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
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
