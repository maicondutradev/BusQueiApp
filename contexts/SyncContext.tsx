import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { baixarDadosParaCache } from "../services/offlineCache";

export type SyncStatus = "PENDENTE" | "SINCRONIZANDO";

export interface SyncItem {
  id: string;
  collectionName: string;
  data?: any;
  status: SyncStatus;
  isEdicao?: boolean;
  idEdicao?: string;
  isExclusao?: boolean;
  idExclusao?: string;
  createdAt: number;
}

interface SyncContextData {
  isConnected: boolean | null;
  syncQueue: SyncItem[];
  isSyncing: boolean;
  lastSyncTime: string | null;
  enfileirarDado: (
    collectionName: string,
    data: any,
    isEdicao?: boolean,
    idEdicao?: string
  ) => Promise<void>;
  excluirDado: (
    collectionName: string,
    idParaExcluir: string
  ) => Promise<void>;
  sincronizarDados: () => Promise<void>;
}

const SyncContext = createContext<SyncContextData>({} as SyncContextData);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const isSyncingRef = useRef(false);

  const formatarHorario = () => {
    const agora = new Date();
    const h = String(agora.getHours()).padStart(2, "0");
    const m = String(agora.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const carregarDadosIniciais = useCallback(async () => {
    try {
      const [queueJson, savedTime] = await Promise.all([
        AsyncStorage.getItem("@sync_queue"),
        AsyncStorage.getItem("@last_sync_time"),
      ]);

      if (queueJson) {
        setSyncQueue(JSON.parse(queueJson));
      }
      if (savedTime) {
        setLastSyncTime(savedTime);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const salvarFila = async (queue: SyncItem[]) => {
    try {
      await AsyncStorage.setItem("@sync_queue", JSON.stringify(queue));
      setSyncQueue(queue);
    } catch (error) {
      console.error(error);
    }
  };

  const sincronizarDados = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        isSyncingRef.current = false;
        setIsSyncing(false);
        return;
      }

      let queueJson = await AsyncStorage.getItem("@sync_queue");
      let currentQueue: SyncItem[] = queueJson ? JSON.parse(queueJson) : [];
      let pendentes = currentQueue.filter((item) => item.status === "PENDENTE");

      if (pendentes.length > 0) {
        currentQueue = currentQueue.map((item) =>
          item.status === "PENDENTE" ? { ...item, status: "SINCRONIZANDO" as SyncStatus } : item
        );
        await salvarFila(currentQueue);

        for (const item of pendentes) {
          try {
            if (item.isExclusao && item.idExclusao) {
              await deleteDoc(doc(db, item.collectionName, item.idExclusao));
            } else if (item.isEdicao && item.idEdicao) {
              await updateDoc(doc(db, item.collectionName, item.idEdicao), item.data);
            } else {
              await addDoc(collection(db, item.collectionName), item.data);
            }

            currentQueue = currentQueue.filter((qItem) => qItem.id !== item.id);
            await salvarFila(currentQueue);
          } catch (error) {
            currentQueue = currentQueue.map((qItem) =>
              qItem.id === item.id ? { ...qItem, status: "PENDENTE" as SyncStatus } : qItem
            );
            await salvarFila(currentQueue);
          }
        }
      }

      const uid = auth.currentUser?.uid || (await AsyncStorage.getItem("@busquei_last_uid"));
      if (uid) {
        await baixarDadosParaCache(uid);
      }

      const horario = formatarHorario();
      setLastSyncTime(horario);
      await AsyncStorage.setItem("@last_sync_time", horario);
    } catch (error) {
      console.error(error);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosIniciais();

    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
      if (state.isConnected) {
        sincronizarDados();
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await AsyncStorage.setItem("@busquei_last_uid", user.uid);
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          baixarDadosParaCache(user.uid);
        }
      }
    });

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      if (state.isConnected) {
        sincronizarDados();
        if (auth.currentUser) {
          baixarDadosParaCache(auth.currentUser.uid);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNet();
    };
  }, [carregarDadosIniciais, sincronizarDados]);

  const enfileirarDado = async (
    collectionName: string,
    data: any,
    isEdicao = false,
    idEdicao?: string
  ) => {
    const syncId = Crypto.randomUUID();
    const newItem: SyncItem = {
      id: syncId,
      collectionName,
      data: { ...data, clientSyncId: data?.clientSyncId || syncId },
      status: "PENDENTE",
      isEdicao,
      idEdicao,
      createdAt: Date.now(),
    };

    const newQueue = [...syncQueue, newItem];
    await salvarFila(newQueue);

    const net = await NetInfo.fetch();
    if (net.isConnected) {
      sincronizarDados();
    }
  };

  const excluirDado = async (collectionName: string, idParaExcluir: string) => {
    const queueJson = await AsyncStorage.getItem("@sync_queue");
    let currentQueue: SyncItem[] = queueJson ? JSON.parse(queueJson) : syncQueue;

    const existsInQueue = currentQueue.find(
      (q) => q.collectionName === collectionName && q.id === idParaExcluir && !q.isEdicao
    );

    if (existsInQueue) {
      const newQueue = currentQueue.filter((q) => q.id !== idParaExcluir);
      await salvarFila(newQueue);
      return;
    }

    let newQueue = currentQueue.filter(
      (q) => !(q.collectionName === collectionName && q.isEdicao && q.idEdicao === idParaExcluir)
    );

    const newItem: SyncItem = {
      id: Crypto.randomUUID(),
      collectionName,
      status: "PENDENTE",
      isExclusao: true,
      idExclusao: idParaExcluir,
      createdAt: Date.now(),
    };

    newQueue = [...newQueue, newItem];
    await salvarFila(newQueue);

    const net = await NetInfo.fetch();
    if (net.isConnected) {
      sincronizarDados();
    }
  };

  return (
    <SyncContext.Provider
      value={{
        isConnected,
        syncQueue,
        isSyncing,
        lastSyncTime,
        enfileirarDado,
        excluirDado,
        sincronizarDados,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => useContext(SyncContext);
