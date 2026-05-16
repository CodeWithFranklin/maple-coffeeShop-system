export const formatMoney = (amount, currencyCode = "USD", locale = "en-US") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount || 0));
};

export const getProductId = (item) => item?.productId || item?.id;

export const buildCartItem = ({ item, quantity, currency }) => {
  return {
    id: item.id,
    productId: item.productId || item.id,
    name: item.name || "",
    img: item.img || "",
    tags: item.tags || [],
    category: item.category || "",
    price: Number(item.price || 0),
    stock: Number(item.stock || 0),
    quantity: Number(quantity || 1),
    currency,
  };
};

export const mergeCartItems = ({ existingItems = [], guestItems = [] }) => {
  const mergedMap = new Map();

  existingItems.forEach((item) => {
    const productId = getProductId(item);
    if (!productId) return;

    mergedMap.set(productId, {
      ...item,
      id: productId,
      productId,
      quantity: Number(item.quantity || 1),
    });
  });

  guestItems.forEach((item) => {
    const productId = getProductId(item);
    if (!productId) return;

    const existingItem = mergedMap.get(productId);

    if (existingItem) {
      mergedMap.set(productId, {
        ...existingItem,
        quantity:
          Number(existingItem.quantity || 0) + Number(item.quantity || 1),
      });

      return;
    }

    mergedMap.set(productId, {
      ...item,
      id: productId,
      productId,
      quantity: Number(item.quantity || 1),
    });
  });

  return Array.from(mergedMap.values());
};

export const buildCartSummary = ({ cartItems, inventoryItems }) => {
  const inventoryMap = new Map(
    inventoryItems.map((item) => [getProductId(item), item])
  );

  const items = cartItems.map((cartItem) => {
    const productId = getProductId(cartItem);
    const inventoryItem = inventoryMap.get(productId);
    const quantity = Number(cartItem.quantity || 1);

    if (!inventoryItem) {
      return {
        ...cartItem,
        id: productId,
        productId,
        name: cartItem.name || "Item",
        img: cartItem.img || "",
        price: Number(cartItem.price || 0),
        quantity,
        blocked: true,
        blockReason: "This item is no longer available at this store.",
      };
    }

    const stock = Number(inventoryItem.stock || 0);
    const available = inventoryItem.available ?? stock > 0;

    const currentItem = {
      ...cartItem,
      ...inventoryItem,
      id: productId,
      productId,
      quantity,
      price: Number(inventoryItem.price || 0),
      lineTotal: Number(inventoryItem.price || 0) * quantity,
    };

    if (inventoryItem.isActive === false) {
      return {
        ...currentItem,
        blocked: true,
        blockReason: "This item is no longer active at this store.",
      };
    }

    if (available === false) {
      return {
        ...currentItem,
        blocked: true,
        blockReason: "This item is currently unavailable.",
      };
    }

    if (stock <= 0) {
      return {
        ...currentItem,
        blocked: true,
        blockReason: "This item is out of stock.",
      };
    }

    if (quantity > stock) {
      return {
        ...currentItem,
        blocked: true,
        blockReason: `Only ${stock} unit(s) available. Reduce the quantity or remove it.`,
      };
    }

    return {
      ...currentItem,
      blocked: false,
      blockReason: "",
    };
  });

  const validItems = items.filter((item) => !item.blocked);
  const blockedItems = items.filter((item) => item.blocked);

  const subtotal = validItems.reduce((acc, item) => {
    return acc + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);

  const itemCount = items.reduce((acc, item) => {
    return acc + Number(item.quantity || 0);
  }, 0);

  return {
    items,
    validItems,
    blockedItems,
    subtotal,
    itemCount,
    canCheckout: validItems.length > 0 && blockedItems.length === 0,
  };
};
