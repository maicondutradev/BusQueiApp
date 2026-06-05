import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
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

  const escolherImagem = async () => {
    if (Platform.OS === "web") {
      const isCamera = window.confirm("Deseja usar a Câmera?\n(Clique em Cancelar/Não para abrir a Galeria)");
      
      if (isCamera) {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
        if (!result.canceled) {
          setFoto(result.assets[0].uri);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
        if (!result.canceled) {
          setFoto(result.assets[0].uri);
        }
      }
    } else {
      Alert.alert("Foto do Perfil", "Escolha a origem da foto", [
        {
          text: "Câmera",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Toast.show({
                type: "error",
                text1: "Permissão Negada",
                text2: "Precisamos de acesso à câmera.",
              });
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              setFoto(result.assets[0].uri);
            }
          },
        },
        {
          text: "Galeria",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Toast.show({
                type: "error",
                text1: "Permissão Negada",
                text2: "Precisamos de acesso à galeria.",
              });
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              setFoto(result.assets[0].uri);
            }
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]);
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

    try {
      const user = auth.currentUser;
      if (!user) return;

      if (isEdicao) {
        await updateDoc(doc(db, "motoristas", String(params.id)), {
          nome,
          cnh,
          telefone,
          foto,
        });
      } else {
        await addDoc(collection(db, "motoristas"), {
          userId: user.uid,
          nome,
          cnh,
          telefone,
          foto,
          criadoEm: new Date(),
        });
      }

      Toast.show({
        type: "success",
        text1: isEdicao ? "Atualizado" : "Salvo",
        text2: "Dados do motorista armazenados com sucesso.",
      });

      setTimeout(() => router.back(), 1500);
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
            onPress={escolherImagem}
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
});
