import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BotoesAcaoCard from "../../components/BotoesAcaoCard";
import FabButton from "../../components/FabButton";
import InputPadrao from "../../components/InputPadrao";
import ModalConfirmacao from "../../components/ModalConfirmacao";
import { useTheme } from "../../contexts/ThemeContext";

interface MotoristaProps {
  id: string;
  nome: string;
  cnh: string;
  telefone: string;
  foto: string | null;
}

export default function Motoristas() {
  const router = useRouter();
  const { tema } = useTheme();
  const [listaMotoristas, setListaMotoristas] = useState<MotoristaProps[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);
  const [itemParaDeletar, setItemParaDeletar] = useState<{ id: string; nome: string } | null>(null);

  const carregarMotoristas = () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "motoristas"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as MotoristaProps[];
      
      setListaMotoristas(lista);
    });

    return unsubscribe;
  };

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = carregarMotoristas();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, []),
  );

  const confirmarDelecao = (id: string, nome: string) => {
    setItemParaDeletar({ id, nome });
    setModalVisivel(true);
  };

  const deletarMotorista = () => {
    if (!itemParaDeletar) return;
    setModalVisivel(false);

    deleteDoc(doc(db, "motoristas", itemParaDeletar.id)).catch(() => {});

    Toast.show({
      type: "success",
      text1: "Excluído",
      text2: "O motorista foi removido.",
    });

    setItemParaDeletar(null);
  };

  const listaFiltrada = listaMotoristas.filter(
    (item) =>
      item.nome.toLowerCase().includes(busca.toLowerCase()) ||
      item.cnh.includes(busca),
  );

  const renderItem = ({ item }: { item: MotoristaProps }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: tema.card, borderColor: tema.border },
      ]}
    >
      <View style={styles.cardConteudo}>
        {item.foto ? (
          <Image source={{ uri: item.foto }} style={styles.fotoMotorista} />
        ) : (
          <View
            style={[styles.fotoPlaceholder, { backgroundColor: tema.primary }]}
          >
            <Text style={styles.fotoIniciais}>
              {item.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.dadosMotorista}>
          <Text style={[styles.cardTitulo, { color: tema.primary }]}>
            {item.nome}
          </Text>
          <Text style={[styles.cardTexto, { color: tema.text }]}>
            CNH: {item.cnh}
          </Text>
          <Text style={[styles.cardTexto, { color: tema.text }]}>
            Telefone: {item.telefone}
          </Text>
        </View>
      </View>

      <BotoesAcaoCard
        onPressEditar={() =>
          router.push({
            pathname: "/motoristas/novo-motorista",
            params: item as any,
          })
        }
        onPressExcluir={() => confirmarDelecao(item.id, item.nome)}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Motoristas",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />
      <Text style={[styles.titulo, { color: tema.text }]}>
        Cadastro de Motoristas
      </Text>

      <InputPadrao
        style={styles.inputBusca}
        placeholder="Buscar por nome ou CNH..."
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
            Nenhum motorista encontrado.
          </Text>
        }
      />

      <FabButton rota="/motoristas/novo-motorista" />

      <ModalConfirmacao
        visivel={modalVisivel}
        titulo="Excluir Motorista"
        mensagem={`Tem certeza que deseja remover o(a) motorista: ${itemParaDeletar?.nome}?`}
        textoBotaoConfirmar="Excluir"
        onConfirmar={deletarMotorista}
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
  cardConteudo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  fotoMotorista: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  fotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  fotoIniciais: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  dadosMotorista: { flex: 1 },
  cardTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  cardTexto: { fontSize: 14 },
  textoVazio: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.6,
  },
});
