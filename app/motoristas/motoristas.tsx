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

interface MotoristaProps {
  id: string;
  nome: string;
  cnh: string;
  telefone: string;
  isOffline?: boolean;
  clientSyncId?: string;
  statusSync?: RegistroSyncStatus;
}

export default function Motoristas() {
  const router = useRouter();
  const { tema } = useTheme();
  const { syncQueue, excluirDado } = useSync();
  const [listaMotoristas, setListaMotoristas] = useState<MotoristaProps[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);
  const [itemParaDeletar, setItemParaDeletar] = useState<{ id: string; nome: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser || null);

  const carregarCache = useCallback(async (uid?: string) => {
    const targetUid = uid || currentUser?.uid || auth.currentUser?.uid;
    const cached = await carregarCacheLocal<MotoristaProps>(targetUid ? `motoristas_${targetUid}` : "motoristas");
    if (cached && cached.length > 0) {
      setListaMotoristas(cached);
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

  const carregarMotoristas = useCallback(() => {
    if (!currentUser) return;

    const q = query(collection(db, "motoristas"), where("userId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          statusSync: "SINCRONIZADO" as RegistroSyncStatus,
        })) as MotoristaProps[];

        if (!snapshot.metadata.fromCache || lista.length > 0) {
          setListaMotoristas(lista);
          salvarCacheLocal(`motoristas_${currentUser.uid}`, lista);
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
      const unsubscribe = carregarMotoristas();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [carregarMotoristas, carregarCache]),
  );

  const confirmarDelecao = (id: string, nome: string) => {
    setItemParaDeletar({ id, nome });
    setModalVisivel(true);
  };

  const deletarMotorista = async () => {
    if (!itemParaDeletar) return;
    const idParaDeletar = itemParaDeletar.id;
    setModalVisivel(false);

    await excluirDado("motoristas", idParaDeletar);

    const novaLista = listaMotoristas.filter((m) => m.id !== idParaDeletar);
    setListaMotoristas(novaLista);
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (uid) {
      salvarCacheLocal(`motoristas_${uid}`, novaLista);
    }
    Toast.show({
      type: "success",
      text1: "Excluído",
    });

    setItemParaDeletar(null);
  };

  const idsExcluidos = new Set(
    syncQueue
      .filter((q) => q.collectionName === "motoristas" && q.isExclusao && q.idExclusao)
      .map((q) => q.idExclusao!)
  );

  const motoristasEditados = new Map(
    syncQueue
      .filter((q) => q.collectionName === "motoristas" && q.isEdicao && q.idEdicao)
      .map((q) => [
        q.idEdicao!,
        { id: q.idEdicao!, ...q.data, isOffline: true, statusSync: q.status as RegistroSyncStatus },
      ])
  );

  const listaAtualizada = listaMotoristas
    .filter((item) => !idsExcluidos.has(item.id))
    .map((item) => {
      if (motoristasEditados.has(item.id)) {
        return motoristasEditados.get(item.id)! as MotoristaProps;
      }
      return { ...item, statusSync: "SINCRONIZADO" as RegistroSyncStatus };
    });

  const motoristasNovos = syncQueue
    .filter((q) => {
      if (q.collectionName !== "motoristas" || q.isEdicao || q.isExclusao) return false;
      const jaExiste = listaAtualizada.some(
        (m) =>
          (q.data?.clientSyncId && m.clientSyncId === q.data.clientSyncId) ||
          (q.data?.cnh && m.cnh?.trim() === q.data.cnh?.trim())
      );
      return !jaExiste;
    })
    .map((q) => ({
      id: q.id,
      ...q.data,
      isOffline: true,
      statusSync: q.status as RegistroSyncStatus,
    })) as MotoristaProps[];

  const listaCombinada = [...motoristasNovos, ...listaAtualizada];

  const listaFiltrada = listaCombinada.filter(
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
        <View
          style={[styles.fotoPlaceholder, { backgroundColor: tema.primary }]}
        >
          <Text style={styles.fotoIniciais}>
            {item.nome.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.dadosMotorista}>
          <View style={styles.cardHeaderMotorista}>
            <Text style={[styles.cardTitulo, { color: tema.primary, flex: 1 }]}>
              {item.nome}
            </Text>
            <SyncStatusBadge status={item.statusSync || "SINCRONIZADO"} />
          </View>
          <Text style={[styles.cardTexto, { color: tema.text }]}>
            CNH: {item.cnh}
          </Text>
          <Text style={[styles.cardTexto, { color: tema.text }]}>
            Telefone: {item.telefone}
          </Text>
        </View>
      </View>

      <BotoesAcaoCard
        onPressEditar={() => {
          if (item.statusSync === "PENDENTE" || item.statusSync === "SINCRONIZANDO") {
            Toast.show({ type: "info", text1: "Aguarde a sincronização para editar." });
            return;
          }
          router.push({
            pathname: "/motoristas/novo-motorista",
            params: item as any,
          });
        }}
        onPressExcluir={() => {
          confirmarDelecao(item.id, item.nome);
        }}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Seus Motoristas",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />
      <Text style={[styles.titulo, { color: tema.text }]}>
        Motoristas Cadastrados
      </Text>

      <InputPadrao
        style={[
          styles.inputBusca,
          {
            backgroundColor: tema.card,
            color: tema.text,
            borderColor: tema.border,
          },
        ]}
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
        mensagem={`Tem certeza que deseja remover o motorista: ${itemParaDeletar?.nome}?`}
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
  cardConteudo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  fotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  fotoIniciais: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  dadosMotorista: { flex: 1 },
  cardHeaderMotorista: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitulo: { fontSize: 18, fontWeight: "bold" },
  cardTexto: { fontSize: 14, marginTop: 3 },
  textoVazio: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.6,
  },
});
