import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

export type RegistroSyncStatus = "SINCRONIZADO" | "PENDENTE" | "SINCRONIZANDO";

interface SyncStatusBadgeProps {
  status?: RegistroSyncStatus;
}

export default function SyncStatusBadge({ status = "SINCRONIZADO" }: SyncStatusBadgeProps) {
  const { isDarkMode } = useTheme();

  let bg = isDarkMode ? "#052e16" : "#f0fdf4";
  let borda = isDarkMode ? "#14532d" : "#bbf7d0";
  let cor = "#16a34a";
  let icone: keyof typeof Ionicons.glyphMap = "checkmark-circle";
  let texto = "SINCRONIZADO";

  if (status === "PENDENTE") {
    bg = isDarkMode ? "#450a0a" : "#fef2f2";
    borda = isDarkMode ? "#7f1d1d" : "#fecaca";
    cor = "#dc2626";
    icone = "time-outline";
    texto = "PENDENTE";
  } else if (status === "SINCRONIZANDO") {
    bg = isDarkMode ? "#451a03" : "#fffbeb";
    borda = isDarkMode ? "#78350f" : "#fde68a";
    cor = "#d97706";
    icone = "sync";
    texto = "SINCRONIZANDO";
  }

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: borda }]}>
      <Ionicons name={icone} size={11} color={cor} />
      <Text style={[styles.texto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    alignSelf: "flex-start",
  },
  texto: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
