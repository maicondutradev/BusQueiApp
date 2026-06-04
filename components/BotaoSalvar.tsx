import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface BotaoSalvarTipos {
  onPress: () => void;
  titulo?: string;
}

export default function BotaoSalvar({
  onPress,
  titulo = "Salvar",
}: BotaoSalvarTipos) {
  return (
    <TouchableOpacity style={styles.botaoSalvar} onPress={onPress}>
      <Text style={styles.textoBotao}>{titulo}</Text>
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
