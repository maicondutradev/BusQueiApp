# BusQuei

Aplicativo nativo para gerenciamento inteligente de frotas de transporte coletivo, desenvolvido com **Expo**, **React Native**, **TypeScript** e **Firebase**. O projeto foi construído sob o padrão **Offline First**, permitindo que todas as rotinas operacionais continuem funcionando mesmo sem acesso à internet, com sincronização automática assim que a conectividade for restabelecida.

---

## Imagens e Planejamento

<img width="679" height="297" alt="matriz" src="https://github.com/user-attachments/assets/15084e73-96ab-4481-8d52-da3eaea475d5" />

<img width="948" height="326" alt="inventario " src="https://github.com/user-attachments/assets/e6a3eba1-14f2-4b79-b420-21a76cf47588" />

---

## Integrantes

- **Gabriel Caniza da Silva**
- **Gabriel Vidal de Souza**
- **Erick Matheus Ferreira da Costa**
- **Maicon Fonseca Dutra**

---

## Tecnologias Utilizadas

- **Framework:** [Expo](https://expo.dev/) (SDK 54) com [Expo Router](https://docs.expo.dev/router/introduction/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Biblioteca Base:** [React Native](https://reactnative.dev/) (React 19)
- **Backend as a Service:** [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore)
- **Armazenamento Local:** `@react-native-async-storage/async-storage`
- **Detecção de Conectividade:** `@react-native-community/netinfo`
- **Identificadores Únicos:** `expo-crypto` (UUID v4)
- **Feedback Visual & Notificações:** `react-native-toast-message`, `expo-notifications`
- **Compilação & Distribuição:** [EAS Build](https://docs.expo.dev/build/introduction/) (Android APK)

---

## Funcionalidades

- **Autenticação:** Cadastro de novos usuários e login com Firebase Authentication.
- **Gestão de Motoristas:** Cadastro, listagem, edição e exclusão de motoristas com validação de CNH e telefone.
- **Gestão de Ônibus:** Cadastro, listagem, edição e exclusão de veículos da frota com placa, modelo, capacidade e status.
- **Gestão de Rotas:** Controle de linhas, horários de saída/chegada e vínculo de motorista/veículo.
- **Tema Claro e Escuro:** Suporte a alternância de temas via Context API.
- **Segurança Operacional:** Confirmações de segurança em modais antes de qualquer exclusão de registro.

---

## Arquitetura Offline First e Sincronização

O BusQuei foi projetado para operações de campo onde a oscilação de sinal é constante:

1. **Prioridade ao Cache Local:**  
   Ao abrir qualquer listagem, os dados são carregados instantaneamente do `AsyncStorage`, eliminando telas de carregamento bloqueantes.

2. **Fila de Operações Pendentes (`@sync_queue`):**  
   Quando o usuário cria, atualiza ou deleta um registro sem internet:
   - A alteração reflete imediatamente na interface (*Optimistic UI*).
   - O registro recebe um indicador visual de pendência (`PENDENTE`).
   - A operação é gravada em uma fila persistida no dispositivo com um identificador único de sincronização (`clientSyncId`).

3. **Detecção e Sincronização Automática:**  
   O serviço monitora as mudanças de estado de rede via `NetInfo`. Assim que o dispositivo reconecta à internet:
   - A fila pendente é processada sequencialmente contra o Cloud Firestore.
   - Os status transitam para `SINCRONIZANDO` e, após a confirmação do Firebase, o item é removido da fila local.
   - O cache local é reatualizado e o indicador do topo exibe o horário da última sincronização bem-sucedida.

---

## Como Executar o Projeto

### Pré-requisitos
- **Node.js:** versão 20 ou superior
- **Gerenciador de pacotes:** `npm`
- Dispositivo Android com o aplicativo **Expo Go** instalado ou emulador Android configurado.

### 1. Clonar o repositório e instalar as dependências
```bash
git clone https://github.com/maicondutradev/BusQueiApp.git
cd BusQueiApp/BusQueiApp
npm install
```

### 2. Configurar as Variáveis de Ambiente
Copie o modelo de variáveis:
```bash
cp .env.example .env
```
Preencha o arquivo `.env` com as chaves do seu projeto no Firebase:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

### 3. Iniciar o Servidor de Desenvolvimento
```bash
npx expo start
```
- Pressione **`a`** para abrir no emulador Android, ou
- Escaneie o **QR Code** exibido no terminal utilizando o aplicativo **Expo Go** no celular.

---

## Como Gerar o APK Instalável (EAS Build)

O projeto possui configuração pronta para compilação em nuvem gerando o `.apk` direto:

1. Instale o EAS CLI globalmente e faça login:
   ```bash
   npm install --global eas-cli
   npx eas-cli login
   ```

2. Envie as variáveis do `.env` para a nuvem da Expo:
   ```bash
   npx eas-cli env:push preview --path .env
   ```

3. Execute o comando de build:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
4. Ao finalizar, baixe o arquivo `.apk` diretamente pelo link gerado no terminal.

---

## Roteiro de Demonstração da Entrega (P1)

1. **Fluxo Online:** Faça login com suas credenciais e cadastre um registro (ex: Motorista). Mostre que ele foi gravado no Firebase.
2. **Persistência:** Feche totalmente o aplicativo e abra-o novamente. Comprove que os dados foram restaurados do cache local.
3. **Fluxo Offline:** Desative o Wi-Fi e dados móveis do aparelho. Cadastre ou edite um registro. Mostre o aviso informando que foi salvo offline e a barra superior com indicador de item pendente.
4. **Sincronização:** Reative a internet. Mostre a barra superior atualizando e o status do registro sendo alterado para sincronizado com o banco na nuvem.

---

## Verificações de Qualidade e Tipagem

Para garantir a estabilidade do código, execute:
```bash
npm run lint
npm run typecheck
```
