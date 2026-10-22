# Aula 2 — BusQuei

## Equipe e ambiente
- **Integrantes:** Maicon Fonseca Dutra e Gabriel Caniza da Silva
- **Disciplina:** Laboratório de Desenvolvimento de Aplicativos Nativos (Prof. Lucas Hermenegildo do Nascimento)
- **Tecnologias:** React Native, Expo SDK 54, TypeScript, Firebase (Auth e Firestore), AsyncStorage, NetInfo, Expo Image Picker, EAS Build
- **Dispositivo e SO de teste:** Smartphone Android 14 (APK standalone gerado via EAS Build profile preview)
- **Repositório:** [https://github.com/maicondutradev/BusQueiApp](https://github.com/maicondutradev/BusQueiApp)

---

## Primeiro fluxo
- **Requisito (RF01):** O aplicativo deve permitir a captura de foto através da câmera nativa do smartphone e confirmar sua associação ao cadastro/edição de motoristas da frota.
- **Critério de aceite:** Ao conceder a permissão e acionar a câmera, a foto capturada deve ser exibida na área de prévia do formulário e vinculada ao registro do motorista após salvar, sendo exibida em seu card na listagem. Em caso de recusa de permissão ou cancelamento da captura, o formulário deve permanecer disponível com todos os dados digitados preservados e nenhuma nova imagem associada.
- **Telas envolvidas:**
  - `app/motoristas/novo-motorista.tsx`: Formulário de criação/edição com avatar interativo, botão de disparo de câmera e botão de descarte de prévia.
  - `app/motoristas/motoristas.tsx`: Listagem geral com cards dos motoristas exibindo foto real ou iniciais como fallback.
- **Sequência implementada:**
  1. O usuário entra na tela de motoristas e clica no botão flutuante `+` (Novo Motorista).
  2. No topo do formulário, clica no botão "Fotografar".
  3. O app verifica e solicita a permissão de câmera ao sistema operacional.
  4. A câmera do dispositivo é acionada, permitindo tirar a foto e recortá-la no formato 1:1.
  5. Após confirmação, a foto é exibida imediatamente na prévia do formulário.
  6. O usuário preenche os demais campos (Nome, CNH, Telefone) e clica em "Salvar".
  7. O motorista é persistido localmente (`AsyncStorage`), enfileirado para sincronização com Firestore e exibido no card da lista com o avatar da foto.

---

## Recurso nativo e alternativas
- **Recurso e biblioteca:** Câmera nativa via biblioteca `expo-image-picker` configurada com permissão de sistema no `app.json` e serviço dedicado em `services/cameraService.ts`.
- **Permissão concedida:** Abre a interface da câmera com enquadramento quadrado (1:1), compactação de imagem e geração de URI/Base64 para compatibilidade com armazenamento local e Firestore.
- **Recusa de permissão:** Acesso à câmera é interrompido de forma graciosa; o app exibe notificação via Toast ("Permissão de câmera negada: Habilite a câmera nas configurações do aparelho") e mantém o formulário intacto sem perda de campos já digitados.
- **Cancelamento:** Se o usuário aciona a câmera e pressiona o botão voltar/cancelar sem registrar a foto, o app detecta `result.canceled`, exibe notificação ("Captura cancelada: Nenhuma foto foi alterada") e preserva o estado anterior da imagem sem salvar dados nulos.
- **Tratamento de falhas:** Chamada encapsulada em bloco `try/catch` tratando exceções inesperadas de hardware com feedback visual amigável ao usuário.

---

## Projeto dos testes

### Técnicas Selecionadas e Justificadas

- **T01 — Particionamento de Equivalência:**
  - **Justificativa:** O acesso ao hardware da câmera é controlado pela concessão ou recusa de permissão pelo sistema operacional. Esse comportamento divide o domínio de entrada em duas classes disjuntas que conduzem a comportamentos distintos no aplicativo:
    - *Classe Válida (CE1):* Permissão concedida pelo usuário $\rightarrow$ aciona a câmera normalmente (representado por **CT01**).
    - *Classe Inválida (CE2):* Permissão recusada/revogada pelo usuário $\rightarrow$ impede a câmera e apresenta feedback visual sem travar o aplicativo (representado por **CT02**).
  - **Casos associados:** `CT01`, `CT02`.

- **T02 — Transição de Estados:**
  - **Justificativa:** O fluxo de inclusão e edição de imagem transita entre estados bem definidos: `[E0: Formulário sem foto]` $\rightarrow$ `[E1: Câmera aberta]` $\rightarrow$ `[E2: Prévia temporária]` $\rightarrow$ `[E3: Registro salvo com foto]`. As ações de cancelar e refazer/descartar alteram os estados do fluxo e devem garantir que fotos rejeitadas não sejam persistidas indevidamente.
  - **Casos associados:** `CT03`, `CT04`.

- **Localização da planilha:** `docs/testes/Aula_2_Projeto_e_Documentacao_de_Testes.xlsx`

### Matriz dos Quatro Casos de Teste Documentados

| ID | Requisito | Cenário | Técnica | Pré-condições | Dados de Teste | Passos | Resultado Esperado |
|---|---|---|---|---|---|---|---|
| **CT01** | RF01 | Conceder permissão de câmera, fotografar com sucesso e salvar motorista | T01 (Particionamento de Equivalência) | Usuário autenticado; formulário aberto | Nome: "Carlos Teste Silva", CNH: "12345678900", Telefone: "24999998888" | 1. Clicar em 'Fotografar'. 2. Conceder permissão. 3. Fotografar e confirmar 1:1. 4. Preencher dados. 5. Salvar. | Foto na prévia; motorista salvo com foto e card na lista exibe avatar com a foto. |
| **CT02** | RF01 | Negar permissão de câmera ao acionar captura | T01 (Particionamento de Equivalência) | Formulário aberto; campos preenchidos; permissão revogada | Nome: "Marcos Permissao Negada", CNH: "98765432100" | 1. Preencher nome. 2. Clicar em 'Fotografar'. 3. Clicar em 'Não permitir' no diálogo do Android. | Toast de erro de permissão exibido; tela intacta e dados digitados preservados. |
| **CT03** | RF01 | Abrir câmera e cancelar a captura sem tirar foto | T02 (Transição de Estados) | Formulário aberto sem foto; permissão concedida | Nome: "Julio Cancelado", CNH: "11223344556" | 1. Preencher dados. 2. Clicar em 'Fotografar'. 3. Clicar em Cancelar/Voltar na câmera. | Retorno ao formulário; Toast de cancelamento; avatar permanece sem foto e dados preservados. |
| **CT04** | RF01 | Capturar foto, visualizar prévia e descartar antes de salvar | T02 (Transição de Estados) | Formulário aberto; permissão concedida | Nome: "Renato Descarte", CNH: "55667788990", Foto temporária | 1. Clicar em 'Fotografar'. 2. Tirar foto e confirmar. 3. Clicar em 'Descartar foto'. 4. Salvar motorista. | Ao descartar, foto é removida da prévia; motorista salvo sem foto (card com iniciais). |

---

## Execuções e evidências

| ID Execução | Caso | Data | Executor | Dispositivo / SO | Resultado | Situação | Evidência |
|---|---|---|---|---|---|---|---|
| **EX01** | CT01 | 22/10/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Foto capturada, prévia exibida e salva com sucesso no card | Aprovado | [EX01_CT01_sucesso_captura.png](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX01_CT01_sucesso_captura.png) |
| **EX02** | CT02 | 22/10/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Toast de erro exibido e campos do formulário preservados | Aprovado | [EX02_CT02_permissao_negada.png](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX02_CT02_permissao_negada.png) |
| **EX03** | CT03 | 22/10/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Câmera fechada, formulário intacto e nenhum dado perdido | Aprovado | [EX03_CT03_cancelamento.png](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX03_CT03_cancelamento.png) |
| **EX04** | CT04 | 22/10/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Prévia descartada com sucesso; cadastro salvo sem foto | Aprovado | [EX04_CT04_descartar_previa.png](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX04_CT04_descartar_previa.png) |

*Observação: As capturas de tela devem ser depositadas na pasta `docs/evidencias/` com os respectivos nomes de arquivo indicados.*

---

## Defeitos e pendências
- **Defeitos encontrados:** Nenhum defeito bloqueante ou de regressão encontrado nos 4 fluxos principais testados.
- **Limitações:** A captura de câmera em ambiente web possui limitações de drivers dependendo do navegador, sendo o ambiente preferencial e oficial de teste o dispositivo móvel Android.
- **Tratamento de imagem:** As imagens são capturadas com taxa de qualidade otimizada para armazenamento eficiente no AsyncStorage e Cloud Firestore, respeitando o padrão Offline First da aplicação.

---

## Evolução
- **Commit da Aula 2:** `Implementa captura de foto do motorista e documenta testes da aula 2`
- **Próximos passos para a Aula 3:**
  1. Criação de testes automatizados com Jest para validação de fluxos e regras de negócio de imagem e motoristas.
  2. Refinamento da persistência offline de fotos e sincronização em segundo plano.
- **Planejamento para a Aula 4:**
  - Ampliar o conjunto de casos documentados de 4 para pelo menos 8 casos (cobrindo edição de foto existente, fotos pesadas, múltiplos motoristas, sincronização sem conexão e buscas).
