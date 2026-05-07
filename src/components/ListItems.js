const menuList = [
  {
    name: "Classic Pizza",
    img: "/images/pizza.jpg",
    about: "Freshly baked pizza with rich tomato sauce and melted cheese.",
    price: 17,
    tags: ["pizza", "food"],
    availableAt: ["maple-haven", "coffee-corner"],
  },
  {
    name: "Espresso Latte",
    img: "/images/latte.jpg",
    about: "Rich espresso with smooth steamed milk.",
    price: 12,
    tags: ["coffee", "hot-drink"],
    availableAt: ["maple-haven", "the-springfield-roastery", "coffee-corner"],
  },
  {
    name: "Chicken Pizza",
    img: "/images/pizza.jpg",
    about: "Pizza topped with seasoned chicken, cheese, and herbs.",
    price: 19,
    tags: ["pizza", "food"],
    availableAt: ["the-springfield-roastery", "coffee-corner"],
  },
  {
    name: "Veggie Pizza",
    img: "/images/pizza.jpg",
    about: "A fresh vegetable pizza with peppers, onions, and sweet corn.",
    price: 16,
    tags: ["pizza", "vegetarian"],
    availableAt: ["maple-haven", "the-springfield-roastery"],
  },
  {
    name: "Iced Coffee",
    img: "/images/latte.jpg",
    about: "Cold coffee served over ice for a refreshing boost.",
    price: 10,
    tags: ["coffee", "cold-drink"],
    availableAt: ["maple-haven", "maple-lekki", "ikeja-espresso"],
  },
  {
    name: "Caramel Latte",
    img: "/images/latte.jpg",
    about: "Smooth latte blended with sweet caramel flavor.",
    price: 14,
    tags: ["coffee", "hot-drink"],
    availableAt: ["coffee-corner", "brewed-bliss", "maple-lekki"],
  },
];

const feedBack = [
  {
    id: 1,
    name: "John Doe",
    review: "Never had such great service before",
    rating: "",
    profile: "",
  },
  {
    id: 2,
    name: "John Doe",
    review: " Can't wait tell my friends all about this place",
    rating: "",
    profile: "",
  },
  {
    id: 3,
    name: "John Doe",
    review: "Love working with my pals here",
    rating: "",
    profile: "",
  },
  {
    id: 4,
    name: "John Doe",
    review: "i could stay here until my lunch break is over",
    rating: "",
    profile: "",
  },
];

const locations = [
  { id: 1, label: "Springfield" },
  { id: 2, label: "Austin" },
  { id: 3, label: "Denver" },
  { id: 4, label: "Seattle" },
  { id: 5, label: "Lagos" },
];

const locatedStores = [
  {
    id: "maple-haven",
    name: "Maple Haven",
    img: "/images/store1.jpg",
    address: "123 Maple Street, Springfield, IL",
  },
  {
    id: "the-springfield-roastery",
    name: "The Springfield Roastery",
    img: "/images/store2.jpg",
    address: "99 Oak Avenue, Springfield, IL",
  },
  {
    id: "coffee-corner",
    name: "Coffee Corner",
    img: "/images/store3.jpg",
    address: "456 Elm Avenue, Austin, TX",
  },
  {
    id: "keep-austin-brewed",
    name: "Keep Austin Brewed",
    img: "/images/store4.jpg",
    address: "22 Congress Ave, Austin, TX",
  },
  {
    id: "brewed-bliss",
    name: "Brewed Bliss",
    img: "/images/store5.jpg",
    address: "789 Oak Lane, Denver, CO",
  },
  {
    id: "caffeine-cove",
    name: "Caffeine Cove",
    img: "/images/store6.jpg",
    address: "101 Pine Road, Seattle, WA",
  },
  {
    id: "maple-lekki",
    name: "Maple Lekki",
    img: "/images/store7.jpg",
    address: "Plot 15, Admiralty Way, Lekki, Lagos",
  },
  {
    id: "ikeja-espresso",
    name: "Ikeja Espresso",
    img: "/images/store8.jpg",
    address: "Allen Avenue, Ikeja, Lagos",
  },
];

export { menuList, feedBack, locations, locatedStores };
