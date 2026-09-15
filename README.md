# BusQuei

Aplicativo nativo para gerenciamento de frota, desenvolvido com Expo, React Native, TypeScript e Firebase.

## Funcionalidades

- Autenticacao por e-mail e senha.
- Cadastro, edicao e exclusao de motoristas, onibus e rotas.
- Persistencia local com AsyncStorage.
- Funcionamento offline com fila de operacoes pendentes.
- Sincronizacao automatica com Firebase quando a conexao retorna.
- Indicadores de conexao, sincronizacao e operacoes pendentes.
- Tema claro/escuro e alertas operacionais.

## Configuracao

Pre-requisitos: Node.js 20+, Android Studio/emulador ou Expo Go, e um projeto Firebase com Authentication por e-mail/senha e Cloud Firestore habilitados.

1. Instale as dependencias: `npm install`.
2. Copie `.env.example` para `.env` e preencha os valores do Firebase.
3. Inicie com `npx expo start`; pressione `a` para Android ou use o QR Code no Expo Go.

## Demonstracao da P1

1. Faca login e cadastre um motorista, um onibus e uma rota.
2. Feche e reabra o aplicativo para demonstrar a persistencia.
3. Desative a internet e cadastre ou edite um registro.
4. Mostre que o registro permanece no app e aparece como operacao pendente.
5. Reative a internet e aguarde o indicador de sincronizacao.
6. Confirme a alteracao no Firebase ou em outro dispositivo.

As telas carregam primeiro o cache local. Criacoes, edicoes e exclusoes sao gravadas em uma fila persistida no aparelho e reenviadas quando a conexao retorna.

## Gerar o APK

Instale e autentique o EAS CLI com `npm install --global eas-cli` e `eas login`. Depois execute:

`eas build --platform android --profile preview`

O perfil `preview` gera um APK instalavel para avaliacao. Baixe o artefato no link exibido pelo EAS.

## Verificacoes locais

- `npm run lint`
- `npx tsc --noEmit`

## Estrutura

- `app/`: rotas e telas.
- `components/`: componentes reutilizaveis.
- `contexts/SyncContext.tsx`: fila offline e sincronizacao.
- `services/offlineCache.ts`: cache local.
- `services/firebaseConfig.ts`: configuracao do Firebase.
