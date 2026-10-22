import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import BotaoSalvar from "../../components/BotaoSalvar";
import InputPadrao from "../../components/InputPadrao";
import { useTheme } from "../../contexts/ThemeContext";
import { useSync } from "../../contexts/SyncContext";
import { tirarFotoMotorista } from "../../services/cameraService";

export default function NovoMotorista() {
  const router = useRouter();
  const { tema } = useTheme();
  const { enfileirarDado, isConnected } = useSync();
  const params = useLocalSearchParams();
  const isEdicao = !!params.id;

  const [nome, setNome] = useState(params.nome ? String(params.nome) : "");
  const [cnh, setCnh] = useState(params.cnh ? String(params.cnh) : "");
  const [telefone, setTelefone] = useState(
    params.telefone ? String(params.telefone) : "",
  );
  const [fotoUri, setFotoUri] = useState<string | null>(
    params.fotoUri ? String(params.fotoUri) : null,
  );
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser || null);

  useEffect(() => {
    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
    } else {
      AsyncStorage.getItem("@busquei_last_uid").then((cachedUid) => {
        if (cachedUid) {
          setCurrentUser({ uid: cachedUid });
        }
      });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCapturarFoto = async () => {
    setCarregandoFoto(true);
    try {
      const resultado = await tirarFotoMotorista();

      if (resultado.status === "sucesso") {
        setFotoUri(resultado.uri);
        Toast.show({
          type: "success",
          text1: "Foto capturada",
          text2: "A imagem foi associada ao cadastro.",
        });
      } else if (resultado.status === "permissao_negada") {
        Toast.show({
          type: "error",
          text1: "Permissão de câmera negada",
          text2: "Habilite a câmera nas configurações do aparelho.",
        });
      } else if (resultado.status === "cancelado") {
        Toast.show({
          type: "info",
          text1: "Captura cancelada",
          text2: "Nenhuma foto foi alterada.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Falha na câmera",
          text2: resultado.erro || "Não foi possível abrir a câmera.",
        });
      }
    } finally {
      setCarregandoFoto(false);
    }
  };

  const handleRemoverFoto = () => {
    setFotoUri(null);
    Toast.show({
      type: "info",
      text1: "Foto descartada",
      text2: "A imagem rejeitada foi removida da prévia.",
    });
  };

  const handleSalvar = async () => {
    if (!nome || !cnh || !telefone) {
      Toast.show({
        type: "error",
        text1: "Preencha todos os campos.",
      });
      return;
    }

    let user = currentUser || auth.currentUser;
    if (!user) {
      const cachedUid = await AsyncStorage.getItem("@busquei_last_uid");
      if (cachedUid) {
        user = { uid: cachedUid };
      }
    }

    if (!user) {
      Toast.show({
        type: "error",
        text1: "Sessão inválida.",
      });
      return;
    }

    const data = isEdicao
      ? { nome, cnh, telefone, fotoUri: fotoUri || null }
      : {
          userId: user.uid,
          nome,
          cnh,
          telefone,
          fotoUri: fotoUri || null,
          criadoEm: Date.now(),
        };

    await enfileirarDado(
      "motoristas",
      data,
      isEdicao,
      isEdicao ? String(params.id) : undefined,
    );

    if (isConnected) {
      Toast.show({
        type: "success",
        text1: isEdicao ? "Atualizado com sucesso" : "Cadastrado com sucesso",
      });
    } else {
      Toast.show({
        type: "info",
        text1: isEdicao ? "Atualização salva offline" : "Salvo offline",
        text2: "Pendente de sincronização com o servidor",
      });
    }

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

        <View style={styles.secaoFoto}>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: tema.card,
                borderColor: tema.border,
              },
            ]}
          >
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={styles.fotoAvatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Ionicons
                  name="person-circle-outline"
                  size={72}
                  color={tema.primary}
                />
              </View>
            )}
          </View>

          <View style={styles.acoesFoto}>
            <Pressable
              style={[
                styles.botaoAcaoFoto,
                { backgroundColor: tema.primary },
              ]}
              onPress={handleCapturarFoto}
              disabled={carregandoFoto}
            >
              {carregandoFoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={18}
                    color="#fff"
                    style={styles.iconeBotao}
                  />
                  <Text style={styles.textoBotaoAcaoFoto}>
                    {fotoUri ? "Tirar outra foto" : "Fotografar"}
                  </Text>
                </>
              )}
            </Pressable>

            {fotoUri && (
              <Pressable
                style={[
                  styles.botaoDescartarFoto,
                  { borderColor: "#ef4444" },
                ]}
                onPress={handleRemoverFoto}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color="#ef4444"
                  style={styles.iconeBotao}
                />
                <Text style={styles.textoDescartarFoto}>Descartar foto</Text>
              </Pressable>
            )}
          </View>
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
          placeholder="Telefone com DDD"
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
  secaoFoto: {
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  fotoAvatar: {
    width: "100%",
    height: "100%",
  },
  placeholderAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  acoesFoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botaoAcaoFoto: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  iconeBotao: {
    marginRight: 6,
  },
  textoBotaoAcaoFoto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  botaoDescartarFoto: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  textoDescartarFoto: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
  },
});
