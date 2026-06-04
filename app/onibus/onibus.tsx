import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import BotoesAcaoCard from "../../components/BotoesAcaoCard";
import FabButton from "../../components/FabButton";
import InputPadrao from "../../components/InputPadrao";
import { useTheme } from "../../contexts/ThemeContext";

interface OnibusProps {
  id: string;
  placa: string;
  modelo: string;
  capacidade: string;
}

export default function Onibus() {
  const router = useRouter();
  const { tema } = useTheme();
  const [listaOnibus, setListaOnibus] = useState<OnibusProps[]>([]);
  const [busca, setBusca] = useState("");

  const carregarOnibus = () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "onibus"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as OnibusProps[];
      
      setListaOnibus(lista);
    });

    return unsubscribe;
  };

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = carregarOnibus();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, []),
  );

  const deletarOnibus = async (id: string) => {
    try {
      await deleteDoc(doc(db, "onibus", id));

      Toast.show({
        type: "success",
        text1: "Excluído",
        text2: "Veículo removido da frota.",
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Erro ao excluir." });
    }
  };

  const confirmarDelecao = (id: string, modelo: string) => {
    if (Platform.OS === "web") {
      const confirmado = window.confirm(
        `Tem certeza que deseja remover o ônibus: ${modelo}?`,
      );
      if (confirmado) {
        deletarOnibus(id);
      }
    } else {
      Alert.alert(
        "Excluir Ônibus",
        `Tem certeza que deseja remover o ônibus: ${modelo}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => deletarOnibus(id),
          },
        ],
      );
    }
  };

  const listaFiltrada = listaOnibus.filter(
    (item) =>
      item.modelo.toLowerCase().includes(busca.toLowerCase()) ||
      item.placa.toLowerCase().includes(busca.toLowerCase()),
  );

  const renderItem = ({ item }: { item: OnibusProps }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: tema.card, borderColor: tema.border },
      ]}
    >
      <View style={styles.cardConteudo}>
        <Text style={[styles.cardTitulo, { color: tema.primary }]}>
          {item.modelo}
        </Text>
        <Text style={[styles.cardTexto, { color: tema.text }]}>
          Placa: {item.placa} | {item.capacidade} Lugares
        </Text>
      </View>

      <BotoesAcaoCard
        onPressEditar={() =>
          router.push({
            pathname: "/onibus/novo-onibus",
            params: item as any,
          })
        }
        onPressExcluir={() => confirmarDelecao(item.id, item.modelo)}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Sua Frota",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />
      <Text style={[styles.titulo, { color: tema.text }]}>Meus Ônibus</Text>

      <InputPadrao
        style={[
          styles.inputBusca,
          {
            backgroundColor: tema.card,
            color: tema.text,
            borderColor: tema.border,
          },
        ]}
        placeholder="Buscar por modelo ou placa..."
        value={busca}
        onChangeText={setBusca}
      />

      <FlatList
        data={listaFiltrada}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listaContainer}
        ListEmptyComponent={
          <Text style={[styles.textoVazio, { color: tema.text }]}>
            Nenhum ônibus encontrado.
          </Text>
        }
      />

      <FabButton rota="/onibus/novo-onibus" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  inputBusca: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#0056b3",
    borderRadius: 8,
    color: "#333333",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  listaContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardConteudo: { marginBottom: 10 },
  cardTitulo: { fontSize: 18, fontWeight: "bold" },
  cardTexto: { fontSize: 14, marginTop: 5 },
  textoVazio: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.6,
  },
});
