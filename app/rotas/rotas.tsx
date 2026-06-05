import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BotoesAcaoCard from "../../components/BotoesAcaoCard";
import FabButton from "../../components/FabButton";
import InputPadrao from "../../components/InputPadrao";
import ModalConfirmacao from "../../components/ModalConfirmacao";
import { useTheme } from "../../contexts/ThemeContext";

interface RotaProps {
  id: string;
  nomeRota: string;
  origem: string;
  destino: string;
}

export default function Rotas() {
  const router = useRouter();
  const { tema } = useTheme();
  const [listaRotas, setListaRotas] = useState<RotaProps[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);
  const [itemParaDeletar, setItemParaDeletar] = useState<{ id: string; nomeRota: string } | null>(null);

  const carregarRotas = () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "rotas"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as RotaProps[];
      
      setListaRotas(lista);
    });

    return unsubscribe;
  };

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = carregarRotas();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, []),
  );

  const confirmarDelecao = (id: string, nomeRota: string) => {
    setItemParaDeletar({ id, nomeRota });
    setModalVisivel(true);
  };

  const deletarRota = () => {
    if (!itemParaDeletar) return;
    setModalVisivel(false);

    deleteDoc(doc(db, "rotas", itemParaDeletar.id)).catch(() => {});

    Toast.show({
      type: "success",
      text1: "Excluído",
      text2: "A rota foi removida com sucesso.",
    });

    setItemParaDeletar(null);
  };

  const listaFiltrada = listaRotas.filter(
    (item) =>
      item.nomeRota.toLowerCase().includes(busca.toLowerCase()) ||
      item.origem.toLowerCase().includes(busca.toLowerCase()) ||
      item.destino.toLowerCase().includes(busca.toLowerCase()),
  );

  const renderItem = ({ item }: { item: RotaProps }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: tema.card, borderColor: tema.border },
      ]}
    >
      <View style={styles.cardConteudo}>
        <Text style={[styles.cardTitulo, { color: tema.primary }]}>
          {item.nomeRota}
        </Text>
        <Text style={[styles.cardTexto, { color: tema.text }]}>
          De: {item.origem}
        </Text>
        <Text style={[styles.cardTexto, { color: tema.text }]}>
          Para: {item.destino}
        </Text>
      </View>

      <BotoesAcaoCard
        onPressEditar={() =>
          router.push({ pathname: "/rotas/nova-rota", params: item as any })
        }
        onPressExcluir={() => confirmarDelecao(item.id, item.nomeRota)}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Rotas",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />
      <Text style={[styles.titulo, { color: tema.text }]}>Gestão de Rotas</Text>

      <InputPadrao
        style={styles.inputBusca}
        placeholder="Buscar por nome, origem ou destino..."
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
            Nenhuma rota encontrada.
          </Text>
        }
      />

      <FabButton rota="/rotas/nova-rota" />

      <ModalConfirmacao
        visivel={modalVisivel}
        titulo="Excluir Rota"
        mensagem={`Tem certeza que deseja remover a rota: ${itemParaDeletar?.nomeRota}?`}
        textoBotaoConfirmar="Excluir"
        onConfirmar={deletarRota}
        onCancelar={() => setModalVisivel(false)}
      />
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
  cardTexto: { fontSize: 13, marginTop: 2 },
  textoVazio: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.6,
  },
});
