import { Href, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface FabButtonProps {
  rota: Href;
}

export default function FabButton({ rota }: FabButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.fab} onPress={() => router.push(rota)}>
      <Text style={styles.fabTexto}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: "#0056b3",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  fabTexto: { fontSize: 32, color: "#fff", lineHeight: 34 },
});
