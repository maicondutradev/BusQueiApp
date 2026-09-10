import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSync } from "../contexts/SyncContext";
import { useTheme } from "../contexts/ThemeContext";

export default function NetworkIndicator() {
  const { isConnected, syncQueue, isSyncing, lastSyncTime, sincronizarDados } = useSync();
  const { tema, isDarkMode } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [previousQueueLength, setPreviousQueueLength] = useState(0);

  const pendentes = syncQueue.filter((item) => item.status === "PENDENTE").length;
  const sincronizando = syncQueue.filter((item) => item.status === "SINCRONIZANDO").length;
  const totalQueue = syncQueue.length;

  useEffect(() => {
    if (isConnected && previousQueueLength > 0 && totalQueue === 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
    setPreviousQueueLength(totalQueue);
  }, [totalQueue, isConnected, previousQueueLength]);

  const isOffline = isConnected === false;
  const emSincronizacao = isSyncing || sincronizando > 0;

  let badgeBg = "#16a34a";
  let iconName: keyof typeof Ionicons.glyphMap = "checkmark-circle";
  let badgeTexto = "Conectado";

  if (isOffline) {
    badgeBg = "#dc2626";
    iconName = "cloud-offline";
    badgeTexto = "Offline";
  } else if (emSincronizacao) {
    badgeBg = "#d97706";
    iconName = "sync";
    badgeTexto = pendentes + sincronizando > 0 ? `Sync (${pendentes + sincronizando})` : "Sync...";
  } else if (showSuccess) {
    badgeBg = "#16a34a";
    iconName = "checkmark-circle";
    badgeTexto = "Sincronizado";
  } else {
    badgeBg = isDarkMode ? "#15803d" : "#16a34a";
    iconName = "wifi";
    badgeTexto = "Conectado";
  }

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalAberto(true)}
        style={[styles.badge, { backgroundColor: badgeBg }]}
      >
        <Ionicons name={iconName} size={12} color="#ffffff" />
        <Text style={styles.badgeTexto}>{badgeTexto}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAberto(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalAberto(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: tema.card, borderColor: tema.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTituloContainer}>
                <Ionicons
                  name={isOffline ? "cloud-offline-outline" : "cloud-done-outline"}
                  size={20}
                  color={isOffline ? "#dc2626" : "#16a34a"}
                />
                <Text style={[styles.modalTitulo, { color: tema.text }]}>
                  Sincronização & Rede
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalAberto(false)}
                style={styles.botaoFechar}
              >
                <Ionicons name="close" size={20} color={tema.text} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor: isOffline
                    ? (isDarkMode ? "#450a0a" : "#fef2f2")
                    : (isDarkMode ? "#052e16" : "#f0fdf4"),
                  borderColor: isOffline ? "#dc2626" : "#16a34a",
                },
              ]}
            >
              <View
                style={[
                  styles.statusPonto,
                  { backgroundColor: isOffline ? "#dc2626" : "#16a34a" },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.statusBannerTitulo,
                    { color: isOffline ? "#dc2626" : "#16a34a" },
                  ]}
                >
                  {isOffline ? "Modo Avião / Offline" : "Conexão Ativa"}
                </Text>
                <Text
                  style={[
                    styles.statusBannerSub,
                    { color: isDarkMode ? "#cbd5e1" : "#475569" },
                  ]}
                >
                  {isOffline
                    ? "Suas alterações serão armazenadas e sincronizadas quando a conexão retornar."
                    : "O aplicativo está sincronizado em tempo real com o servidor."}
                </Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <View
                style={[
                  styles.infoLinha,
                  { borderBottomColor: isDarkMode ? "#334155" : "#e2e8f0" },
                ]}
              >
                <View style={styles.infoEsquerda}>
                  <Ionicons name="time-outline" size={18} color={tema.primary} />
                  <Text style={[styles.infoLabel, { color: tema.text }]}>
                    Última sincronização
                  </Text>
                </View>
                <Text style={[styles.infoValor, { color: tema.primary }]}>
                  {lastSyncTime ? lastSyncTime : "Aguardando"}
                </Text>
              </View>

              <View
                style={[
                  styles.infoLinha,
                  { borderBottomColor: isDarkMode ? "#334155" : "#e2e8f0" },
                ]}
              >
                <View style={styles.infoEsquerda}>
                  <Ionicons name="layers-outline" size={18} color={tema.primary} />
                  <Text style={[styles.infoLabel, { color: tema.text }]}>
                    Fila pendente
                  </Text>
                </View>
                <View
                  style={[
                    styles.badgeContagem,
                    {
                      backgroundColor: totalQueue > 0 ? "#fef3c7" : "#dcfce7",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: totalQueue > 0 ? "#b45309" : "#15803d",
                    }}
                  >
                    {totalQueue} {totalQueue === 1 ? "alteração" : "alterações"}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoLinha, { borderBottomWidth: 0 }]}>
                <View style={styles.infoEsquerda}>
                  <Ionicons name="radio-outline" size={18} color={tema.primary} />
                  <Text style={[styles.infoLabel, { color: tema.text }]}>
                    Status do sincronizador
                  </Text>
                </View>
                <Text
                  style={[
                    styles.infoValor,
                    { color: emSincronizacao ? "#d97706" : "#16a34a" },
                  ]}
                >
                  {emSincronizacao ? "Sincronizando..." : "Ocioso (Pronto)"}
                </Text>
              </View>
            </View>

            <View style={styles.acoesContainer}>
              {!isOffline && (
                <TouchableOpacity
                  style={[
                    styles.botaoSincronizar,
                    { backgroundColor: tema.primary, opacity: emSincronizacao ? 0.7 : 1 },
                  ]}
                  disabled={emSincronizacao}
                  onPress={() => sincronizarDados()}
                >
                  {emSincronizacao ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#fff" />
                      <Text style={styles.botaoSincronizarTexto}>
                        Sincronizar Agora
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.botaoFecharModal,
                  {
                    backgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9",
                    borderColor: tema.border,
                  },
                ]}
                onPress={() => setModalAberto(false)}
              >
                <Text style={[styles.botaoFecharModalTexto, { color: tema.text }]}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 14,
    gap: 5,
    marginRight: 6,
  },
  badgeTexto: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTituloContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: "bold",
  },
  botaoFechar: {
    padding: 4,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  statusPonto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  statusBannerTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statusBannerSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  infoContainer: {
    marginBottom: 18,
  },
  infoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoEsquerda: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoValor: {
    fontSize: 13,
    fontWeight: "700",
  },
  badgeContagem: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  acoesContainer: {
    gap: 8,
  },
  botaoSincronizar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  botaoSincronizarTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  botaoFecharModal: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  botaoFecharModalTexto: {
    fontSize: 13,
    fontWeight: "600",
  },
});
