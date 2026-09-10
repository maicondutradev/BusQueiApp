import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebaseConfig";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BotoesAcaoCard from "../../components/BotoesAcaoCard";
import FabButton from "../../components/FabButton";
import InputPadrao from "../../components/InputPadrao";
import ModalConfirmacao from "../../components/ModalConfirmacao";
import SyncStatusBadge, { RegistroSyncStatus } from "../../components/SyncStatusBadge";
import { useTheme } from "../../contexts/ThemeContext";
import { useSync } from "../../contexts/SyncContext";
import { carregarCacheLocal, salvarCacheLocal } from "../../services/offlineCache";

interface RotaProps {
  id: string;
  nomeRota: string;
  origem: string;
  destino: string;
  isOffline?: boolean;
  clientSyncId?: string;
  statusSync?: RegistroSyncStatus;
}

export default function Rotas() {
  const router = useRouter();
  const { tema } = useTheme();
  const { syncQueue, excluirDado } = useSync();
  const [listaRotas, setListaRotas] = useState<RotaProps[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);
  const [itemParaDeletar, setItemParaDeletar] = useState<{ id: string; nomeRota: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser || null);

  const carregarCache = useCallback(async (uid?: string) => {
    const targetUid = uid || currentUser?.uid || auth.currentUser?.uid;
    const cached = await carregarCacheLocal<RotaProps>(targetUid ? `rotas_${targetUid}` : "rotas");
    if (cached && cached.length > 0) {
      setListaRotas(cached);
    }
  }, [currentUser]);

  useEffect(() => {
    carregarCache();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
      if (user) {
        carregarCache(user.uid);
      }
    });
    return () => unsubscribe();
  }, [carregarCache]);

  const carregarRotas = useCallback(() => {
    if (!currentUser) return;

    const q = query(collection(db, "rotas"), where("userId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          statusSync: "SINCRONIZADO" as RegistroSyncStatus,
        })) as RotaProps[];

        if (!snapshot.metadata.fromCache || lista.length > 0) {
          setListaRotas(lista);
          salvarCacheLocal(`rotas_${currentUser.uid}`, lista);
        }
      },
      () => {
        carregarCache();
      }
    );

    return unsubscribe;
  }, [currentUser, carregarCache]);

  useFocusEffect(
    useCallback(() => {
      carregarCache();
      const unsubscribe = carregarRotas();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [carregarRotas, carregarCache]),
  );

  const confirmarDelecao = (id: string, nomeRota: string) => {
    setItemParaDeletar({ id, nomeRota });
    setModalVisivel(true);
  };

  const deletarRota = async () => {
    if (!itemParaDeletar) return;
    const idParaDeletar = itemParaDeletar.id;
    setModalVisivel(false);

    await excluirDado("rotas", idParaDeletar);

    const novaLista = listaRotas.filter((r) => r.id !== idParaDeletar);
    setListaRotas(novaLista);
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (uid) {
      salvarCacheLocal(`rotas_${uid}`, novaLista);
    }
    Toast.show({
      type: "success",
      text1: "Excluído",
    });

    setItemParaDeletar(null);
  };

  const idsExcluidos = new Set(
    syncQueue
      .filter((q) => q.collectionName === "rotas" && q.isExclusao && q.idExclusao)
      .map((q) => q.idExclusao!)
  );

  const rotasEditadas = new Map(
    syncQueue
      .filter((q) => q.collectionName === "rotas" && q.isEdicao && q.idEdicao)
      .map((q) => [
        q.idEdicao!,
        { id: q.idEdicao!, ...q.data, isOffline: true, statusSync: q.status as RegistroSyncStatus },
      ])
  );

  const listaAtualizada = listaRotas
    .filter((item) => !idsExcluidos.has(item.id))
    .map((item) => {
      if (rotasEditadas.has(item.id)) {
        return rotasEditadas.get(item.id)! as RotaProps;
      }
      return { ...item, statusSync: "SINCRONIZADO" as RegistroSyncStatus };
    });

  const rotasNovas = syncQueue
    .filter((q) => {
      if (q.collectionName !== "rotas" || q.isEdicao || q.isExclusao) return false;
      const jaExiste = listaAtualizada.some(
        (r) =>
          (q.data?.clientSyncId && r.clientSyncId === q.data.clientSyncId) ||
          (q.data?.nomeRota &&
            r.nomeRota?.trim().toLowerCase() === q.data.nomeRota?.trim().toLowerCase() &&
            q.data?.origem &&
            r.origem?.trim().toLowerCase() === q.data.origem?.trim().toLowerCase())
      );
      return !jaExiste;
    })
    .map((q) => ({
      id: q.id,
      ...q.data,
      isOffline: true,
      statusSync: q.status as RegistroSyncStatus,
    })) as RotaProps[];

  const listaCombinada = [...rotasNovas, ...listaAtualizada];

  const listaFiltrada = listaCombinada.filter(
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
        <View style={styles.cardHeaderRota}>
          <Text style={[styles.cardTitulo, { color: tema.primary, flex: 1 }]}>
            {item.nomeRota}
          </Text>
          <SyncStatusBadge status={item.statusSync || "SINCRONIZADO"} />
        </View>
        <Text style={[styles.cardTexto, { color: tema.text }]}>
          De: {item.origem}
        </Text>
        <Text style={[styles.cardTexto, { color: tema.text }]}>
          Para: {item.destino}
        </Text>
      </View>

      <BotoesAcaoCard
        onPressEditar={() => {
          if (item.statusSync === "PENDENTE" || item.statusSync === "SINCRONIZANDO") {
            Toast.show({ type: "info", text1: "Aguarde a sincronização para editar." });
            return;
          }
          router.push({ pathname: "/rotas/nova-rota", params: item as any });
        }}
        onPressExcluir={() => {
          confirmarDelecao(item.id, item.nomeRota);
        }}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Suas Rotas",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />
      <Text style={[styles.titulo, { color: tema.text }]}>Rotas Criadas</Text>

      <InputPadrao
        style={[
          styles.inputBusca,
          {
            backgroundColor: tema.card,
            color: tema.text,
            borderColor: tema.border,
          },
        ]}
        placeholder="Buscar por rota, origem ou destino..."
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
            Nenhuma rota cadastrada.
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
    borderWidth: 2,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
  cardHeaderRota: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitulo: { fontSize: 18, fontWeight: "bold" },
  cardTexto: { fontSize: 14, marginTop: 5 },
  textoVazio: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.6,
  },
});
