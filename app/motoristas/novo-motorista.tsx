import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  const [foto, setFoto] = useState<string | null>(
    params.foto ? String(params.foto) : null,
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [modalFotoVisivel, setModalFotoVisivel] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsubscribe();
  }, []);

  const comprimirImagem = (base64Original: string): Promise<string> => {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve(`data:image/jpeg;base64,${base64Original}`);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        } else {
          if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.4));
      };
      img.src = `data:image/jpeg;base64,${base64Original}`;
    });
  };

  const abrirCamera = async () => {
    setModalFotoVisivel(false);
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Permissão Negada", text2: "Precisamos de acesso à câmera." });
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const fotoComprimida = await comprimirImagem(result.assets[0].base64);
      setFoto(fotoComprimida);
    }
  };

  const abrirGaleria = async () => {
    setModalFotoVisivel(false);
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Permissão Negada", text2: "Precisamos de acesso à galeria." });
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const fotoComprimida = await comprimirImagem(result.assets[0].base64);
      setFoto(fotoComprimida);
    }
  };

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
        foto,
      }).catch(console.error);
    } else {
      addDoc(collection(db, "motoristas"), {
        userId: user.uid,
        nome,
        cnh,
        telefone,
        foto,
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

        <View style={styles.fotoContainer}>
          <TouchableOpacity
            style={[
              styles.botaoFoto,
              { backgroundColor: tema.card, borderColor: tema.primary },
            ]}
            onPress={() => setModalFotoVisivel(true)}
          >
            {foto ? (
              <Image source={{ uri: foto }} style={styles.imagemPerfil} />
            ) : (
              <Text style={[styles.textoBotaoFoto, { color: tema.text }]}>
                Adicionar Foto
              </Text>
            )}
          </TouchableOpacity>
        </View>

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

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalFotoVisivel}
        onRequestClose={() => setModalFotoVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tema.card }]}>
            <Text style={[styles.modalTitulo, { color: tema.text }]}>Foto do Motorista</Text>
            <TouchableOpacity
              style={[styles.modalBotao, { backgroundColor: tema.primary }]}
              onPress={abrirCamera}
            >
              <Text style={styles.modalBotaoTexto}>📷  Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBotao, { backgroundColor: tema.primary }]}
              onPress={abrirGaleria}
            >
              <Text style={styles.modalBotaoTexto}>🖼️  Galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBotao, { backgroundColor: "#6c757d" }]}
              onPress={() => setModalFotoVisivel(false)}
            >
              <Text style={styles.modalBotaoTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: "center" },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  fotoContainer: { alignItems: "center", marginBottom: 30 },
  botaoFoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  textoBotaoFoto: { fontWeight: "bold", textAlign: "center" },
  imagemPerfil: { width: "100%", height: "100%" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalContent: {
    width: "100%",
    padding: 25,
    borderRadius: 12,
    alignItems: "stretch",
    gap: 12,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  modalBotao: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBotaoTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
