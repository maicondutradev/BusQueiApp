import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Lembrete, StatusLembrete } from "../types/lembrete";
import { cancelarNotificacaoAgendada } from "./lembretesScheduler";

const CHAVE_LEMBRETES = "@busquei:lembretes";

export async function listarLembretes(): Promise<Lembrete[]> {
  try {
    const dados = await AsyncStorage.getItem(CHAVE_LEMBRETES);
    if (!dados) return [];

    const lista: Lembrete[] = JSON.parse(dados);
    const agora = Date.now();

    // Atualiza automaticamente status de lembretes passados
    let houveAlteracao = false;
    const listaAtualizada = lista.map((lembrete) => {
      if (lembrete.status === "Agendado" && lembrete.when <= agora) {
        houveAlteracao = true;
        return { ...lembrete, status: "Publicado" as StatusLembrete };
      }
      return lembrete;
    });

    if (houveAlteracao) {
      await AsyncStorage.setItem(
        CHAVE_LEMBRETES,
        JSON.stringify(listaAtualizada),
      );
    }

    // Ordena decrescente por data/hora
    return listaAtualizada.sort((a, b) => b.when - a.when);
  } catch (error) {
    console.error("Erro ao listar lembretes:", error);
    return [];
  }
}

export async function salvarLembrete(
  novo: Omit<Lembrete, "id" | "criadoEm">,
): Promise<Lembrete> {
  const lista = await listarLembretes();
  const id = `lembrete_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const lembreteCriado: Lembrete = {
    ...novo,
    id,
    criadoEm: Date.now(),
  };

  lista.unshift(lembreteCriado);
  await AsyncStorage.setItem(CHAVE_LEMBRETES, JSON.stringify(lista));
  return lembreteCriado;
}

export async function cancelarLembrete(id: string): Promise<Lembrete | null> {
  const lista = await listarLembretes();
  let cancelado: Lembrete | null = null;

  const listaAtualizada = await Promise.all(
    lista.map(async (item) => {
      if (item.id === id) {
        if (item.status === "Agendado" && item.notificationId) {
          await cancelarNotificacaoAgendada(item.notificationId);
        }
        cancelado = { ...item, status: "Cancelado" };
        return cancelado;
      }
      return item;
    }),
  );

  await AsyncStorage.setItem(
    CHAVE_LEMBRETES,
    JSON.stringify(listaAtualizada),
  );
  return cancelado;
}

export async function removerLembrete(id: string): Promise<void> {
  const lista = await listarLembretes();
  const item = lista.find((l) => l.id === id);

  if (item && item.notificationId && item.status === "Agendado") {
    await cancelarNotificacaoAgendada(item.notificationId);
  }

  const novaLista = lista.filter((l) => l.id !== id);
  await AsyncStorage.setItem(CHAVE_LEMBRETES, JSON.stringify(novaLista));
}

