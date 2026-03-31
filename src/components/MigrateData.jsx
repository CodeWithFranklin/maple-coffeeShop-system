import { db } from "../firebase";
import { doc, writeBatch } from "firebase/firestore";
import { locations, locatedStores, menuList } from "./ListItems";

// Helper to turn "Pepperoni Pizza" into "pepperoni-pizza"
const createSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

export const runMigration = async () => {
  const batch = writeBatch(db);

  try {
    // 1. MAPPING CITIES
    locations.forEach((city) => {
      const citySlug = createSlug(city.label);
      const cityRef = doc(db, "cities", citySlug);
      batch.set(cityRef, {
        label: city.label,
        id: citySlug,
      });
    });

    // 2. MAPPING STORES (Linking to Cities)
    locatedStores.forEach((store) => {
      const storeSlug = `maple-${createSlug(store.name.split(" ").pop())}`;
      const storeRef = doc(db, "stores", storeSlug);

      // Extract city from address to create the link
      const cityPart = store.address.split(",").pop().trim();
      const citySlug = createSlug(cityPart);

      batch.set(storeRef, {
        ...store,
        id: storeSlug,
        citySlug: citySlug, // Professional "Foreign Key"
      });
    });

    // 3. MAPPING PRODUCTS (The Menu)
    menuList.forEach((product) => {
      const productSlug = createSlug(product.name);
      const productRef = doc(db, "products", productSlug);

      batch.set(productRef, {
        ...product,
        id: productSlug,
        // Ensure availableAt contains the NEW store slugs
        // If your ListItems uses numbers [1, 2], we map them to slugs here:
        availableAt: product.availableAt.map((numId) => {
          const originalStore = locatedStores.find((s) => s.id === numId);
          return originalStore
            ? `maple-${createSlug(originalStore.name.split(" ").pop())}`
            : numId;
        }),
      });
    });

    await batch.commit();
    alert(
      "Migration Successful! Your Cloud Database is now live and organized."
    );
  } catch (error) {
    console.error("Migration Failed:", error);
    alert("Migration Error: Check console.");
  }
};
