import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { menuList, locatedStores, locations } from "./ListItems";

export const runMigration = async () => {
  try {
    // 1. Migrate Menu (Using my existing IDs)
    for (const item of menuList) {
      await setDoc(doc(db, "products", item.id.toString()), item);
    }

    // 2. Migrate Stores
    for (const store of locatedStores) {
      await setDoc(doc(db, "stores", store.id.toString()), store);
    }

    // 3. Migrate Location Labels
    for (const loc of locations) {
      await setDoc(doc(db, "cities", loc.id.toString()), loc);
    }

    console.log("✅ Database Synced Successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
};
