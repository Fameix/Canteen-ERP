import type { Category, MenuItem, Hotel } from "./types"
import menuImagePaths from "./menu-image-paths.json"

export const DEMO_HOTEL: Hotel = {
  id: "hotel_001",
  name: "Murugan Hotel",
  address: "12, Main Street, Coimbatore, Tamil Nadu 641001",
  phone: "+91 98765 43210",
  timezone: "Asia/Kolkata",
  currency: "INR",
  receiptFooter: "Thank you! Visit again.",
  taxEnabled: false,
  taxRate: 0,
}

// Pexels photos are bundled under public/images/menu for reliable local loading.
// License: Pexels Free License (https://www.pexels.com/license/)
// Attribution not required but appreciated.
const P = {
  idli: 4331489,
  pongal: 9645253,
  vada: 2569760,
  parotta: 8617361,
  chapati: 7351727,
  dosa: 5560763,
  upma: 30769669,
  idiyappam: 2636717,
  thali: 9266190,
  chicken_biryani: 12737656,
  veg_biryani: 7353393,
  lemon_rice: 4595316,
  boiled_egg: 1815902,
  omelette: 722223,
  fried_chicken: 35071813,
  filter_coffee: 20738867,
  tea: 16942969,
  milk: 12984540,
  lassi: 7429050,
  lemon_juice: 4134388,
  herbal_tea: 1638278,
  mocktail: 4669292,
  watermelon_juice: 1337825,
  fruit_juice: 8215115,
  samosa: 14477873,
  corn: 5899656,
  sprouts: 17975575,
  salad: 1059905,
  noodles: 4210851,
  vanilla_ice_cream: 1582628,
  chocolate_ice_cream: 1343504,
} as const

function img(id: number): string {
  return `/images/menu/${id}.jpg`
}

// Source: Om Saravana Bhava Menu (5).pdf, pages 2-8.
// Prices below are rupees; application prices are integer paise.
// Tuple: [name, rupees, pexelsPhotoId]
const MENU_GROUPS: {
  id: string
  name: string
  products: [string, number, number][]
}[] = [
  {
    id: "cat_breakfast",
    name: "Breakfast",
    products: [
      ["Idly (2pcs)", 25, P.idli],
      ["Podi Idly (2pcs)", 30, P.idli],
      ["Chapathi", 20, P.chapati],
      ["Parotta", 25, P.parotta],
      ["Pongal", 40, P.pongal],
      ["Ragi Puttu", 50, P.upma],
      ["Aval Upuma", 50, P.upma],
      ["Ragi Upuma", 50, P.upma],
      ["Rava Upuma", 50, P.upma],
      ["Idiyappam Thengai Paal", 50, P.idiyappam],
      ["Vadai", 15, P.vada],
      ["Sambar Vadai", 20, P.vada],
      ["Jumbo Breakfast", 59, P.thali],
    ],
  },
  {
    id: "cat_dosa",
    name: "Dosa Varieties",
    products: [
      ["Kal Dosa", 20, P.dosa],
      ["Podi Dosa", 25, P.dosa],
      ["Onion Dosa", 25, P.dosa],
      ["Ghee Dosa", 30, P.dosa],
      ["Egg Dosa", 35, P.omelette],
    ],
  },
  {
    id: "cat_salad",
    name: "Salad",
    products: [["Healthy Salad Plate", 70, P.salad]],
  },
  {
    id: "cat_lunch",
    name: "Lunch",
    products: [
      ["Veg Meals", 110, P.thali],
      ["Non Veg Meals", 140, P.thali],
      ["Chicken Biryani", 130, P.chicken_biryani],
      ["Chicken 65 Biryani", 150, P.chicken_biryani],
      ["Veg Biryani", 80, P.veg_biryani],
      ["Veg Pulao", 80, P.veg_biryani],
      ["Variety Rice", 60, P.lemon_rice],
    ],
  },
  {
    id: "cat_egg",
    name: "Egg",
    products: [
      ["Boiled Egg", 15, P.boiled_egg],
      ["Mutta Thokku", 20, P.boiled_egg],
      ["Omlette", 20, P.omelette],
      ["Murungakeerai Omlette", 30, P.omelette],
    ],
  },
  {
    id: "cat_chicken",
    name: "Chicken",
    products: [
      ["Green Chicken", 150, P.fried_chicken],
      ["Chettinadu Chicken", 150, P.fried_chicken],
      ["Pepper Chicken", 150, P.fried_chicken],
      ["Chicken 65", 150, P.fried_chicken],
    ],
  },
  {
    id: "cat_soup",
    name: "Herbal Soup",
    products: [
      ["Mooligai Soup", 30, P.herbal_tea],
      ["Mudavattu Kilangu Soup", 30, P.herbal_tea],
      ["Veg Mushroom Soup", 40, P.herbal_tea],
      ["Murungakeerai Soup", 40, P.herbal_tea],
    ],
  },
  {
    id: "cat_hot_beverages",
    name: "Hot Beverages",
    products: [
      ["Milk", 20, P.milk],
      ["Coffee", 20, P.filter_coffee],
      ["Tea", 20, P.tea],
      ["Black Coffee", 15, P.filter_coffee],
      ["Black Tea", 15, P.tea],
      ["Lemon Tea", 20, P.tea],
      ["Honey Lemon Tea", 25, P.tea],
      ["Boost", 25, P.milk],
      ["Horlicks", 25, P.milk],
      ["Badam Milk", 25, P.milk],
    ],
  },
  {
    id: "cat_herbal_drink",
    name: "Herbal Drink",
    products: [
      ["Sukku Malli Coffee", 25, P.herbal_tea],
      ["Sangu Poo Tea", 25, P.herbal_tea],
      ["Avaram Poo Tea", 25, P.herbal_tea],
      ["Hibiscus Tea", 25, P.herbal_tea],
      ["Samanthi Tea", 25, P.herbal_tea],
      ["ABC Malt", 25, P.herbal_tea],
      ["Paruthi Paal", 25, P.milk],
    ],
  },
  {
    id: "cat_mocktail",
    name: "Mocktail",
    products: [
      ["Blue Curacao", 60, P.mocktail],
      ["Mint & Lime", 60, P.mocktail],
      ["Pina Colada", 60, P.mocktail],
      ["Virgin Mojito", 60, P.mocktail],
    ],
  },
  {
    id: "cat_cold_beverages",
    name: "Cold Beverages",
    products: [
      ["Butter Milk", 15, P.lassi],
      ["Lemon Soda", 30, P.lemon_juice],
      ["Nannari Sarbath", 30, P.mocktail],
      ["Lassi", 40, P.lassi],
      ["Naval Pala Sarbath", 40, P.fruit_juice],
      ["Mint Lemonade", 40, P.lemon_juice],
    ],
  },
  {
    id: "cat_healthy_snacks",
    name: "Healthy Snacks",
    products: [
      ["Sprouted Green Grams", 20, P.sprouts],
      ["Sundal", 30, P.sprouts],
      ["Verkadalai", 30, P.sprouts],
      ["Corn", 30, P.corn],
      ["Sweet Potato", 30, P.corn],
      ["Karupatti Paniyaram", 40, P.pongal],
      ["Kara Paniyaram", 40, P.pongal],
    ],
  },
  {
    id: "cat_juice",
    name: "Fresh Juice",
    products: [
      ["Lemon", 30, P.lemon_juice],
      ["Amla", 40, P.fruit_juice],
      ["Carrot", 40, P.fruit_juice],
      ["Papaya", 50, P.fruit_juice],
      ["Chikku", 50, P.fruit_juice],
      ["Musk Melon", 50, P.watermelon_juice],
      ["Red Banana Dates", 50, P.fruit_juice],
      ["Fig", 60, P.fruit_juice],
      ["Watermelon", 60, P.watermelon_juice],
      ["Pomegranate", 60, P.fruit_juice],
      ["Pineapple", 60, P.fruit_juice],
      ["Mosambi", 60, P.lemon_juice],
      ["Apple", 70, P.fruit_juice],
    ],
  },
  {
    id: "cat_maggie",
    name: "Maggie",
    products: [
      ["Veg Maggie", 40, P.noodles],
      ["Cheese Maggie", 50, P.noodles],
      ["Egg Maggie", 50, P.noodles],
      ["Masala Maggie", 60, P.noodles],
    ],
  },
  {
    id: "cat_ice_cream",
    name: "Ice Cream",
    products: [
      ["Vanilla (1 scoop)", 30, P.vanilla_ice_cream],
      ["Vanilla (2 scoops)", 50, P.vanilla_ice_cream],
      ["Strawberry (1 scoop)", 30, P.vanilla_ice_cream],
      ["Strawberry (2 scoops)", 50, P.vanilla_ice_cream],
      ["Chocolate (1 scoop)", 30, P.chocolate_ice_cream],
      ["Chocolate (2 scoops)", 50, P.chocolate_ice_cream],
    ],
  },
  {
    id: "cat_snacks",
    name: "Snacks",
    products: [
      ["Samosa", 15, P.samosa],
      ["Bread Sandwich", 40, P.salad],
      ["Bread Omlette", 40, P.omelette],
    ],
  },
]

export const DEMO_CATEGORIES: Category[] = MENU_GROUPS.map((group, index) => ({
  id: group.id,
  hotelId: "hotel_001",
  name: group.name,
  displayOrder: index + 1,
  active: true,
}))

export const DEMO_MENU_ITEMS: MenuItem[] = MENU_GROUPS.flatMap((group) =>
  group.products.map(([name, rupees, photoId], index) => ({
    id: `osb_${group.id}_${index + 1}`,
    hotelId: "hotel_001",
    categoryId: group.id,
    name,
    priceMinor: rupees * 100,
    isAvailable: true,
    imageUrl: (menuImagePaths as Record<string, string>)[`osb_${group.id}_${index + 1}`] ?? img(photoId),
    displayOrder: index + 1,
    createdAt: "2026-10-15T00:00:00Z",
    updatedAt: "2026-10-15T00:00:00Z",
  }))
)
