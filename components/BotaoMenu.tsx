import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface BotaoMenuTipos {
  titulo: string;
  rota: any;
}

export default function BotaoMenu({ titulo, rota }: BotaoMenuTipos) {
  return (
    <Link href={rota} asChild>
      <TouchableOpacity style={styles.botao}>
        <Text style={styles.textoBotao}>{titulo}</Text>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  botao: {
    backgroundColor: "#0056b3",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: 220,
    alignItems: "center",
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
