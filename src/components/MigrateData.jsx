import { db } from "../firebase";
import {
  serverTimestamp,
  doc,
  writeBatch,
} from "firebase/firestore";
import { locations, locatedStores, menuList } from "./ListItems";

const createSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const DEFAULT_OPENING_HOURS = {
  monday: { open: "08:00", close: "20:00" },
  tuesday: { open: "08:00", close: "20:00" },
  wednesday: { open: "08:00", close: "20:00" },
  thursday: { open: "08:00", close: "20:00" },
  friday: { open: "08:00", close: "20:00" },
  saturday: { open: "08:00", close: "20:00" },
  sunday: { open: "08:00", close: "20:00" },
};

const STORES = [
  {
    id: "maple-lekki",
    name: "Maple Lekki",
    address: "12 Admiralty Way, Lekki, Lagos, Nigeria",
    country: "Nigeria",
    countryCode: "NG",
    state: "Lagos",
    stateCode: "LA",
    city: "Lekki",
    citySlug: "lekki",
    phone: "+234 800 000 1001",
    img: "/images/store1.jpg",
  },
  {
    id: "maple-ikeja",
    name: "Maple Ikeja",
    address: "44 Allen Avenue, Ikeja, Lagos, Nigeria",
    country: "Nigeria",
    countryCode: "NG",
    state: "Lagos",
    stateCode: "LA",
    city: "Ikeja",
    citySlug: "ikeja",
    phone: "+234 800 000 1002",
    img: "/images/store2.jpg",
  },
  {
    id: "maple-abuja",
    name: "Maple Abuja",
    address: "9 Aminu Kano Crescent, Wuse 2, Abuja, Nigeria",
    country: "Nigeria",
    countryCode: "NG",
    state: "Federal Capital Territory",
    stateCode: "FCT",
    city: "Abuja",
    citySlug: "abuja",
    phone: "+234 800 000 1003",
    img: "/images/store3.jpg",
  },
  {
    id: "maple-denver",
    name: "Maple Denver",
    address: "789 Oak Lane, Denver, Colorado, USA",
    country: "USA",
    countryCode: "US",
    state: "Colorado",
    stateCode: "CO",
    city: "Denver",
    citySlug: "denver",
    phone: "+1 303 555 0101",
    img: "/images/store4.jpg",
  },
  {
    id: "maple-los-angeles",
    name: "Maple Los Angeles",
    address: "145 Sunset Boulevard, Los Angeles, California, USA",
    country: "USA",
    countryCode: "US",
    state: "California",
    stateCode: "CA",
    city: "Los Angeles",
    citySlug: "los-angeles",
    phone: "+1 213 555 0102",
    img: "/images/store5.jpg",
  },
  {
    id: "maple-houston",
    name: "Maple Houston",
    address: "22 Riverwalk Avenue, Houston, Texas, USA",
    country: "USA",
    countryCode: "US",
    state: "Texas",
    stateCode: "TX",
    city: "Houston",
    citySlug: "houston",
    phone: "+1 713 555 0103",
    img: "/images/store6.jpg",
  },
];

const TAGS = [
  {
    id: "coffee",
    name: "Coffee",
    description: "Hot and cold coffee drinks.",
  },
  {
    id: "tea",
    name: "Tea",
    description: "Tea-based drinks and blends.",
  },
  {
    id: "pastry",
    name: "Pastry",
    description: "Baked snacks and pastries.",
  },
  {
    id: "pizza",
    name: "Pizza",
    description: "Freshly prepared pizza options.",
  },
  {
    id: "cold-drink",
    name: "Cold Drink",
    description: "Iced and chilled drinks.",
  },
  {
    id: "hot-drink",
    name: "Hot Drink",
    description: "Warm drinks and beverages.",
  },
  {
    id: "featured",
    name: "Featured",
    description: "Products shown in featured sections.",
  },
];

const getProductBasePrice = (product) => {
  return product.basePrice ?? product.price ?? 0;
};

const getProductDescription = (product) => {
  return product.description ?? product.about ?? "";
};

const getProductTags = (product) => {
  const rawTags = product.tags ?? [];

  if (rawTags.length > 0) {
    return rawTags.map((tag) => createSlug(tag));
  }

  const name = product.name?.toLowerCase() || "";

  if (name.includes("pizza")) return ["pizza"];
  if (name.includes("latte") || name.includes("coffee") || name.includes("espresso"))
    return ["coffee", "hot-drink"];
  if (name.includes("iced") || name.includes("cold")) return ["cold-drink"];
  if (name.includes("tea")) return ["tea"];
  if (name.includes("cake") || name.includes("bread") || name.includes("croissant"))
    return ["pastry"];

  return ["featured"];
};

const getProductCategory = (product) => {
  const tags = getProductTags(product);
  return tags[0] || "featured";
};

const getStoresForProduct = (product, index) => {
  const productName = product.name?.toLowerCase() || "";

  if (productName.includes("pizza")) {
    return ["maple-lekki", "maple-ikeja", "maple-los-angeles", "maple-houston"];
  }

  if (
    productName.includes("latte") ||
    productName.includes("coffee") ||
    productName.includes("espresso") ||
    productName.includes("cappuccino")
  ) {
    return STORES.map((store) => store.id);
  }

  if (index % 3 === 0) {
    return ["maple-lekki", "maple-denver", "maple-los-angeles"];
  }

  if (index % 3 === 1) {
    return ["maple-ikeja", "maple-abuja", "maple-houston"];
  }

  return ["maple-lekki", "maple-ikeja", "maple-denver"];
};

const commitBatch = async (operations) => {
  let batch = writeBatch(db);
  let count = 0;

  for (const operation of operations) {
    batch.set(operation.ref, operation.data, operation.options ?? { merge: true });
    count++;

    if (count === 450) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }
};

export const seedFreshMapleDatabase = async () => {
  try {
    const operations = [];

    // 1. Create fresh stores
    STORES.forEach((store) => {
      const storeRef = doc(db, "stores", store.id);

      operations.push({
        ref: storeRef,
        data: {
          ...store,
          isActive: true,
          rating: 0,
          reviewCount: 0,
          openingHours: DEFAULT_OPENING_HOURS,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
      });
    });

    // 2. Create cities from store locations
    const uniqueCities = new Map();

    STORES.forEach((store) => {
      uniqueCities.set(store.citySlug, {
        id: store.citySlug,
        name: store.city,
        slug: store.citySlug,
        state: store.state,
        stateCode: store.stateCode,
        country: store.country,
        countryCode: store.countryCode,
      });
    });

    uniqueCities.forEach((city) => {
      const cityRef = doc(db, "cities", city.id);

      operations.push({
        ref: cityRef,
        data: {
          ...city,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
      });
    });

    // 3. Create tags
    TAGS.forEach((tag) => {
      const tagRef = doc(db, "tags", tag.id);

      operations.push({
        ref: tagRef,
        data: {
          ...tag,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
      });
    });

    // 4. Create products and store inventory
    menuList.forEach((product, index) => {
      const productId = createSlug(product.name);
      const productRef = doc(db, "products", productId);

      const basePrice = getProductBasePrice(product);
      const description = getProductDescription(product);
      const tags = getProductTags(product);
      const category = getProductCategory(product);

      operations.push({
        ref: productRef,
        data: {
          id: productId,
          name: product.name,
          description,
          about: product.about ?? "",
          img: product.img ?? "",
          tags,
          category,
          basePrice,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
      });

      const storeIds = getStoresForProduct(product, index);

      storeIds.forEach((storeId) => {
        const inventoryRef = doc(db, "stores", storeId, "inventory", productId);

        operations.push({
          ref: inventoryRef,
          data: {
            productId,
            name: product.name,
            img: product.img ?? "",
            tags,
            category,
            price: basePrice,
            available: true,
            stock: 50,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          options: { merge: true },
        });
      });

      // 5. Create homepage menus from first 6 products
      if (index < 6) {
        const homepageRef = doc(db, "homepage_menus", `home-${productId}`);

        operations.push({
          ref: homepageRef,
          data: {
            productId,
            name: product.name,
            price: basePrice,
            img: product.img ?? "",
            description,
            categories: tags,
            order: index + 1,
            addedAt: serverTimestamp(),
          },
          options: { merge: true },
        });
      }
    });

    await commitBatch(operations);

    alert("Fresh Maple database seeded successfully!");
  } catch (error) {
    console.error("Fresh Maple database seed failed:", error);
    alert("Fresh Maple database seed failed. Check console.");
  }
};


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