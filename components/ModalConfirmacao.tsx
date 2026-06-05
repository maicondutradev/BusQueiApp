import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface ModalConfirmacaoProps {
  visivel: boolean;
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ModalConfirmacao({
  visivel,
  titulo,
  mensagem,
  textoBotaoConfirmar = "Confirmar",
  onConfirmar,
  onCancelar,
}: ModalConfirmacaoProps) {
  const { tema } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visivel}
      onRequestClose={onCancelar}
    >
      <View style={styles.overlay}>
        <View style={[styles.caixa, { backgroundColor: tema.card }]}>
          <Text style={[styles.titulo, { color: tema.text }]}>{titulo}</Text>
          <Text style={[styles.mensagem, { color: tema.text }]}>{mensagem}</Text>
          <View style={styles.botoes}>
            <TouchableOpacity
              style={[styles.botao, { backgroundColor: "#6c757d" }]}
              onPress={onCancelar}
            >
              <Text style={styles.textoBotao}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botao, { backgroundColor: "#dc3545" }]}
              onPress={onConfirmar}
            >
              <Text style={styles.textoBotao}>{textoBotaoConfirmar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  caixa: {
    width: "100%",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  mensagem: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  botoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  botao: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
