import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BotoesAcaoCardProps {
  onPressEditar: () => void;
  onPressExcluir: () => void;
}

export default function BotoesAcaoCard({
  onPressEditar,
  onPressExcluir,
}: BotoesAcaoCardProps) {
  return (
    <View style={styles.cardAcoes}>
      <TouchableOpacity style={styles.botaoEditar} onPress={onPressEditar}>
        <Text style={styles.textoBotaoAcao}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botaoExcluir} onPress={onPressExcluir}>
        <Text style={styles.textoBotaoAcao}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardAcoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    gap: 10,
  },
  botaoEditar: {
    backgroundColor: "#ffc107",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  botaoExcluir: {
    backgroundColor: "#dc3545",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  textoBotaoAcao: { color: "#fff", fontWeight: "bold", fontSize: 12 },
});
