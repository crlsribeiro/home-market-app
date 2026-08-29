# Spec dos hooks — `home-market-app`

Baseado em `src/hooks/*.ts`, `src/types/index.ts`, `src/lib/utils.ts` e `functions/src/index.ts`. Não há `firestore.rules` no repo, então as regras de acesso não estão documentadas em código — só as regras de negócio aplicadas no cliente.

Este documento serve como spec para recriar o app em Swift/SwiftUI.

## Coleções do Firestore (visão geral)

| Coleção | Campos principais |
|---|---|
| `users` | uid, displayName, email, photoURL, householdId, role (`admin`\|`member`), joinedAt, fcmToken |
| `households` | name, adminUid, inviteToken, memberUids[], createdAt |
| `lists` | householdId, weekLabel, weekStart, weekEnd, status (`open`\|`locked`\|`shopping`\|`closed`), createdAt, closedAt |
| `items` | listId, householdId, name, quantity, notes, urgent, addedByUid, addedByName, status (`pending`\|`purchased`\|`not_found`\|`rolled_over`), approvalStatus (`not_required`\|`pending`\|`approved`\|`rejected`), notFoundResolved, photoURL, createdAt |
| `purchases` | listId, householdId, weekLabel, total, receiptUrl, receiptProcessed, createdAt |
| `purchaseItems` | purchaseId, name, quantity, unitPrice, totalPrice |
| `householdMembers` | (só lida pela Cloud Function `getTokensExcept`; parece resíduo de um schema antigo — os hooks nunca escrevem essa coleção, eles usam `households.memberUids`) |

Storage (Firebase Storage, não Firestore, mas relevante pro spec):
- `users/{uid}/avatar` — foto de perfil
- `households/{householdId}/items/{itemId}/photo` — foto do item
- `receipts/{purchaseId}/{filename}` — foto do recibo

---

## `useAuth()`

**Expõe:** `user` (Firebase `User`), `appUser` (`AppUser` do Firestore), `loading`, `signInWithGoogle()`, `signInWithEmail(email, pass)`, `signUpWithEmail(email, pass)`, `registerUser(data)`, `resetPassword(email)`, `logout()`, `refreshAppUser()`.

**Firestore:**
- Lê/escreve `users/{uid}`.

**Regras de negócio:**
- Login com Google via `signInWithRedirect` (não popup) — no Swift, equivalente seria Google Sign-In SDK ou `ASWebAuthenticationSession`.
- Ao autenticar (redirect result **ou** `onAuthStateChanged`), se o doc `users/{uid}` não existe, cria com `householdId: null`, `role: 'member'`.
- `registerUser` é o fluxo de cadastro completo: cria conta, opcionalmente sobe avatar pro Storage, atualiza `displayName`/`photoURL` no Auth profile, e grava doc `users` com `firstName`, `lastName`, `phone`, `phoneCountryCode`, `provider: 'email'`.
- Depois de qualquer login/registro bem-sucedido, tenta registrar push token (FCM) — pede permissão de notificação e salva `fcmToken` no doc do usuário. Em Swift isso vira APNs + token salvo em `users/{uid}.fcmToken`.
- `refreshAppUser` força releitura do doc `users` (usado depois de mudanças externas, tipo entrar num household).
- Sem household → `appUser.householdId === null` é o sinal usado pelas telas pra decidir "mostrar onboarding de household" vs "mostrar app".

---

## `useHousehold(householdId: string | null)`

**Expõe:** `household` (`Household | null`), `members` (`AppUser[]`), `loading`, `createHousehold(name, uid)`, `joinHousehold(token, uid)`, `generateInviteLink(hid)`.

**Firestore:**
- Lê (realtime, `onSnapshot`) `households/{householdId}`.
- Lê (uma vez, `getDoc` em paralelo) `users/{uid}` para cada `memberUids`.
- Escreve `households` (create, update `memberUids`, update `inviteToken`) e `users/{uid}` (`householdId`, `role`).

**Regras de negócio:**
- `createHousehold`: gera `id` aleatório de 20 chars e `inviteToken` de 8 chars (`generateToken` — alfanumérico, não usa UUID nem doc-id automático do Firestore: o ID do household é o próprio token gerado). Cria o household com `memberUids: [uid]` e promove o criador a `role: 'admin'` no doc `users`.
- `joinHousehold`: busca household por `inviteToken` (query where). Se não encontrar, retorna `null`. Se encontrar e o uid ainda não estiver em `memberUids`, adiciona (sem duplicar). Sempre seta `householdId` no user e `role: 'member'` (mesmo se reentrando).
- `generateInviteLink`: regenera o token de convite (invalida o link antigo).
- Um usuário só pertence a **um** household por vez (`householdId` é um único campo escalar em `users`, não array).

---

## `useList(householdId: string | null)`

O hook mais complexo — é o coração do fluxo semanal de compras.

**Expõe:** `currentList` (`WeekList | null`), `items` (`ListItem[]`), `nextWeekItems` (`ListItem[]`), `loading`, `createList()`, `addItem(...)`, `toggleItem(itemId, currentStatus)`, `markNotFound(itemId)`, `resolveNotFound(itemId)`, `approveItem(itemId)`, `rejectItem(itemId)`, `updateListStatus(listId, status)`, `doWeeklyCut(listId)`, `removeItem(itemId)`, `updateItemNotes(itemId, notes)`.

**Firestore:**
- Lê (realtime) `lists` where `householdId == X`, filtra client-side por status ativo (`open`/`locked`/`shopping`) e pega a mais recente por `createdAt` como `currentList`. Listas `closed` são ignoradas (viram histórico, mas esse hook não as expõe).
- Lê (realtime) `items` where `listId == currentList.id`, filtra client-side por status válido (`pending`/`purchased`/`not_found`).
- Lê (realtime, separado) `items` where `householdId == X AND status == 'rolled_over'` → `nextWeekItems` (itens que "sobraram" pra próxima semana, independente da lista atual).
- Escreve `lists` (create, update status/closedAt) e `items` (create, update status/approvalStatus/notes/photoURL, delete).
- Upload de foto de item em Storage (`households/{householdId}/items/{itemId}/photo`).

**Regras de negócio (a parte importante pro spec):**
- **Só existe uma lista "ativa" por household por vez** — determinada em memória (não há índice/flag "current" no doc), pegando a mais recente entre os status não-`closed`.
- `createList()`: cria lista com `status: 'open'`, `weekLabel`/`weekStart`/`weekEnd` calculados via `getWeekStart`/`getWeekEnd` (semana começa segunda, termina domingo — ver `utils.ts`).
- `addItem`: cria o item primeiro (pra ter ID), depois — se houver foto — sobe pro Storage e faz update com a URL. `approvalStatus` é decidido pela regra: se a lista está `open`, item entra como `not_required` (sem aprovação); se a lista está em qualquer outro status (`locked`/`shopping`), item entra como `pending` (precisa aprovação de alguém, tipicamente o admin). Isso modela "depois que a lista foi travada, itens novos precisam ser aprovados".
- `toggleItem`: alterna só entre `purchased` ↔ `pending` (toggle simples, ignora `not_found`/`rolled_over`).
- `markNotFound`: marca item como `not_found` (durante compras, quando o item não foi achado no mercado) → dispara a Cloud Function `onItemNotFound` que notifica quem adicionou o item.
- `resolveNotFound`: resolve um item `not_found`, movendo-o para `rolled_over` (vai pra próxima semana) e marca `notFoundResolved: true`.
- `approveItem` / `rejectItem`: fluxo de aprovação — aprovar seta `approvalStatus: 'approved'` (item continua `pending` de compra); rejeitar seta `approvalStatus: 'rejected'` **e** `status: 'rolled_over'` (item rejeitado nunca é comprado nessa lista, mas some pra próxima semana em vez de ser deletado).
- `updateListStatus`: transição de status da lista (`open → locked → shopping → closed`); ao setar `closed`, grava `closedAt: serverTimestamp()`.
- `doWeeklyCut`: operação de "fechar a semana" — usa `writeBatch` para atomicamente: (1) marcar a lista como `closed` + `closedAt`, e (2) mover todo item ainda `pending` e **não** com `approvalStatus === 'pending'` (ou seja, aprovados ou not_required) para `rolled_over`. Itens com aprovação pendente ficam "perdidos" (nem comprados, nem rollover) — comportamento a decidir se replica no Swift ou corrige.
- `removeItem`: delete físico (hard delete) do item — não é soft-delete.
- Modelo de "próxima semana" (`nextWeekItems`) é **global ao household**, não amarrado a uma lista específica — são todos os itens `rolled_over` soltos, esperando alguém rodar `createList()` de novo e (presumivelmente, em outra parte do código/tela) migrá-los pra nova lista.

---

## `useHistory(householdId: string | null)`

**Expõe:** `purchases` (`Purchase[]`), `purchaseItems` (`Record<purchaseId, PurchaseItem[]>`), `loading`, `fetchPurchaseItems(purchaseId)`, `createPurchaseForList(listId, weekLabel)`, `uploadReceipt(purchaseId, file)`, `updateItemPrice(purchaseId, itemId, newUnitPrice, newName?)`.

**Firestore:**
- Lê (realtime) `purchases` where `householdId == X`, ordenado por `createdAt` desc (client-side sort).
- Lê (on-demand, `getDocs`) `purchaseItems` where `purchaseId == X`.
- Escreve `purchases` (create, update total/receiptUrl/receiptProcessed) e `purchaseItems` (create, delete-then-recreate, update).
- Upload de recibo em Storage (`receipts/{purchaseId}/{filename}`), roda OCR local com `tesseract.js` (**dependência web-only**, precisa de equivalente nativo em Swift — ex.: Vision framework `VNRecognizeTextRequest`).

**Regras de negócio:**
- `createPurchaseForList`: cria um registro de compra vinculado a uma lista, `total: 0`, `receiptProcessed: false`.
- `uploadReceipt` é o fluxo mais elaborado:
  1. Sobe a imagem pro Storage.
  2. Roda OCR (Tesseract, idioma `eng`) na imagem.
  3. `parseReceiptText`: parser regex específico pra formato de recibo tipo H-E-B (`hebItemRegex = /^(?:\d+\s+)?(.+?)\s+(\d+\.\d{2})(?:\s+[A-Z]{1,2})?$/i`):
     - Para de processar linhas assim que encontra uma "stopword" de rodapé (`subtotal`, `total sale`, `tax`, `visa`, `mastercard`, `cash`, `change`, `items purchased`, `account #`).
     - Ignora linhas de peso/unidade (`lbs @`, `ea. @`).
     - Descarta preço inválido (NaN, ≤0, >500) ou nome muito curto (<2 chars).
     - Remove prefixo numérico do nome do item.
  4. Se nenhum item foi reconhecido, insere um item placeholder ("Nenhum item reconhecido...") com preço 0, pra o usuário poder editar manualmente.
  5. **Substitui** completamente os `purchaseItems` antigos daquela compra (deleta todos, recria do zero) — não faz merge incremental.
  6. Recalcula `total` da compra como soma de `totalPrice` de todos os itens, arredondado a 2 casas.
- `updateItemPrice`: edição manual pós-OCR — recalcula `totalPrice = unitPrice * quantity` do item, opcionalmente renomeia, e **recalcula o total da compra inteira** a partir de todos os `purchaseItems` (consistência total sempre reflete a soma real).
- Em Swift: o parser de recibo (regex + stopwords) é lógica de negócio pura, portável 1:1; o gargalo é trocar Tesseract.js por Vision/VisionKit ou outro OCR nativo.

---

## Cloud Functions (`functions/src/index.ts`) — pra completar o modelo de notificações

- `onItemAdded` (trigger `onDocumentCreated` em `items/{itemId}`): notifica (push multicast) todos os membros do household **exceto** quem adicionou, com título "🛒 Novo item na lista!".
- `onItemNotFound` (trigger `onDocumentUpdated` em `items/{itemId}`): dispara só quando `status` muda **para** `not_found`; notifica especificamente `addedByUid` (quem colocou o item na lista), título "😕 Item não encontrado".
- `getTokensExcept`: busca tokens via coleção `householdMembers` (que nenhum hook do client escreve — provável resíduo de refactor; no client, os membros vêm de `households.memberUids` + `users`). **Atenção**: isso é uma inconsistência real no código atual — a function pode nunca encontrar tokens porque `householdMembers` provavelmente está vazia. Vale confirmar em produção antes de replicar a lógica em Swift/APNs.

Recomendo, ao portar para Swift, resolver essa mesma notificação lendo `households/{id}.memberUids` (como o client já faz) em vez de depender de `householdMembers`.
