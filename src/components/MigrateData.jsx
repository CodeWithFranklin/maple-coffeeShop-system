import { db } from "../firebase";
import { serverTimestamp, doc, writeBatch } from "firebase/firestore";
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
        citySlug: citySlug,
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

export const migrateHomepage_menu = async () => {
  const batch = writeBatch(db);

  try {
    // Picking the items from your menuList to feature on the homepage
    const featuredSelection = menuList.slice(0, 6);

    featuredSelection.forEach((item, index) => {
      const productSlug = createSlug(item.name);
      // Unique ID for the homepage entry
      const homeRef = doc(db, "homepage_menus", `home-${productSlug}`);

      batch.set(homeRef, {
        productId: productSlug,
        name: item.name,
        price: item.price,
        img: item.img,
        // FIELD MAPPING
        description: item.about, // 'about' renamed to 'description'
        categories: item.tags, // 'tags' renamed to 'categories'
        order: index + 1,
        addedAt: serverTimestamp(), // Real Firestore timestamp
      });
    });

    await batch.commit();
    alert("Homepage collection created with updated fields!");
  } catch (error) {
    console.error("Migration error:", error);
  }
};