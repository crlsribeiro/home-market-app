import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

// Notifica membros quando item é adicionado
export const onItemAdded = onDocumentCreated(
  "items/{itemId}",  // ✅ corrigido: era listItems
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const item = snap.data();
    if (!item) return;

    const tokens = await getTokensExcept(item.householdId, item.addedByUid);
    if (tokens.length === 0) return;

    await admin.messaging().sendEachForMulticast({
      notification: {
        title: "🛒 Novo item na lista!",
        body: `${item.addedByName || "Alguém"} adicionou "${item.name || "um item"}" na lista`,
      },
      tokens,
    });
  }
);

// Notifica quem adicionou quando item é marcado como not_found
export const onItemNotFound = onDocumentUpdated(
  "items/{itemId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Só dispara quando muda PARA not_found
    if (before.status === after.status) return;
    if (after.status !== "not_found") return;

    const addedByUid = after.addedByUid;
    if (!addedByUid) return;

    const userDoc = await admin.firestore().collection("users").doc(addedByUid).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return;

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "😕 Item não encontrado",
        body: `"${after.name}" não foi encontrado no mercado. O que fazemos?`,
      },
    });
  }
);

// Helper — busca tokens de todos membros exceto um
async function getTokensExcept(householdId: string, excludeUid: string): Promise<string[]> {
  const membersSnap = await admin.firestore()
    .collection("householdMembers")
    .where("householdId", "==", householdId)
    .get();

  const tokens: string[] = [];
  for (const memberDoc of membersSnap.docs) {
    const memberData = memberDoc.data();
    if (memberData.userId === excludeUid) continue;
    const userDoc = await admin.firestore().collection("users").doc(memberData.userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (fcmToken) tokens.push(fcmToken);
  }
  return tokens;
}