import { Ionicons } from "@expo/vector-icons";
import { type Href, Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import FabButton from "../../components/FabButton";
import { useTheme } from "../../contexts/ThemeContext";
import {
  dispararNotificacaoImediata,
  solicitarPermissaoNotificacoes,
} from "../../services/lembretesScheduler";
import {
  cancelarLembrete,
  listarLembretes,
  removerLembrete,
} from "../../services/lembretesStorage";
import type { Lembrete } from "../../types/lembrete";

export default function Lembretes() {
  const router = useRouter();
  const { tema } = useTheme();
  const [lista, setLista] = useState<Lembrete[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [testando, setTestando] = useState(false);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const lembretes = await listarLembretes();
      setLista(lembretes);
    } catch (error) {
      console.error("Erro ao carregar lembretes:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível carregar os lembretes.",
      });
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, []),
  );

  const handleTestarNotificacao = async () => {
    try {
      setTestando(true);
      await dispararNotificacaoImediata(
        "Teste de Notificação - BusQuei",
        "O canal e a permissão de notificações locais estão ativos!",
      );
      Toast.show({
        type: "success",
        text1: "Notificação enviada",
        text2: "Verifique a bandeja de notificações do seu celular.",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Permissão Negada",
        text2: error?.message || "Habilite as notificações nas configurações.",
      });
    } finally {
      setTestando(false);
    }
  };

  const handleCancelarAgendamento = async (item: Lembrete) => {
    const confirmar = () => {
      cancelarLembrete(item.id).then(() => {
        carregarDados();
        Toast.show({
          type: "success",
          text1: "Cancelado",
          text2: "O agendamento do lembrete foi cancelado.",
        });
      });
    };

    if (Platform.OS === "web") {
      if (window.confirm("Deseja realmente cancelar este lembrete agendado?")) {
        confirmar();
      }
    } else {
      Alert.alert(
        "Cancelar Lembrete",
        "Deseja cancelar o agendamento desta notificação?",
        [
          { text: "Não", style: "cancel" },
          { text: "Sim, Cancelar", style: "destructive", onPress: confirmar },
        ],
      );
    }
  };

  const handleExcluir = async (id: string) => {
    const confirmar = () => {
      removerLembrete(id).then(() => {
        carregarDados();
        Toast.show({
          type: "success",
          text1: "Excluído",
          text2: "Lembrete removido com sucesso.",
        });
      });
    };

    if (Platform.OS === "web") {
      if (window.confirm("Excluir este lembrete do histórico?")) {
        confirmar();
      }
    } else {
      Alert.alert("Excluir Lembrete", "Deseja remover este registro?", [
        { text: "Não", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: confirmar },
      ]);
    }
  };

  const formatarDataHora = (timestamp: number) => {
    const d = new Date(timestamp);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${ano} às ${hora}:${min}`;
  };

  const renderBadgeStatus = (status: Lembrete["status"]) => {
    let cor = "#1976D2";
    let bg = "#E3F2FD";

    if (status === "Agendado") {
      cor = "#2E7D32";
      bg = "#E8F5E9";
    } else if (status === "Cancelado") {
      cor = "#C62828";
      bg = "#FFEBEE";
    } else if (status === "Publicado") {
      cor = "#6A1B9A";
      bg = "#F3E5F5";
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeTexto, { color: cor }]}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Lembretes de Viagem",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />

      {/* Botão de teste imediato da notificação */}
      <TouchableOpacity
        style={[styles.botaoTeste, { backgroundColor: tema.card, borderColor: tema.border }]}
        onPress={handleTestarNotificacao}
        disabled={testando}
      >
        <Ionicons name="notifications-outline" size={20} color={tema.primary} />
        <Text style={[styles.textoBotaoTeste, { color: tema.primary }]}>
          {testando ? "Disparando..." : "Testar Notificação Agora"}
        </Text>
      </TouchableOpacity>

      {carregando ? (
        <ActivityIndicator size="large" color={tema.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listaContainer}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: tema.card, borderColor: tema.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.tituloArea}>
                  <Ionicons name="bus-outline" size={18} color={tema.primary} />
                  <Text style={[styles.cardTitulo, { color: tema.text }]}>
                    {item.title}
                  </Text>
                </View>
                {renderBadgeStatus(item.status)}
              </View>

              <Text style={[styles.cardMensagem, { color: tema.text }]}>
                {item.message}
              </Text>

              {item.rotaNome ? (
                <Text style={[styles.rotaAssociada, { color: tema.primary }]}>
                  Linha: {item.rotaNome}
                </Text>
              ) : null}

              <View style={styles.dataContainer}>
                <Ionicons name="time-outline" size={15} color="#888" />
                <Text style={styles.dataTexto}>
                  {formatarDataHora(item.when)}
                </Text>
              </View>

              <View style={styles.acoesContainer}>
                {item.status === "Agendado" ? (
                  <TouchableOpacity
                    style={styles.botaoCancelar}
                    onPress={() => handleCancelarAgendamento(item)}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#d32f2f" />
                    <Text style={styles.textoBotaoCancelar}>Cancelar Agendamento</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => handleExcluir(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="alarm-outline" size={54} color="#aaa" />
              <Text style={[styles.vazioTitulo, { color: tema.text }]}>
                Nenhum lembrete cadastrado
              </Text>
              <Text style={styles.vazioSub}>
                Toque no botão abaixo (+) para agendar um lembrete de partida de ônibus.
              </Text>
            </View>
          }
        />
      )}

      <FabButton rota={"lembretes/novo-lembrete" as Href} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  botaoTeste: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  textoBotaoTeste: {
    fontSize: 14,
    fontWeight: "600",
  },
  listaContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tituloArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTexto: {
    fontSize: 12,
    fontWeight: "bold",
  },
  cardMensagem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.9,
  },
  rotaAssociada: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  dataContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  dataTexto: {
    fontSize: 13,
    color: "#888",
  },
  acoesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.15)",
    paddingTop: 10,
    marginTop: 4,
  },
  botaoCancelar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#FFEBEE",
  },
  textoBotaoCancelar: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  botaoExcluir: {
    padding: 6,
  },
  vazio: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 8,
  },
  vazioTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 10,
  },
  vazioSub: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});

