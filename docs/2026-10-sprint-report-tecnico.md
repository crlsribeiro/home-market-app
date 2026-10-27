# Relatório de Sprint — Outubro 2026

**Projeto:** Grocery Home (iOS) + backend compartilhado (Cloud Functions)
**Período coberto:** aprovação na App Store → correções de notificação push → ajustes de usabilidade
**Repositórios:** `home-market-app-ios` (app Swift/SwiftUI), `home-market-app` (Cloud Functions, Node/TypeScript)

## Resumo executivo

O app foi aprovado na App Store (versão 1.0, build 6) após resolver a rejeição por Guideline 2.3.3 (screenshots não mostravam o app em uso). Depois da aprovação, foi retomada uma pendência antiga do backlog — notificação push quando um item é adicionado à lista — que revelou **quatro causas raiz independentes e empilhadas**, todas corrigidas e validadas em produção. Em paralelo, três bugs de usabilidade reportados em teste ao vivo foram corrigidos. Dark Mode está em andamento (branch separada, ainda não mergeada).

Todo o trabalho foi feito em branches individuais por correção, com PR + checagem do SonarCloud antes de cada merge — nenhuma mudança foi commitada direto no `main`.

---

## 1. Aprovação na App Store (Guideline 2.3.3)

**Problema:** App rejeitado porque as screenshots cadastradas (login, criar conta, redefinir senha) não mostravam o app em uso real, conforme exigido pela guideline.

**Correção:**
- Removidas permissões mortas do `Info.plist` (câmera/galeria declaradas sem uso real)
- Adicionado link de Política de Privacidade dentro do app (abre em Safari embutido, sem sair do app)
- Geradas e publicadas novas screenshots mostrando lista de compras, item sendo editado, Modo Mercado e histórico de compras
- Descrição da loja corrigida (removida menção a uma notificação push que ainda não existia, removida menção a uma função de "reatribuir admin" que também não existia)

**Resultado:** build 1.0 (6) aprovada em 22/10/2026. Commit da versão exata marcado com a tag `v1.0-6-approved` e release correspondente no GitHub.

---

## 2. Notificação push "item adicionado" — quatro causas raiz

**Contexto:** item de backlog documentado desde o início do projeto — a função de notificação já existia no backend (Cloud Functions), mas nunca funcionou, nem na versão web, nem na versão iOS.

Cada causa só foi descoberta depois de corrigir a anterior — o comportamento observado era sempre o mesmo ("notificação não chega"), mas por motivos diferentes em cada camada.

### 2.1 — Backend lendo a coleção errada
A função `onItemAdded` buscava membros da família na coleção `householdMembers`, que ficou órfã quando o app passou a guardar os membros em `households/{id}.memberUids`. A busca sempre retornava vazio, então a função nunca tinha ninguém para notificar — sem erro, silenciosamente.

**Correção:** `getTokensExcept` passou a ler `memberUids` direto do documento do household. ([home-market-app PR #2](https://github.com/crlsribeiro/home-market-app/pull/2))

### 2.2 — App iOS não exibia notificação em primeiro plano, e não navegava ao tocar
O app registrava o token de push, mas não tinha delegate configurado para mostrar a notificação quando já estava aberto, nem para reagir ao toque.

**Correção:** `AppDelegate` passou a implementar `UNUserNotificationCenterDelegate` (exibe banner mesmo com app aberto) e um `NotificationRouter` que troca a aba ativa para "List" quando a notificação é tocada. ([home-market-app-ios PR #33](https://github.com/crlsribeiro/home-market-app-ios/pull/33))

### 2.3 — Corrida entre o token do FCM e o token do APNs
O registro do token do FCM era buscado imediatamente após `registerForRemoteNotifications()`, mas o token do APNs (exigido pelo FCM) só chega de forma assíncrona depois. Essa corrida fazia o registro falhar quase sempre, com o erro "No APNS token specified before fetching FCM Token".

**Correção:** `AppDelegate` passou a usar `MessagingDelegate.didReceiveRegistrationToken`, que o Firebase só chama quando realmente tem um token (inicial ou atualizado) — eliminando a corrida. ([home-market-app-ios PR #34](https://github.com/crlsribeiro/home-market-app-ios/pull/34))

### 2.4 — Projeto Firebase sem credencial APNs configurada

Depois das três correções acima, o teste em dispositivo físico ainda não recebia nada. O diagnóstico (logging adicionado à função — [home-market-app PR #3](https://github.com/crlsribeiro/home-market-app/pull/3)) mostrou que a função agora encontrava os destinatários certos e tentava enviar, mas a maioria das tentativas falhava. Os erros eram de dois tipos:

- `NotRegistered` em três tokens idênticos — tokens de testes antigos, de contas que compartilharam o mesmo dispositivo/Simulator em sessões anteriores. Esperado, não é bug.
- `"Invalid APNs credential."` — esse sim era grave, e apareceu inclusive no token do próprio celular real usado no teste.

Checando o Firebase Console (Project Settings → Cloud Messaging → Apple app configuration), confirmamos a causa: **o projeto nunca teve nenhuma credencial APNs cadastrada** — nem chave de autenticação, nem certificado, nem de desenvolvimento, nem de produção, desde a criação do projeto. O Firebase simplesmente não tinha como se autenticar com os servidores de push da Apple.

**Passo a passo da correção** (feita direto nos consoles, fora do código):
1. Apple Developer Portal → Certificates, Identifiers & Profiles → Keys → nova chave, com o serviço "Apple Push Notifications service (APNs)" habilitado
2. Na configuração da chave, escolhido o escopo **"Sandbox & Production"** (em vez de só um dos dois) — decisão deliberada pra cobrir tanto os builds de debug direto do Xcode quanto o app já publicado na App Store com uma única chave. Essa escolha de ambiente é **permanente**, não dá pra mudar depois de salva.
3. Download do arquivo `.p8` — a Apple só permite baixar esse arquivo **uma vez**; depois disso a cópia no servidor é removida
4. Anotados o **Key ID** e o **Team ID** (visível no canto superior do portal, junto ao nome da conta)
5. Upload do `.p8` + Key ID + Team ID no Firebase Console → Cloud Messaging → Apple app configuration → Chave de autenticação de APNs

**Nota de segurança:** o arquivo `.p8` nunca foi commitado no repositório — é uma credencial sensível (permite enviar push como o app), orientamos guardar só localmente/fora do controle de versão, já que o Firebase mantém a própria cópia após o upload.

**Validação:** notificação recebida com sucesso em dispositivo físico, com o texto esperado ("🛒 Novo item na lista! {nome} adicionou "{item}" na lista").

Durante o diagnóstico também foi corrigido um dado inconsistente: um usuário tinha `householdId` apontando para uma família, mas seu uid não estava no array `memberUids` daquela família — corrigido diretamente no Firestore.

---

## 3. Usabilidade — correções reportadas em teste ao vivo

| Problema | Correção | PR |
|---|---|---|
| Texto da tela de Onboarding pequeno demais perto do título | Fonte do card de opção aumentada (15pt→17pt) | [#35](https://github.com/crlsribeiro/home-market-app-ios/pull/35) |
| Contraste de texto secundário abaixo do padrão de acessibilidade (WCAG AA) | Nova cor `Brand.secondaryText` (~8:1 de contraste, antes ~3.5:1) | [#35](https://github.com/crlsribeiro/home-market-app-ios/pull/35) |
| Usuário sem família ficava preso na tela de Onboarding, sem como sair | Botão de logout adicionado (mesmo padrão já usado na lista principal) | [#35](https://github.com/crlsribeiro/home-market-app-ios/pull/35) |
| Código de convite com letra minúscula impossível de digitar (campo força maiúscula) | Códigos gerados só em maiúsculas; comparação também normalizada | [#36](https://github.com/crlsribeiro/home-market-app-ios/pull/36) |

---

## 4. Ambiente de desenvolvimento

Durante os testes, descobrimos que o Xcode estava aberto numa **cópia duplicada e desatualizada** do repositório (pasta diferente da usada para os comandos git), o que fazia qualquer build parecer não refletir as correções mais recentes. Resolvido localizando e removendo a cópia duplicata, preservando o `GoogleService-Info.plist` antes de apagar.

---

## 5. Em andamento

**Dark Mode** (branch `feat/dark-mode-support`, ainda não mergeada): cores do design system (`Brand.surface`, `Brand.tint`, novo `Brand.cardBackground`) já convertidas para adaptativas (claro/escuro). Falta: QA visual em todas as telas nos dois modos, e remoção do lock atual em "Light Mode" no `Info.plist` depois da validação.

---

## Para o arquiteto (revisão de código)

Pontos que merecem atenção na revisão:
- `HomeMarket/HomeMarketApp.swift` — `AppDelegate` agora concentra 3 responsabilidades de notificação (registro, apresentação em primeiro plano, roteamento de toque). Candidato a dividir em um tipo dedicado se crescer mais.
- `functions/src/index.ts` (`getTokensExcept`) — faz uma leitura de Firestore por membro da família em sequência (loop `for...of` com `await` dentro); funciona bem para famílias pequenas, mas não escala para famílias grandes — candidato a `Promise.all`.
- O logging adicionado em `onItemAdded`/`getTokensExcept` é permanente (decisão deliberada, não é debug temporário) — útil para diagnosticar problemas de entrega no futuro, mas vale revisar se o nível de detalhe (uids, tokens truncados) é aceitável para política de dados da equipe.
- `HomeMarket/Views/Common/DesignSystem.swift` — as novas cores adaptativas (`Brand.tint`, `Brand.surface`, `Brand.cardBackground`) usam `UIColor { traitCollection in ... }` direto no código Swift, não Color Sets no Assets.xcassets. Funciona, mas foge do padrão mais comum em projetos iOS — decisão consciente pra evitar editar o catálogo de assets sem Xcode disponível neste ambiente.
