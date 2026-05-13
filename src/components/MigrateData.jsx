import { db } from "../firebase";
import {
  serverTimestamp,
  doc,
  writeBatch,
  collection,
  deleteDoc,
  deleteField,
  getDocs,
  updateDoc,
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
    phone: "+1 713 555 0103",
    img: "/images/store6.jpg",
  },
];

const getProductDescription = (product) => {
  return product.description || product.about || "";
};

const getProductPrice = (product) => {
  return Number(product.basePrice || product.price || 0);
};

const getProductTags = (product) => {
  const rawTags = product.tags || [];

  if (rawTags.length > 0) {
    return rawTags.map((tag) => createSlug(tag));
  }

  const name = product.name?.toLowerCase() || "";

  if (name.includes("pizza")) return ["pizza", "food"];
  if (
    name.includes("latte") ||
    name.includes("coffee") ||
    name.includes("espresso") ||
    name.includes("cappuccino")
  ) {
    return ["coffee", "hot-drink"];
  }
  if (name.includes("iced") || name.includes("cold")) return ["cold-drink"];
  if (name.includes("tea")) return ["tea"];
  if (
    name.includes("cake") ||
    name.includes("bread") ||
    name.includes("croissant")
  ) {
    return ["pastry"];
  }

  return ["featured"];
};

const getProductCategory = (product) => {
  const tags = getProductTags(product);
  return tags[0] || "featured";
};

const getRandomStock = () => {
  const stockOptions = [0, 3, 6, 10, 15, 20, 25, 30, 40, 50];
  return stockOptions[Math.floor(Math.random() * stockOptions.length)];
};

const commitBatch = async (operations) => {
  let batch = writeBatch(db);
  let count = 0;

  for (const operation of operations) {
    batch.set(
      operation.ref,
      operation.data,
      operation.options || { merge: true }
    );
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
    const seenProductIds = new Set();

    // 1. Create stores
    STORES.forEach((store) => {
      const storeRef = doc(db, "stores", store.id);

      operations.push({
        ref: storeRef,
        data: {
          name: store.name,
          address: store.address,
          country: store.country,
          countryCode: store.countryCode,
          state: store.state,
          stateCode: store.stateCode,
          city: store.city,
          phone: store.phone,
          img: store.img,
          isActive: true,
          rating: 0,
          reviewCount: 0,
          openingHours: DEFAULT_OPENING_HOURS,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      });
    });

    // 2. Create cities
    const uniqueCities = new Map();

    STORES.forEach((store) => {
      const cityId = createSlug(store.city);

      uniqueCities.set(cityId, {
        name: store.city,
        country: store.country,
        countryCode: store.countryCode,
        state: store.state,
        stateCode: store.stateCode,
      });
    });

    uniqueCities.forEach((city, cityId) => {
      const cityRef = doc(db, "cities", cityId);

      operations.push({
        ref: cityRef,
        data: {
          ...city,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      });
    });

    // 3. Create products and inventory for every store
    menuList.forEach((product, index) => {
      const productId = createSlug(product.name);

      if (seenProductIds.has(productId)) {
        throw new Error(
          `Duplicate product name found: "${product.name}". Rename it because it creates duplicate ID "${productId}".`
        );
      }

      seenProductIds.add(productId);

      const description = getProductDescription(product);
      const basePrice = getProductPrice(product);
      const tags = getProductTags(product);
      const category = getProductCategory(product);

      const productRef = doc(db, "products", productId);

      operations.push({
        ref: productRef,
        data: {
          name: product.name,
          description,
          about: description,
          img: product.img || "",
          tags,
          category,
          basePrice,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      });

      // Every store sells every product.
      // Inventory only controls stock, price, and availability.
      STORES.forEach((store) => {
        const stock = getRandomStock();
        const inventoryRef = doc(
          db,
          "stores",
          store.id,
          "inventory",
          productId
        );

        operations.push({
          ref: inventoryRef,
          data: {
            productId,
            price: basePrice,
            stock,
            available: stock > 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        });
      });

      // Homepage featured products
      if (index < 6) {
        const homepageRef = doc(db, "homepage_menus", `home-${productId}`);

        operations.push({
          ref: homepageRef,
          data: {
            productId,
            name: product.name,
            description,
            img: product.img || "",
            price: basePrice,
            tags,
            category,
            order: index + 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        });
      }
    });

    await commitBatch(operations);

    alert("Fresh Maple database seeded successfully!");
  } catch (error) {
    console.error("Fresh Maple database seed failed:", error);
    alert(error.message || "Fresh Maple database seed failed. Check console.");
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
export const createBookProducts = async () => {
  try {
    const operations = [];

    const bookProducts = [
      {
        id: "maple-brewing-guide",
        name: "Maple Brewing Guide",
        description:
          "A beginner-friendly guide to brewing rich coffee at home.",
        about:
          "Learn simple brewing methods, coffee ratios, grind sizes, and tips for making better coffee from home.",
        img: "/images/maple-brewing-guide.jpg",
        tags: ["book", "coffee", "brewing", "guide"],
        category: "book",
        basePrice: 35,
        isActive: true,
      },
      {
        id: "coffee-shop-foundations",
        name: "Coffee Shop Foundations",
        description:
          "A practical guide to understanding the basics of running a coffee shop.",
        about:
          "Covers store setup, menu planning, customer service, inventory basics, and daily coffee shop operations.",
        img: "/images/coffee-shop-foundations.jpg",
        tags: ["book", "business", "coffee-shop", "guide"],
        category: "book",
        basePrice: 42,
        isActive: true,
      },
    ];

    bookProducts.forEach((product) => {
      const productRef = doc(db, "products", product.id);

      operations.push({
        ref: productRef,
        data: {
          name: product.name,
          description: product.description,
          about: product.about,
          img: product.img,
          tags: product.tags,
          category: product.category,
          basePrice: product.basePrice,
          isActive: product.isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
      });
    });

    await commitBatch(operations);

    alert("Book products created successfully!");
  } catch (error) {
    console.error("Book product creation failed:", error);
    alert(error.message || "Book product creation failed. Check console.");
  }
};
export const migrateStoreDeliveryZones = async () => {
  try {
    const operations = [];

    const STORE_DELIVERY_ZONES = {
      "maple-lekki": {
        food: {
          country: "Nigeria",
          states: ["Lagos"],
          citiesByState: {
            Lagos: ["Lekki", "Victoria Island", "Ajah", "Ikoyi"],
          },
          fees: {
            default: 1000,
            byCity: {
              Lekki: 800,
              "Victoria Island": 1200,
              Ajah: 1500,
              Ikoyi: 1300,
            },
          },
        },
        book: {
          country: "Nigeria",
          states: ["Lagos", "Rivers", "Federal Capital Territory"],
          citiesByState: {
            Lagos: ["Lekki", "Ikeja"],
            Rivers: ["Port Harcourt"],
            "Federal Capital Territory": ["Abuja"],
          },
          fees: {
            default: 2500,
            byState: {
              Lagos: 1000,
              Rivers: 3000,
              "Federal Capital Territory": 3500,
            },
            byCity: {
              Lekki: 800,
              Ikeja: 1000,
              "Port Harcourt": 3000,
              Abuja: 3500,
            },
          },
        },
        default: {
          country: "Nigeria",
          states: ["Lagos"],
          citiesByState: {
            Lagos: ["Lekki"],
          },
          fees: {
            default: 1000,
          },
        },
      },

      "maple-ikeja": {
        food: {
          country: "Nigeria",
          states: ["Lagos"],
          citiesByState: {
            Lagos: ["Ikeja", "Maryland", "Yaba", "Surulere"],
          },
          fees: {
            default: 1000,
            byCity: {
              Ikeja: 700,
              Maryland: 900,
              Yaba: 1200,
              Surulere: 1300,
            },
          },
        },
        book: {
          country: "Nigeria",
          states: ["Lagos", "Rivers", "Federal Capital Territory"],
          citiesByState: {
            Lagos: ["Ikeja", "Lekki"],
            Rivers: ["Port Harcourt"],
            "Federal Capital Territory": ["Abuja"],
          },
          fees: {
            default: 2500,
            byState: {
              Lagos: 1000,
              Rivers: 3000,
              "Federal Capital Territory": 3500,
            },
            byCity: {
              Ikeja: 700,
              Lekki: 1200,
              "Port Harcourt": 3000,
              Abuja: 3500,
            },
          },
        },
        default: {
          country: "Nigeria",
          states: ["Lagos"],
          citiesByState: {
            Lagos: ["Ikeja"],
          },
          fees: {
            default: 1000,
          },
        },
      },

      "maple-abuja": {
        food: {
          country: "Nigeria",
          states: ["Federal Capital Territory"],
          citiesByState: {
            "Federal Capital Territory": ["Abuja", "Wuse", "Garki", "Maitama"],
          },
          fees: {
            default: 1200,
            byCity: {
              Abuja: 1000,
              Wuse: 1200,
              Garki: 1300,
              Maitama: 1500,
            },
          },
        },
        book: {
          country: "Nigeria",
          states: ["Federal Capital Territory", "Lagos", "Rivers"],
          citiesByState: {
            "Federal Capital Territory": ["Abuja"],
            Lagos: ["Lekki", "Ikeja"],
            Rivers: ["Port Harcourt"],
          },
          fees: {
            default: 3000,
            byState: {
              "Federal Capital Territory": 1200,
              Lagos: 3500,
              Rivers: 3500,
            },
            byCity: {
              Abuja: 1000,
              Lekki: 3500,
              Ikeja: 3500,
              "Port Harcourt": 3500,
            },
          },
        },
        default: {
          country: "Nigeria",
          states: ["Federal Capital Territory"],
          citiesByState: {
            "Federal Capital Territory": ["Abuja"],
          },
          fees: {
            default: 1200,
          },
        },
      },

      "maple-denver": {
        food: {
          country: "USA",
          states: ["Colorado"],
          citiesByState: {
            Colorado: ["Denver", "Aurora", "Lakewood"],
          },
          fees: {
            default: 8,
            byCity: {
              Denver: 6,
              Aurora: 8,
              Lakewood: 9,
            },
          },
        },
        book: {
          country: "USA",
          states: ["Colorado", "California", "Texas"],
          citiesByState: {
            Colorado: ["Denver"],
            California: ["Los Angeles"],
            Texas: ["Houston"],
          },
          fees: {
            default: 15,
            byState: {
              Colorado: 8,
              California: 15,
              Texas: 15,
            },
            byCity: {
              Denver: 6,
              "Los Angeles": 15,
              Houston: 15,
            },
          },
        },
        default: {
          country: "USA",
          states: ["Colorado"],
          citiesByState: {
            Colorado: ["Denver"],
          },
          fees: {
            default: 8,
          },
        },
      },

      "maple-los-angeles": {
        food: {
          country: "USA",
          states: ["California"],
          citiesByState: {
            California: ["Los Angeles", "Santa Monica", "Beverly Hills"],
          },
          fees: {
            default: 8,
            byCity: {
              "Los Angeles": 6,
              "Santa Monica": 9,
              "Beverly Hills": 10,
            },
          },
        },
        book: {
          country: "USA",
          states: ["California", "Colorado", "Texas"],
          citiesByState: {
            California: ["Los Angeles"],
            Colorado: ["Denver"],
            Texas: ["Houston"],
          },
          fees: {
            default: 15,
            byState: {
              California: 8,
              Colorado: 15,
              Texas: 15,
            },
            byCity: {
              "Los Angeles": 6,
              Denver: 15,
              Houston: 15,
            },
          },
        },
        default: {
          country: "USA",
          states: ["California"],
          citiesByState: {
            California: ["Los Angeles"],
          },
          fees: {
            default: 8,
          },
        },
      },

      "maple-houston": {
        food: {
          country: "USA",
          states: ["Texas"],
          citiesByState: {
            Texas: ["Houston", "Sugar Land", "Katy"],
          },
          fees: {
            default: 8,
            byCity: {
              Houston: 6,
              "Sugar Land": 9,
              Katy: 10,
            },
          },
        },
        book: {
          country: "USA",
          states: ["Texas", "California", "Colorado"],
          citiesByState: {
            Texas: ["Houston"],
            California: ["Los Angeles"],
            Colorado: ["Denver"],
          },
          fees: {
            default: 15,
            byState: {
              Texas: 8,
              California: 15,
              Colorado: 15,
            },
            byCity: {
              Houston: 6,
              "Los Angeles": 15,
              Denver: 15,
            },
          },
        },
        default: {
          country: "USA",
          states: ["Texas"],
          citiesByState: {
            Texas: ["Houston"],
          },
          fees: {
            default: 8,
          },
        },
      },
    };

    Object.entries(STORE_DELIVERY_ZONES).forEach(([storeId, deliveryZones]) => {
      const storeRef = doc(db, "stores", storeId);

      operations.push({
        ref: storeRef,
        data: {
          deliveryZones,
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
      });
    });

    await commitBatch(operations);

    alert("Store delivery zones migrated successfully!");
  } catch (error) {
    console.error("Store delivery zone migration failed:", error);
    alert(
      error.message ||
        "Store delivery zone migration failed. Check the console."
    );
  }
};

export const migrateStoreDeliverySettings = async () => {
  try {
    const operations = [];

    const STORE_DELIVERY_SETTINGS = {
      "maple-lekki": {
        country: "Nigeria",
        state: "Lagos",
        cities: ["Lekki", "Victoria Island", "Ajah", "Ikoyi", "Ikeja"],
        fees: {
          default: 1000,
          byCity: {
            Lekki: 800,
            "Victoria Island": 1200,
            Ajah: 1500,
            Ikoyi: 1300,
            Ikeja: 1500,
          },
        },
      },

      "maple-ikeja": {
        country: "Nigeria",
        state: "Lagos",
        cities: ["Ikeja", "Maryland", "Yaba", "Surulere", "Lekki"],
        fees: {
          default: 1000,
          byCity: {
            Ikeja: 700,
            Maryland: 900,
            Yaba: 1200,
            Surulere: 1300,
            Lekki: 1500,
          },
        },
      },

      "maple-abuja": {
        country: "Nigeria",
        state: "Federal Capital Territory",
        cities: ["Abuja", "Wuse", "Garki", "Maitama"],
        fees: {
          default: 1200,
          byCity: {
            Abuja: 1000,
            Wuse: 1200,
            Garki: 1300,
            Maitama: 1500,
          },
        },
      },

      "maple-denver": {
        country: "USA",
        state: "Colorado",
        cities: ["Denver", "Aurora", "Lakewood"],
        fees: {
          default: 8,
          byCity: {
            Denver: 6,
            Aurora: 8,
            Lakewood: 9,
          },
        },
      },

      "maple-los-angeles": {
        country: "USA",
        state: "California",
        cities: ["Los Angeles", "Santa Monica", "Beverly Hills"],
        fees: {
          default: 8,
          byCity: {
            "Los Angeles": 6,
            "Santa Monica": 9,
            "Beverly Hills": 10,
          },
        },
      },

      "maple-houston": {
        country: "USA",
        state: "Texas",
        cities: ["Houston", "Sugar Land", "Katy"],
        fees: {
          default: 8,
          byCity: {
            Houston: 6,
            "Sugar Land": 9,
            Katy: 10,
          },
        },
      },
    };

    Object.entries(STORE_DELIVERY_SETTINGS).forEach(([storeId, delivery]) => {
      const storeRef = doc(db, "stores", storeId);

      operations.push({
        ref: storeRef,
        data: {
          delivery,
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
      });
    });

    await commitBatch(operations);

    alert("Store delivery settings migrated successfully!");
  } catch (error) {
    console.error("Store delivery settings migration failed:", error);
    alert(
      error.message ||
        "Store delivery settings migration failed. Check the console."
    );
  }
};
export const migrateStoreCurrencyAndDeliverySettings = async () => {
  try {
    const operations = [];

    const STORE_SETTINGS = {
      "maple-lekki": {
        currency: {
          code: "NGN",
          locale: "en-NG",
        },
        delivery: {
          country: "Nigeria",
          state: "Lagos",
          cities: ["Lekki", "Victoria Island", "Ajah", "Ikoyi", "Ikeja"],
          fees: {
            default: 1000,
            byCity: {
              Lekki: 800,
              "Victoria Island": 1200,
              Ajah: 1500,
              Ikoyi: 1300,
              Ikeja: 1500,
            },
          },
        },
      },

      "maple-ikeja": {
        currency: {
          code: "NGN",
          locale: "en-NG",
        },
        delivery: {
          country: "Nigeria",
          state: "Lagos",
          cities: ["Ikeja", "Maryland", "Yaba", "Surulere", "Lekki"],
          fees: {
            default: 1000,
            byCity: {
              Ikeja: 700,
              Maryland: 900,
              Yaba: 1200,
              Surulere: 1300,
              Lekki: 1500,
            },
          },
        },
      },

      "maple-abuja": {
        currency: {
          code: "NGN",
          locale: "en-NG",
        },
        delivery: {
          country: "Nigeria",
          state: "Federal Capital Territory",
          cities: ["Abuja", "Wuse", "Garki", "Maitama"],
          fees: {
            default: 1200,
            byCity: {
              Abuja: 1000,
              Wuse: 1200,
              Garki: 1300,
              Maitama: 1500,
            },
          },
        },
      },

      "maple-denver": {
        currency: {
          code: "USD",
          locale: "en-US",
        },
        delivery: {
          country: "USA",
          state: "Colorado",
          cities: ["Denver", "Aurora", "Lakewood"],
          fees: {
            default: 8,
            byCity: {
              Denver: 6,
              Aurora: 8,
              Lakewood: 9,
            },
          },
        },
      },

      "maple-los-angeles": {
        currency: {
          code: "USD",
          locale: "en-US",
        },
        delivery: {
          country: "USA",
          state: "California",
          cities: ["Los Angeles", "Santa Monica", "Beverly Hills"],
          fees: {
            default: 8,
            byCity: {
              "Los Angeles": 6,
              "Santa Monica": 9,
              "Beverly Hills": 10,
            },
          },
        },
      },

      "maple-houston": {
        currency: {
          code: "USD",
          locale: "en-US",
        },
        delivery: {
          country: "USA",
          state: "Texas",
          cities: ["Houston", "Sugar Land", "Katy"],
          fees: {
            default: 8,
            byCity: {
              Houston: 6,
              "Sugar Land": 9,
              Katy: 10,
            },
          },
        },
      },
    };

    Object.entries(STORE_SETTINGS).forEach(([storeId, settings]) => {
      const storeRef = doc(db, "stores", storeId);

      operations.push({
        ref: storeRef,
        data: {
          currency: settings.currency,
          delivery: settings.delivery,
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
      });
    });

    await commitBatch(operations);

    alert("Store currency and delivery settings migrated successfully!");
  } catch (error) {
    console.error("Store currency/delivery migration failed:", error);
    alert(
      error.message ||
        "Store currency/delivery migration failed. Check console."
    );
  }
};

export const migrateStoreInventoryPrices = async () => {
  try {
    const operations = [];

    const STORE_INVENTORY_PRICES = {
      "maple-lekki": {
        "maple-latte": 3500,
        "maple-cappuccino": 3000,
        "maple-espresso": 2000,
        "maple-brewing-guide": 12000,
        "coffee-shop-foundations": 15000,
      },

      "maple-ikeja": {
        "maple-latte": 3300,
        "maple-cappuccino": 3000,
        "maple-espresso": 2000,
        "maple-brewing-guide": 12000,
        "coffee-shop-foundations": 15000,
      },

      "maple-abuja": {
        "maple-latte": 4000,
        "maple-cappuccino": 3500,
        "maple-espresso": 2500,
        "maple-brewing-guide": 13000,
        "coffee-shop-foundations": 16000,
      },

      "maple-los-angeles": {
        "maple-latte": 5.5,
        "maple-cappuccino": 5,
        "maple-espresso": 3.5,
        "maple-brewing-guide": 20,
        "coffee-shop-foundations": 25,
      },

      "maple-denver": {
        "maple-latte": 5,
        "maple-cappuccino": 4.75,
        "maple-espresso": 3.25,
        "maple-brewing-guide": 18,
        "coffee-shop-foundations": 23,
      },

      "maple-houston": {
        "maple-latte": 5,
        "maple-cappuccino": 4.75,
        "maple-espresso": 3.25,
        "maple-brewing-guide": 18,
        "coffee-shop-foundations": 23,
      },
    };

    Object.entries(STORE_INVENTORY_PRICES).forEach(([storeId, products]) => {
      Object.entries(products).forEach(([productId, price]) => {
        const inventoryRef = doc(db, "stores", storeId, "inventory", productId);

        operations.push({
          ref: inventoryRef,
          data: {
            productId,
            price,
            updatedAt: serverTimestamp(),
          },
          options: { merge: true },
        });
      });
    });

    await commitBatch(operations);

    alert("Store inventory prices migrated successfully!");
  } catch (error) {
    console.error("Store inventory price migration failed:", error);
    alert(
      error.message || "Store inventory price migration failed. Check console."
    );
  }
};

export const cleanGlobalProductPricesAndDeleteNewProducts = async () => {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));

    const updatePromises = productsSnapshot.docs.map((productDoc) => {
      const productRef = doc(db, "products", productDoc.id);

      return updateDoc(productRef, {
        price: deleteField(),
        basePrice: deleteField(),
        referencePrice: deleteField(),
        referenceCurrency: deleteField(),
        updatedAt: serverTimestamp(),
      });
    });

    await Promise.all(updatePromises);

    const accidentallyCreatedProductIds = [
      "maple-cappuccino",
      "maple-espresso",
      "maple-latte",
      "maple-brewing-guide",
    ];

    const deletePromises = accidentallyCreatedProductIds.map((productId) => {
      const productRef = doc(db, "products", productId);
      return deleteDoc(productRef);
    });

    await Promise.all(deletePromises);

    alert(
      "Product prices removed and accidental products deleted successfully!"
    );
  } catch (error) {
    console.error("Product cleanup failed:", error);
    alert(error.message || "Product cleanup failed. Check console.");
  }
};


export const deleteAccidentalProductsFromAllStoreInventories = async () => {
  try {
    const accidentalProductIds = [
      "maple-cappuccino",
      "maple-espresso",
      "maple-latte",
      "maple-brewing-guide",
    ];

    const storesSnapshot = await getDocs(collection(db, "stores"));

    const deletePromises = [];

    storesSnapshot.docs.forEach((storeDoc) => {
      accidentalProductIds.forEach((productId) => {
        const inventoryRef = doc(
          db,
          "stores",
          storeDoc.id,
          "inventory",
          productId
        );

        deletePromises.push(deleteDoc(inventoryRef));
      });
    });

    await Promise.all(deletePromises);

    alert("Accidental products removed from all store inventories.");
  } catch (error) {
    console.error("Store inventory cleanup failed:", error);
    alert(
      error.message || "Store inventory cleanup failed. Check the console."
    );
  }
};


export const updateMapleAbujaInventoryPrices = async () => {
  try {
    const operations = [];

    const STORE_ID = "maple-abuja";

    const INVENTORY_PRICES = {
      "caramel-latte": 3500,
      "chicken-pizza": 9000,
      "classic-pizza": 8500,
      "coffee-shop-foundations": 15000,
      "espresso-latte": 3000,
      "iced-coffee": 2500,
      "veggie-pizza": 8000,
    };

    Object.entries(INVENTORY_PRICES).forEach(([productId, price]) => {
      const inventoryRef = doc(db, "stores", STORE_ID, "inventory", productId);

      operations.push({
        ref: inventoryRef,
        data: {
          productId,
          price,
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
      });
    });

    await commitBatch(operations);

    alert("Maple Abuja inventory prices updated successfully!");
  } catch (error) {
    console.error("Maple Abuja price update failed:", error);
    alert(error.message || "Maple Abuja price update failed. Check console.");
  }
};