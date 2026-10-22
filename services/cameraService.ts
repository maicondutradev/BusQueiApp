import * as ImagePicker from "expo-image-picker";

export type CapturaFotoResultado =
  | { status: "sucesso"; uri: string }
  | { status: "permissao_negada" }
  | { status: "cancelado" }
  | { status: "erro"; erro: string };

export async function tirarFotoMotorista(): Promise<CapturaFotoResultado> {
  try {
    let permission = await ImagePicker.getCameraPermissionsAsync();

    if (permission.status !== "granted") {
      permission = await ImagePicker.requestCameraPermissionsAsync();
    }

    if (permission.status !== "granted") {
      return { status: "permissao_negada" };
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { status: "cancelado" };
    }

    const asset = result.assets[0];
    const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

    return {
      status: "sucesso",
      uri: imageUri,
    };
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha na câmera";
    return {
      status: "erro",
      erro: mensagem,
    };
  }
}
