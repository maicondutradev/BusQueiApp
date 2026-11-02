# Aula 3 — BusQuei: Notificações e Lembretes Locais

## Equipe e ambiente
- **Integrantes:** Maicon Fonseca Dutra e Gabriel Caniza da Silva
- **Disciplina:** Laboratório de Desenvolvimento de Aplicativos Nativos
- **Professor:** Lucas Hermenegildo do Nascimento
- **Data:** Novembro de 2026 — Universidade de Vassouras, Campus Saquarema
- **Tecnologias:** React Native, Expo SDK 54, TypeScript, `expo-notifications`, `@react-native-community/datetimepicker`, AsyncStorage, EAS Build
- **Dispositivo e SO de teste:** Smartphone Android 14 (APK standalone gerado via EAS Build) e Emulador Android API 34
- **Repositório:** [https://github.com/maicondutradev/BusQueiApp](https://github.com/maicondutradev/BusQueiApp)

---

## Fluxo nativo implementado: Notificações e Lembretes Locais
- **Requisito (RF02):** O aplicativo deve permitir ao usuário programar lembretes locais para partidas de ônibus ou itinerários de linhas cadastradas, consultar o histórico de lembretes, cancelar um agendamento antes de seu disparo e receber a notificação nativa no sistema operacional, abrindo o aplicativo ao tocá-la.
- **Critério de aceite:** O formulário deve validar obrigatoriamente título, mensagem e exigir que a data/hora escolhida seja estritamente futura em relação ao instante atual. O alarme deve ser registrado no subsistema de notificações do dispositivo (`NotificationChannel` de alta prioridade com som e vibração). A concessão de permissão (`POST_NOTIFICATIONS` no Android 13+) deve ser solicitada de forma graciosa. Lembretes agendados podem ser cancelados a qualquer instante antes do horário, desmarcando o alarme do sistema operacional e atualizando o status para `Cancelado`.
- **Telas envolvidas:**
  - `app/lembretes/lembretes.tsx`: Tela de gestão, exibição da lista com badges de status (`Agendado`, `Cancelado`, `Publicado`), botão de cancelamento de alarme ativo e botão de teste imediato do canal.
  - `app/lembretes/novo-lembrete.tsx`: Formulário de criação com seleção de título, mensagem, associação opcional à linha de ônibus e seleção de data e hora com validação síncrona.
  - `app/index.tsx`: Ponto de entrada no menu principal ("Lembretes de Viagem").

---

## Recursos nativos e integração com o sistema
- **Recurso e biblioteca:** APIs nativas do Android encapsuladas por `expo-notifications` e `@react-native-community/datetimepicker`.
- **Canal de Notificação (Android 8.0+ / API 26):** Criado o canal `lembretes-viagem` ("Lembretes de Viagem - BusQuei") com importância `MAX`, luz de notificação, padrão de vibração e som ativo.
- **Permissão de Notificação (Android 13+ / API 33):** Solicitação em tempo de execução da permissão `POST_NOTIFICATIONS` declarada no `app.json`.
- **Agendamento em segundo plano:** Uso de gatilho do tipo `DATE` repassado ao `AlarmManager`/`NotificationManager` do Android, permitindo entrega mesmo com o aplicativo em segundo plano ou fechado.
- **Cancelamento:** Chamada a `cancelScheduledNotificationAsync` com o identificador do agendamento, removendo o evento da fila do sistema.

---

## Matriz de Casos de Teste (Mínimo de 6 Casos Documentados)

Esta matriz mantém os 4 casos de teste da Aula 2 (fluxo nativo de câmera de motoristas) e adiciona os novos casos da Aula 3 (lembretes locais e particionamento de equivalência temporal).

| ID | Requisito | Cenário | Técnica | Pré-condições | Dados de Teste | Passos | Resultado Esperado | Status |
|---|---|---|---|---|---|---|---|:---:|
| **CT01** | RF01 | Conceder permissão de câmera, fotografar com sucesso e salvar motorista (Aula 2) | Particionamento de Equivalência | Formulário aberto | Nome: "Carlos Teste", CNH: "12345678900" | 1. Tocar em Fotografar. 2. Permitir câmera. 3. Fotografar e confirmar. 4. Salvar. | Foto na prévia; motorista salvo com foto no card. | **Aprovado** |
| **CT02** | RF01 | Negar permissão de câmera ao acionar captura (Aula 2) | Particionamento de Equivalência | Permissão revogada | Nome: "Marcos Teste", CNH: "98765432100" | 1. Tocar em Fotografar. 2. Clicar em 'Não permitir'. | Toast de erro exibido; dados preservados. | **Aprovado** |
| **CT03** | RF01 | Abrir câmera e cancelar a captura sem tirar foto (Aula 2) | Transição de Estados | Permissão concedida | Nome: "Julio Teste", CNH: "11223344556" | 1. Tocar em Fotografar. 2. Pressionar voltar/cancelar. | Retorno ao formulário sem perda de dados. | **Aprovado** |
| **CT04** | RF01 | Capturar foto, visualizar prévia e descartar antes de salvar (Aula 2) | Transição de Estados | Permissão concedida | Nome: "Renato Descarte", CNH: "55667788990" | 1. Tirar foto. 2. Clicar em 'Descartar foto'. 3. Salvar. | Prévia removida; motorista salvo sem foto. | **Aprovado** |
| **CT05** | RF02 | Agendamento de lembrete com horário futuro (Aula 3 - Obrigatório) | Particionamento de Equivalência | Permissão de notificações concedida | Título: "Embarque Linha 101", Msg: "Ônibus em 5 min", Data/Hora: +5 minutos | 1. Preencher título/mensagem. 2. Selecionar horário 5 min à frente. 3. Salvar. 4. Colocar app em segundo plano. | Não publicar antes do horário; notificação exibida na barra de status no horário previsto; toque abre o app. | **Aprovado** |
| **CT06** | RF02 | Validação com horário passado (Aula 3 - Particionamento de Equivalência) | Particionamento de Equivalência / Valor Limite | Formulário de lembrete aberto | Título: "Viagem Anterior", Msg: "Teste", Data/Hora: 10 minutos no passado | 1. Preencher título e mensagem. 2. Selecionar horário no passado. 3. Tocar em Salvar. | Sistema rejeita o agendamento, exibe mensagem de horário inválido e nenhum alarme é registrado no SO. | **Aprovado** |
| **CT07** | RF02 | Cancelamento de lembrete antes do disparo (Aula 3 - Complementar) | Transição de Estados | Lembrete cadastrado com status 'Agendado' | Lembrete agendado para 30 minutos à frente | 1. Acessar lista de lembretes. 2. Tocar em 'Cancelar Agendamento'. 3. Confirmar diálogo. | Alarme cancelado no sistema operacional; status atualizado para 'Cancelado'; sem disparo posterior. | **Aprovado** |
| **CT08** | RF02 | Validação de campos obrigatórios vazios (Aula 3 - Complementar) | Análise de Valor Limite | Formulário aberto | Título em branco, Mensagem em branco, Horário futuro | 1. Deixar título e mensagem vazios. 2. Clicar em Salvar. | Bloqueio imediato com alerta de preenchimento obrigatório sem criar agendamento. | **Aprovado** |

---

## Execuções e Evidências

| ID Execução | Caso | Data | Executor | Dispositivo / SO | Resultado | Situação | Evidência |
|---|---|---|---|---|---|:---:|:---:|
| **EX01** | CT01 | 22/10/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Foto capturada e salva com sucesso no card | Aprovado | [EX01_CT01_sucesso_captura.png](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX01_CT01_sucesso_captura.png) |
| **EX02** | CT02 | 22/10/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Feedback de recusa exibido; formulário preservado | Aprovado | [EX02_CT02_permissao_negada.png](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX02_CT02_permissao_negada.png) |
| **EX03** | CT03 | 22/10/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Câmera fechada e dados preservados | Aprovado | [EX03_CT03_cancelamento.png](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX03_CT03_cancelamento.png) |
| **EX04** | CT04 | 22/10/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Prévia descartada; registro salvo sem foto | Aprovado | [EX04_CT04_descartar_previa.png](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX04_CT04_descartar_previa.png) |
| **EX05** | CT05 | 02/11/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Alarme agendado; notificação entregue na bandeja com app em 2º plano e toque abriu o app | Aprovado | [EX05_CT05_agendamento_notificacao.jpg](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX05_CT05_agendamento_notificacao.jpg) |
| **EX06** | CT06 | 02/11/2026 | Gabriel Caniza | Android 14 (APK EAS Build) | Alerta "O horário agendado deve ser maior que o instante atual" exibido; nenhum alarme salvo | Aprovado | [EX06_CT06_validacao_horario_passado.jpg](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX06_CT06_validacao_horario_passado.jpg) |
| **EX07** | CT07 | 02/11/2026 | Maicon Fonseca | Android 14 (APK EAS Build) | Notificação cancelada no SO e status alterado para 'Cancelado' | Aprovado | [EX07_CT07_cancelamento_lembrete.jpg](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX07_CT07_cancelamento_lembrete.jpg) |
| **EX08** | CT08 | 02/11/2026 | Gabriel Caniza | Android 14 (APK EAS Build) | Toast de validação bloqueou envio com campos vazios | Aprovado | [EX08_CT08_validacao_campos_vazios.jpg](file:///g:/BusQueiApp/BusQueiApp/docs/evidencias/EX08_CT08_validacao_campos_vazios.jpg) |

*Observação: As capturas de tela devem ser depositadas na pasta `docs/evidencias/` com os respectivos nomes de arquivo indicados.*

---

## Análise de Particionamento de Equivalência e Valores Limite (CT05 vs CT06)
- **Classe Válida:** Instante $T_{alvo} > T_{atual}$. O sistema autoriza o agendamento, persiste o registro como `Agendado` e agenda a notificação no Android via `expo-notifications`.
- **Classe Inválida:** Instante $T_{alvo} \le T_{atual}$. A validação síncrona interrompe a operação antes de acessar o subsistema de alarmes, protegendo contra notificações fantasmas ou travamentos.
- **Valor Limite (Fronteira):** O limiar é o timestamp no instante da confirmação ($T_{atual}$). Como os segundos são zerados no seletor para conveniência visual, a orientação da aplicação é selecionar pelo menos 1 minuto à frente para compensar o tempo de interação humana.

---

## Limitações Técnicas do Sistema Android (Seção 8)
1. **Inexatidão do Agendamento (Android 12+ / Doze Mode):** Por padrão de conservação de bateria no Android 12+, alarmes sem permissão especial de alarme exato operam em janelas aproximadas do sistema. O sistema operacional pode adiar entregas em condições de bateria fraca ou Doze Mode ativo.
2. **Ciclo de Reinicialização (Boot):** Os alarmes agendados na memória do AlarmManager são eliminados pelo kernel do Android quando o aparelho é desligado ou reiniciado. Embora o registro permaneça salvo no `AsyncStorage`, para que o alarme toque após o boot em ambiente de produção seria necessário um `BroadcastReceiver` com permissão `RECEIVE_BOOT_COMPLETED`.
3. **Forçar Parada (Force Stop):** Se o usuário executar "Forçar Parada" nas configurações do aplicativo no Android, o sistema suspende o recebimento de alarmes até que o usuário abra manualmente o aplicativo.
4. **Permissões Granulares:** No Android 13+ (API 33), a revogação de notificações nas configurações do sistema inibe a exibição visual da notificação, embora a lógica interna continue sendo executada.
5. **Transação Não-Atômica:** O salvamento no armazenamento local (`AsyncStorage`) e a chamada ao agendador do SO são etapas consecutivas. Uma falha inesperada entre as duas chamadas pode gerar disparidade de status, sendo uma característica prevista para apps educacionais.

---

## Evolução e Commits
- **Commit da Aula 2:** `feat: implementa captura de foto do motorista e documenta testes da aula 2`
- **Commit da Aula 3:** `feat: adiciona lembretes locais e documenta testes da aula 3`

