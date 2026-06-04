import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from "react-native";

interface BotaoSalvarTipos {
  onPress: () => void;
  titulo?: string;
  isLoading?: boolean;
}

export default function BotaoSalvar({
  onPress,
  titulo = "Salvar",
  isLoading = false,
}: BotaoSalvarTipos) {
  return (
    <TouchableOpacity 
      style={[styles.botaoSalvar, isLoading && { opacity: 0.7 }]} 
      onPress={onPress} 
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.textoBotao}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botaoSalvar: {
    backgroundColor: "#0056b3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
