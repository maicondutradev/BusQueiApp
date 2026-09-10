import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function salvarCacheLocal(chave: string, dados: any[]): Promise<void> {
  try {
    const json = JSON.stringify(dados);
    await AsyncStorage.setItem(`@busquei_cache_${chave}`, json);
    const prefixo = chave.split("_")[0];
    await AsyncStorage.setItem(`@busquei_cache_${prefixo}_last`, json);
  } catch (error) {
    console.error(error);
  }
}

export async function carregarCacheLocal<T>(chave: string): Promise<T[]> {
  try {
    const dados = await AsyncStorage.getItem(`@busquei_cache_${chave}`);
    if (dados !== null) {
      const parsed = JSON.parse(dados);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    const prefixo = chave.split("_")[0];
    const last = await AsyncStorage.getItem(`@busquei_cache_${prefixo}_last`);
    if (last !== null) {
      const parsedLast = JSON.parse(last);
      if (Array.isArray(parsedLast)) {
        return parsedLast;
      }
    }
    return [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function baixarDadosParaCache(userId: string): Promise<void> {
  if (!userId) return;

  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  const colecoes = ["motoristas", "onibus", "rotas"];

  for (const col of colecoes) {
    try {
      const q = query(collection(db, col), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      if (!snapshot.metadata.fromCache || snapshot.docs.length > 0) {
        const lista = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        await salvarCacheLocal(`${col}_${userId}`, lista);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
