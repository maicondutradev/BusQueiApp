import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebaseConfig";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BotoesAcaoCard from "../../components/BotoesAcaoCard";
import FabButton from "../../components/FabButton";
import InputPadrao from "../../components/InputPadrao";
import ModalConfirmacao from "../../components/ModalConfirmacao";
import SyncStatusBadge, { RegistroSyncStatus } from "../../components/SyncStatusBadge";
import { useTheme } from "../../contexts/ThemeContext";
import { useSync } from "../../contexts/SyncContext";
import { carregarCacheLocal, salvarCacheLocal } from "../../services/offlineCache";
import { capturarLocalizacaoRota, RouteLocation } from "../../services/routeLocation";
import { enviarNotificacaoLocal } from "../../services/notificationService";

interface RotaProps {
  id: string;
  nomeRota: string;
  origem: string;
  destino: string;
  statusRota?: "PROGRAMADA" | "EM_ANDAMENTO" | "FINALIZADA";
  iniciadaEm?: string | null;
  finalizadaEm?: string | null;
  localizacaoInicio?: RouteLocation | null;
  localizacaoFim?: RouteLocation | null;
  isOffline?: boolean;
  clientSyncId?: string;
  statusSync?: RegistroSyncStatus;
}

export default function Rotas() {
  const router = useRouter();
  const { tema } = useTheme();
  const { syncQueue, excluirDado, enfileirarDado, isConnected } = useSync();
  const [listaRotas, setListaRotas] = useState<RotaProps[]>([]);
  const [busca, setBusca] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);
  const [itemParaDeletar, setItemParaDeletar] = useState<{ id: string; nomeRota: string } | null>(null);
  const [modalReiniciarVisivel, setModalReiniciarVisivel] = useState(false);
  const [itemParaReiniciar, setItemParaReiniciar] = useState<RotaProps | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser || null);
  const [rotaEmAcao, setRotaEmAcao] = useState<string | null>(null);

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

  const confirmarReinicio = (rota: RotaProps) => {
    if (rota.statusSync === "PENDENTE" || rota.statusSync === "SINCRONIZANDO") {
      Toast.show({
        type: "info",
        text1: "Aguarde a sincronização",
        text2: "A rota precisa estar sincronizada antes de ser reiniciada.",
      });
      return;
    }
    setItemParaReiniciar(rota);
    setModalReiniciarVisivel(true);
  };

  const executarReinicioRota = async () => {
    if (!itemParaReiniciar) return;
    const rota = itemParaReiniciar;
    setModalReiniciarVisivel(false);
    setRotaEmAcao(rota.id);

    try {
      const alteracoes = {
        statusRota: "PROGRAMADA" as const,
        iniciadaEm: null,
        finalizadaEm: null,
        localizacaoInicio: null,
        localizacaoFim: null,
      };

      const rotaAtualizada: RotaProps = {
        ...rota,
        ...alteracoes,
        statusSync: isConnected ? "SINCRONIZANDO" : "PENDENTE",
      };

      const novaLista = listaRotas.map((item) =>
        item.id === rota.id ? rotaAtualizada : item
      );

      await enfileirarDado(
        "rotas",
        {
          userId: currentUser?.uid || auth.currentUser?.uid,
          nomeRota: rota.nomeRota,
          origem: rota.origem,
          destino: rota.destino,
          ...alteracoes,
        },
        true,
        rota.id
      );

      setListaRotas(novaLista);
      const uid = currentUser?.uid || auth.currentUser?.uid;
      if (uid) {
        await salvarCacheLocal(`rotas_${uid}`, novaLista);
      }

      await enviarNotificacaoLocal(
        "🔄 Rota Reiniciada",
        `A linha ${rota.nomeRota} voltou ao status PROGRAMADA e está pronta para nova viagem.`
      );

      Toast.show({
        type: isConnected ? "success" : "info",
        text1: "Rota reiniciada",
        text2: isConnected
          ? "Status alterado para PROGRAMADA."
          : "Reinício salvo offline e será sincronizado.",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao reiniciar",
        text2: "Não foi possível reiniciar a rota.",
      });
    } finally {
      setRotaEmAcao(null);
      setItemParaReiniciar(null);
    }
  };

  const alterarStatusRota = async (rota: RotaProps) => {
    if (rota.statusSync === "PENDENTE" || rota.statusSync === "SINCRONIZANDO") {
      Toast.show({
        type: "info",
        text1: "Aguarde a sincronização",
        text2: "A rota precisa estar sincronizada antes de iniciar ou encerrar.",
      });
      return;
    }

    const iniciando = rota.statusRota !== "EM_ANDAMENTO";
    setRotaEmAcao(rota.id);

    try {
      const localizacao = await capturarLocalizacaoRota();
      const alteracoes = iniciando
        ? {
            statusRota: "EM_ANDAMENTO" as const,
            iniciadaEm: localizacao.recordedAt,
            localizacaoInicio: localizacao,
          }
        : {
            statusRota: "FINALIZADA" as const,
            finalizadaEm: localizacao.recordedAt,
            localizacaoFim: localizacao,
          };

      const rotaAtualizada: RotaProps = {
        ...rota,
        ...alteracoes,
        statusSync: isConnected ? "SINCRONIZANDO" : "PENDENTE",
      };
      const novaLista = listaRotas.map((item) =>
        item.id === rota.id ? rotaAtualizada : item,
      );

      await enfileirarDado(
        "rotas",
        {
          userId: currentUser?.uid || auth.currentUser?.uid,
          nomeRota: rota.nomeRota,
          origem: rota.origem,
          destino: rota.destino,
          ...alteracoes,
        },
        true,
        rota.id,
      );
      setListaRotas(novaLista);
      const uid = currentUser?.uid || auth.currentUser?.uid;
      if (uid) {
        await salvarCacheLocal(`rotas_${uid}`, novaLista);
      }

      await enviarNotificacaoLocal(
        iniciando ? "🚦 Rota Iniciada" : "🏁 Rota Finalizada",
        iniciando
          ? `A rota ${rota.nomeRota} iniciou o trajeto com registro de GPS.`
          : `A rota ${rota.nomeRota} foi finalizada com sucesso.`
      );

      Toast.show({
        type: isConnected ? "success" : "info",
        text1: iniciando ? "Rota iniciada" : "Rota encerrada",
        text2: isConnected
          ? "Localização salva com sucesso."
          : "Localização salva no aparelho e será sincronizada depois.",
      });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "";
      if (mensagem === "LOCATION_PERMISSION_DENIED") {
        Toast.show({
          type: "error",
          text1: "Permissão de localização negada",
          text2: "Autorize a localização para registrar a rota.",
        });
      } else if (mensagem === "LOCATION_SERVICES_DISABLED") {
        Toast.show({
          type: "error",
          text1: "Localização desativada",
          text2: "Ative o GPS do aparelho e tente novamente.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Não foi possível obter a localização",
          text2: "Confira o sinal do GPS e tente novamente.",
        });
      }
    } finally {
      setRotaEmAcao(null);
    }
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

  const renderItem = ({ item }: { item: RotaProps }) => {
    const status = item.statusRota || "PROGRAMADA";
    const statusConfig = {
      PROGRAMADA: { bg: "#e0f2fe", text: "#0369a1", label: "PROGRAMADA" },
      EM_ANDAMENTO: { bg: "#dcfce7", text: "#15803d", label: "EM ANDAMENTO" },
      FINALIZADA: { bg: "#f3e8ff", text: "#7e22ce", label: "FINALIZADA" },
    }[status] || { bg: "#f3f4f6", text: "#4b5563", label: status };

    const estaBloqueado =
      rotaEmAcao === item.id ||
      item.statusSync === "PENDENTE" ||
      item.statusSync === "SINCRONIZANDO";

    return (
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

          <View style={styles.statusLinha}>
            <Text style={[styles.cardTexto, { color: tema.text, marginRight: 8 }]}>
              Status:
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusBadgeTexto, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {item.localizacaoInicio && (
            <Text style={[styles.cardTexto, { color: tema.text }]}>
              Início: {item.localizacaoInicio.latitude.toFixed(5)}, {item.localizacaoInicio.longitude.toFixed(5)}
            </Text>
          )}
          {item.localizacaoFim && (
            <Text style={[styles.cardTexto, { color: tema.text }]}>
              Fim: {item.localizacaoFim.latitude.toFixed(5)}, {item.localizacaoFim.longitude.toFixed(5)}
            </Text>
          )}
        </View>

        {/* Botoes de Acao do Ciclo da Rota */}
        <View style={styles.acoesCicloContainer}>
          {status === "PROGRAMADA" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Iniciar rota ${item.nomeRota}`}
              disabled={estaBloqueado}
              onPress={() => alterarStatusRota(item)}
              style={({ pressed }) => [
                styles.botaoRota,
                { backgroundColor: tema.primary, opacity: pressed ? 0.8 : 1 },
                estaBloqueado && styles.botaoDesabilitado,
              ]}
            >
              {rotaEmAcao === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.textoBotaoRota}>Iniciar rota com GPS</Text>
              )}
            </Pressable>
          )}

          {status === "EM_ANDAMENTO" && (
            <View style={styles.linhaBotoesStatus}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Encerrar rota ${item.nomeRota}`}
                disabled={estaBloqueado}
                onPress={() => alterarStatusRota(item)}
                style={({ pressed }) => [
                  styles.botaoRota,
                  styles.botaoEncerrar,
                  { opacity: pressed ? 0.8 : 1 },
                  estaBloqueado && styles.botaoDesabilitado,
                ]}
              >
                {rotaEmAcao === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.textoBotaoRota}>Encerrar rota</Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Reiniciar rota ${item.nomeRota}`}
                disabled={estaBloqueado}
                onPress={() => confirmarReinicio(item)}
                style={({ pressed }) => [
                  styles.botaoRota,
                  styles.botaoReiniciarSecundario,
                  { borderColor: "#f59e0b", opacity: pressed ? 0.8 : 1 },
                  estaBloqueado && styles.botaoDesabilitado,
                ]}
              >
                <Text style={[styles.textoBotaoReiniciar, { color: "#d97706" }]}>
                  Reiniciar
                </Text>
              </Pressable>
            </View>
          )}

          {status === "FINALIZADA" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Reiniciar rota ${item.nomeRota}`}
              disabled={estaBloqueado}
              onPress={() => confirmarReinicio(item)}
              style={({ pressed }) => [
                styles.botaoRota,
                styles.botaoReiniciarFinalizada,
                { opacity: pressed ? 0.8 : 1 },
                estaBloqueado && styles.botaoDesabilitado,
              ]}
            >
              {rotaEmAcao === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.textoBotaoRota}>🔄 Reiniciar rota</Text>
              )}
            </Pressable>
          )}
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
  };

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

      <ModalConfirmacao
        visivel={modalReiniciarVisivel}
        titulo="Reiniciar Rota"
        mensagem={`Tem certeza que deseja reiniciar a rota "${itemParaReiniciar?.nomeRota}"?\n\nO status retornará para PROGRAMADA e os registros da viagem anterior serão redefinidos para uma nova viagem.`}
        textoBotaoConfirmar="Reiniciar"
        corBotaoConfirmar="#f59e0b"
        onConfirmar={executarReinicioRota}
        onCancelar={() => {
          setModalReiniciarVisivel(false);
          setItemParaReiniciar(null);
        }}
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
  statusLinha: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeTexto: {
    fontSize: 12,
    fontWeight: "bold",
  },
  acoesCicloContainer: {
    marginBottom: 10,
  },
  linhaBotoesStatus: {
    flexDirection: "row",
    gap: 10,
  },
  botaoEncerrar: {
    flex: 2,
    backgroundColor: "#dc2626",
    marginBottom: 0,
  },
  botaoReiniciarSecundario: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    marginBottom: 0,
  },
  botaoReiniciarFinalizada: {
    backgroundColor: "#d97706",
  },
  textoBotaoReiniciar: {
    fontWeight: "bold",
    fontSize: 14,
  },
  textoVazio: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.6,
  },
  botaoRota: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  botaoDesabilitado: { opacity: 0.5 },
  textoBotaoRota: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
