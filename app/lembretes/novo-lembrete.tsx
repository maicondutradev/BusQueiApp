import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import BotaoSalvar from "../../components/BotaoSalvar";
import InputPadrao from "../../components/InputPadrao";
import { useTheme } from "../../contexts/ThemeContext";
import { agendarNotificacaoViagem } from "../../services/lembretesScheduler";
import { salvarLembrete } from "../../services/lembretesStorage";
import type { Rota } from "../../types/rota";

export default function NovoLembrete() {
  const router = useRouter();
  const { tema } = useTheme();

  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState<Date>(() => {
    // Inicia com 10 minutos à frente para conveniência
    const d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    d.setSeconds(0);
    return d;
  });

  const [modoPicker, setModoPicker] = useState<"date" | "time">("date");
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [rotasDisponiveis, setRotasDisponiveis] = useState<Rota[]>([]);
  const [rotaSelecionada, setRotaSelecionada] = useState<Rota | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregarRotas = async () => {
      try {
        const dadosUsuario = await AsyncStorage.getItem("usuario_busquei");
        if (!dadosUsuario) return;
        const { email } = JSON.parse(dadosUsuario);
        const salvas = await AsyncStorage.getItem(`lista_rotas_${email}`);
        if (salvas) {
          setRotasDisponiveis(JSON.parse(salvas));
        }
      } catch (err) {
        console.error("Erro ao carregar rotas no lembrete:", err);
      }
    };
    carregarRotas();
  }, []);

  const abrirSeletorData = () => {
    setModoPicker("date");
    setMostrarPicker(true);
  };

  const abrirSeletorHora = () => {
    setModoPicker("time");
    setMostrarPicker(true);
  };

  const onChangePicker = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setMostrarPicker(false);
    }

    if (event.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      if (modoPicker === "date") {
        // Mantém a hora atual da data selecionada
        const novaData = new Date(selectedDate);
        novaData.setHours(dataSelecionada.getHours());
        novaData.setMinutes(dataSelecionada.getMinutes());
        novaData.setSeconds(0);
        setDataSelecionada(novaData);

        // No Android, se selecionou data, abre em seguida o seletor de hora
        if (Platform.OS === "android") {
          setTimeout(() => {
            setModoPicker("time");
            setMostrarPicker(true);
          }, 300);
        }
      } else {
        // Atualiza horas e minutos
        const novaData = new Date(dataSelecionada);
        novaData.setHours(selectedDate.getHours());
        novaData.setMinutes(selectedDate.getMinutes());
        novaData.setSeconds(0);
        setDataSelecionada(novaData);
      }
    }
  };

  const formatarData = (d: Date) => {
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarHora = (d: Date) => {
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${hora}:${min}`;
  };

  const handleSalvar = async () => {
    // 1. Validação de campos vazios
    if (!titulo.trim()) {
      Toast.show({
        type: "error",
        text1: "Campo Obrigatório",
        text2: "Informe o título do lembrete.",
      });
      return;
    }

    if (!mensagem.trim()) {
      Toast.show({
        type: "error",
        text1: "Campo Obrigatório",
        text2: "Informe a mensagem do lembrete.",
      });
      return;
    }

    // 2. Validação de data/hora passada (particionamento de equivalência)
    const agora = Date.now();
    if (dataSelecionada.getTime() <= agora) {
      const msgErro =
        "O horário agendado deve ser maior que o instante atual.";
      if (Platform.OS === "web") {
        alert(msgErro);
      } else {
        Alert.alert("Horário Inválido", msgErro);
      }
      Toast.show({
        type: "error",
        text1: "Horário Inválido",
        text2: msgErro,
      });
      return;
    }

    try {
      setSalvando(true);

      // 3. Agenda notificação no sistema operacional
      const notificationId = await agendarNotificacaoViagem(
        titulo.trim(),
        mensagem.trim(),
        dataSelecionada,
        {
          rotaId: rotaSelecionada?.id,
          rotaNome: rotaSelecionada?.nomeRota,
        },
      );

      // 4. Salva no AsyncStorage local
      await salvarLembrete({
        title: titulo.trim(),
        message: mensagem.trim(),
        when: dataSelecionada.getTime(),
        status: "Agendado",
        notificationId,
        rotaId: rotaSelecionada?.id,
        rotaNome: rotaSelecionada?.nomeRota,
      });

      Toast.show({
        type: "success",
        text1: "Lembrete Agendado!",
        text2: "A notificação será enviada no horário programado.",
      });

      router.back();
    } catch (error: any) {
      console.error("Erro ao agendar lembrete:", error);
      Toast.show({
        type: "error",
        text1: "Falha ao Agendar",
        text2: error?.message || "Não foi possível agendar o lembrete.",
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tema.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen
        options={{
          title: "Novo Lembrete",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />

      <Text style={[styles.secaoTitulo, { color: tema.text }]}>
        Detalhes do Lembrete de Viagem
      </Text>

      <Text style={[styles.rotulo, { color: tema.text }]}>Título:</Text>
      <InputPadrao
        placeholder="Ex: Embarque - Linha 101 Centro"
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={[styles.rotulo, { color: tema.text }]}>Mensagem:</Text>
      <InputPadrao
        placeholder="Ex: Ônibus com saída prevista em 10 minutos"
        value={mensagem}
        onChangeText={setMensagem}
      />

      {/* Seleção de Linha/Rota existente */}
      {rotasDisponiveis.length > 0 ? (
        <View style={styles.blocoRotas}>
          <Text style={[styles.rotulo, { color: tema.text }]}>
            Associar a uma Linha / Rota (Opcional):
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRotas}>
            <TouchableOpacity
              style={[
                styles.chipRota,
                {
                  backgroundColor: !rotaSelecionada ? tema.primary : tema.card,
                  borderColor: tema.border,
                },
              ]}
              onPress={() => setRotaSelecionada(null)}
            >
              <Text
                style={{
                  color: !rotaSelecionada ? "#fff" : tema.text,
                  fontWeight: "600",
                }}
              >
                Nenhuma
              </Text>
            </TouchableOpacity>
            {rotasDisponiveis.map((r) => {
              const selecionada = rotaSelecionada?.id === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.chipRota,
                    {
                      backgroundColor: selecionada ? tema.primary : tema.card,
                      borderColor: tema.border,
                    },
                  ]}
                  onPress={() => {
                    setRotaSelecionada(r);
                    if (!titulo) {
                      setTitulo(`Embarque - ${r.nomeRota}`);
                    }
                  }}
                >
                  <Text
                    style={{
                      color: selecionada ? "#fff" : tema.text,
                      fontWeight: "600",
                    }}
                  >
                    {r.nomeRota}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Seletor de Data e Hora */}
      <Text style={[styles.rotulo, { color: tema.text, marginTop: 16 }]}>
        Data e Horário do Disparo:
      </Text>

      {Platform.OS === "web" ? (
        <View style={[styles.cardWebInput, { backgroundColor: tema.card, borderColor: tema.border }]}>
          <Text style={{ color: tema.text, marginBottom: 8, fontSize: 13 }}>
            Escolha no formato data/hora:
          </Text>
          <input
            type="datetime-local"
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${tema.border}`,
              backgroundColor: tema.background,
              color: tema.text,
              fontSize: 16,
              width: "100%",
            }}
            value={new Date(
              dataSelecionada.getTime() -
                dataSelecionada.getTimezoneOffset() * 60000,
            )
              .toISOString()
              .slice(0, 16)}
            onChange={(e) => {
              if (e.target.value) {
                setDataSelecionada(new Date(e.target.value));
              }
            }}
          />
        </View>
      ) : (
        <View style={styles.linhaSeletores}>
          <TouchableOpacity
            style={[styles.botaoDataHora, { backgroundColor: tema.card, borderColor: tema.border }]}
            onPress={abrirSeletorData}
          >
            <Ionicons name="calendar-outline" size={20} color={tema.primary} />
            <View>
              <Text style={styles.subRotulo}>Data:</Text>
              <Text style={[styles.valorDataHora, { color: tema.text }]}>
                {formatarData(dataSelecionada)}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botaoDataHora, { backgroundColor: tema.card, borderColor: tema.border }]}
            onPress={abrirSeletorHora}
          >
            <Ionicons name="time-outline" size={20} color={tema.primary} />
            <View>
              <Text style={styles.subRotulo}>Hora:</Text>
              <Text style={[styles.valorDataHora, { color: tema.text }]}>
                {formatarHora(dataSelecionada)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {mostrarPicker && Platform.OS !== "web" ? (
        <DateTimePicker
          value={dataSelecionada}
          mode={modoPicker}
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangePicker}
        />
      ) : null}

      <View style={styles.avisoBox}>
        <Ionicons name="information-circle-outline" size={18} color="#0288D1" />
        <Text style={styles.avisoTexto}>
          O Android gerencia os alarmes e pode ajustar a entrega em condições de economia de bateria.
        </Text>
      </View>

      <View style={{ marginTop: 24 }}>
        {salvando ? (
          <ActivityIndicator size="large" color={tema.primary} />
        ) : (
          <BotaoSalvar onPress={handleSalvar} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 8,
  },
  subRotulo: {
    fontSize: 11,
    color: "#888",
  },
  blocoRotas: {
    marginTop: 8,
  },
  scrollRotas: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  chipRota: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  linhaSeletores: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  botaoDataHora: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  valorDataHora: {
    fontSize: 15,
    fontWeight: "bold",
  },
  cardWebInput: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  avisoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(2, 136, 209, 0.08)",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  avisoTexto: {
    fontSize: 12,
    color: "#0288D1",
    flex: 1,
    lineHeight: 18,
  },
});
