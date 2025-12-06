import { db, auth } from "./firebase-app.js";
import { doc, getDoc } from "firebase/firestore";

export async function getUserSubscriptionStatus(uid) {
    const ref = doc(db, "subscriptions", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return "none";

    const data = snap.data();

    if (data.status === "active") return "active";
    if (data.status === "expired") return "expired";

    return "none";
}
