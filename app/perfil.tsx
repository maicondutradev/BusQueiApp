import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BotaoSalvar from "../components/BotaoSalvar";
import InputPadrao from "../components/InputPadrao";
import { useTheme } from "../contexts/ThemeContext";

export default function Perfil() {
  const router = useRouter();
  const { tema } = useTheme();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      const dados = await AsyncStorage.getItem("usuario_busquei");
      if (dados) {
        const usuario = JSON.parse(dados);
        setNome(usuario.nome);
        setEmail(usuario.email);
        setSenha(usuario.senha);
      }
    };
    carregarDados();
  }, []);

  const handleSalvar = async () => {
    try {
      const dadosSessao = await AsyncStorage.getItem("usuario_busquei");
      if (!dadosSessao) return;

      const usuarioAntigo = JSON.parse(dadosSessao);
      const emailAntigo = usuarioAntigo.email;

      if (emailAntigo !== email) {
        const categorias = ["motoristas", "onibus", "rotas"];

        for (const cat of categorias) {
          const chaveAntiga = `lista_${cat}_${emailAntigo}`;
          const chaveNova = `lista_${cat}_${email}`;
          const dadosParaMigrar = await AsyncStorage.getItem(chaveAntiga);

          if (dadosParaMigrar) {
            await AsyncStorage.setItem(chaveNova, dadosParaMigrar);
            await AsyncStorage.removeItem(chaveAntiga);
          }
        }
      }

      const usuariosSalvos = await AsyncStorage.getItem("usuarios_cadastrados");
      let listaUsuarios = usuariosSalvos ? JSON.parse(usuariosSalvos) : [];

      const novoUsuario = { nome, email, senha };
      const index = listaUsuarios.findIndex(
        (u: any) => u.email === emailAntigo,
      );

      if (index !== -1) {
        listaUsuarios[index] = novoUsuario;
        await AsyncStorage.setItem(
          "usuarios_cadastrados",
          JSON.stringify(listaUsuarios),
        );
      }

      await AsyncStorage.setItem(
        "usuario_busquei",
        JSON.stringify(novoUsuario),
      );

      Alert.alert("Sucesso", "Perfil e dados atualizados!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar o perfil.");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("sessaoAtiva");
    router.replace("./login");
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen
        options={{
          title: "Meu Perfil",
          headerStyle: { backgroundColor: tema.card },
          headerTintColor: tema.text,
        }}
      />

      <InputPadrao placeholder="Nome" value={nome} onChangeText={setNome} />
      <InputPadrao
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <InputPadrao
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <BotaoSalvar titulo="Atualizar Dados" onPress={handleSalvar} />

      <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
        <Text style={styles.textoBotaoSair}>Sair da Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  botaoSair: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  textoBotaoSair: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
