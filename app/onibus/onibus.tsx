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

interface OnibusProps {
  id: string;
  placa: string;
  modelo: string;
  capacidade: string;
  isOffline?: boolean;
  clientSyncId?: string;
  statusSync?: RegistroSyncStatus;
}

export default function Onibus() {
  const router = useRouter();
  const { tema } = useTheme();
  const { syncQueue, excluirDado } = useSync();
  const [listaOnibus, setListaOnibus] = useState<OnibusProps[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);
  const [itemParaDeletar, setItemParaDeletar] = useState<{ id: string; modelo: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser || null);

  const carregarCache = useCallback(async (uid?: string) => {
    const targetUid = uid || currentUser?.uid || auth.currentUser?.uid;
    const cached = await carregarCacheLocal<OnibusProps>(targetUid ? `onibus_${targetUid}` : "onibus");
    if (cached && cached.length > 0) {
      setListaOnibus(cached);
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

  const carregarOnibus = useCallback(() => {
    if (!currentUser) return;

    const q = query(collection(db, "onibus"), where("userId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          statusSync: "SINCRONIZADO" as RegistroSyncStatus,
        })) as OnibusProps[];

        if (!snapshot.metadata.fromCache || lista.length > 0) {
          setListaOnibus(lista);
          salvarCacheLocal(`onibus_${currentUser.uid}`, lista);
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
      const unsubscribe = carregarOnibus();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [carregarOnibus, carregarCache]),
  );

  const confirmarDelecao = (id: string, modelo: string) => {
    setItemParaDeletar({ id, modelo });
    setModalVisivel(true);
  };

  const deletarOnibus = async () => {
    if (!itemParaDeletar) return;
    const idParaDeletar = itemParaDeletar.id;
    setModalVisivel(false);

    await excluirDado("onibus", idParaDeletar);

    const novaLista = listaOnibus.filter((o) => o.id !== idParaDeletar);
    setListaOnibus(novaLista);
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (uid) {
      salvarCacheLocal(`onibus_${uid}`, novaLista);
    }
    Toast.show({
      type: "success",
      text1: "Excluído",
    });

    setItemParaDeletar(null);
  };

  const idsExcluidos = new Set(
    syncQueue
      .filter((q) => q.collectionName === "onibus" && q.isExclusao && q.idExclusao)
      .map((q) => q.idExclusao!)
  );

  const onibusEditados = new Map(
    syncQueue
      .filter((q) => q.collectionName === "onibus" && q.isEdicao && q.idEdicao)
      .map((q) => [
        q.idEdicao!,
        { id: q.idEdicao!, ...q.data, isOffline: true, statusSync: q.status as RegistroSyncStatus },
      ])
  );

  const listaAtualizada = listaOnibus
    .filter((item) => !idsExcluidos.has(item.id))
    .map((item) => {
      if (onibusEditados.has(item.id)) {
        return onibusEditados.get(item.id)! as OnibusProps;
      }
      return { ...item, statusSync: "SINCRONIZADO" as RegistroSyncStatus };
    });

  const onibusNovos = syncQueue
    .filter((q) => {
      if (q.collectionName !== "onibus" || q.isEdicao || q.isExclusao) return false;
      const jaExiste = listaAtualizada.some(
        (o) =>
          (q.data?.clientSyncId && o.clientSyncId === q.data.clientSyncId) ||
          (q.data?.placa && o.placa?.trim().toLowerCase() === q.data.placa?.trim().toLowerCase())
      );
      return !jaExiste;
    })
    .map((q) => ({
      id: q.id,
      ...q.data,
      isOffline: true,
      statusSync: q.status as RegistroSyncStatus,
    })) as OnibusProps[];

  const listaCombinada = [...onibusNovos, ...listaAtualizada];

  const listaFiltrada = listaCombinada.filter(
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
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitulo, { color: tema.primary, flex: 1 }]}>
            {item.modelo}
          </Text>
          <SyncStatusBadge status={item.statusSync || "SINCRONIZADO"} />
        </View>
        <Text style={[styles.cardTexto, { color: tema.text }]}>
          Placa: {item.placa} | {item.capacidade} Lugares
        </Text>
      </View>

      <BotoesAcaoCard
        onPressEditar={() => {
          if (item.statusSync === "PENDENTE" || item.statusSync === "SINCRONIZANDO") {
            Toast.show({ type: "info", text1: "Aguarde a sincronização para editar." });
            return;
          }
          router.push({
            pathname: "/onibus/novo-onibus",
            params: item as any,
          });
        }}
        onPressExcluir={() => {
          confirmarDelecao(item.id, item.modelo);
        }}
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

      <ModalConfirmacao
        visivel={modalVisivel}
        titulo="Excluir Ônibus"
        mensagem={`Tem certeza que deseja remover o ônibus: ${itemParaDeletar?.modelo}?`}
        textoBotaoConfirmar="Excluir"
        onConfirmar={deletarOnibus}
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
  cardHeader: {
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
