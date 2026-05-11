export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  type: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviewCount: number;
  colors: { name: string; hex: string }[];
  sizes: string[];
  images: string[];
  description: string;
  isNew?: boolean;
  isTrending?: boolean;
};

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const products: Product[] = [
  {
    id: "1", slug: "phantom-runner-1", name: "Phantom Runner 1", brand: "VOLT",
    category: "Unisex", type: "Shoes", price: 149, compareAt: 189, rating: 4.7, reviewCount: 248,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Volt", hex: "#d4ff00" }, { name: "White", hex: "#f5f5f5" }],
    sizes: ["7", "8", "9", "10", "11", "12"],
    images: [u("photo-1542291026-7eec264c27ff"), u("photo-1606107557195-0e29a4b5b4aa"), u("photo-1600185365926-3a2ce3cdb9eb")],
    description: "Engineered for speed. The Phantom Runner 1 fuses responsive cushioning with a featherweight upper for explosive everyday performance.",
    isNew: true, isTrending: true,
  },
  {
    id: "2", slug: "core-zip-hoodie", name: "Core Zip Hoodie", brand: "VOLT",
    category: "Men", type: "Hoodies", price: 89, rating: 4.6, reviewCount: 132,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Heather", hex: "#9a9a9a" }],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [u("photo-1556821840-3a63f95609a7"), u("photo-1620799140408-edc6dcb6d633")],
    description: "Heavyweight French terry zip hoodie cut for layering. Brushed interior, ribbed cuffs, dropped shoulders.",
    isTrending: true,
  },
  {
    id: "3", slug: "track-pants-classic", name: "Track Pants Classic", brand: "VOLT",
    category: "Women", type: "Pants", price: 75, rating: 4.5, reviewCount: 88,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Stone", hex: "#cdc8bf" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [u("photo-1594633312681-425c7b97ccd1"), u("photo-1552902865-b72c031ac5ea")],
    description: "Tapered tricot track pant with side stripe and zippered ankle. Classic silhouette, modern fit.",
    isTrending: true,
  },
  {
    id: "4", slug: "graphic-box-tee", name: "Graphic Box Tee", brand: "VOLT",
    category: "Unisex", type: "Tees", price: 35, compareAt: 45, rating: 4.4, reviewCount: 412,
    colors: [{ name: "White", hex: "#f5f5f5" }, { name: "Black", hex: "#0a0a0a" }, { name: "Volt", hex: "#d4ff00" }],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    images: [u("photo-1521572163474-6864f9cf17ab"), u("photo-1583743814966-8936f5b7be1a")],
    description: "Boxy fit cotton tee with chest graphic. Pre-washed for that lived-in feel.",
    isTrending: true,
  },
  {
    id: "5", slug: "shell-jacket-pro", name: "Shell Jacket Pro", brand: "VOLT",
    category: "Men", type: "Jackets", price: 199, rating: 4.8, reviewCount: 64,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Olive", hex: "#4a5d3a" }],
    sizes: ["S", "M", "L", "XL"],
    images: [u("photo-1591047139829-d91aecb6caea"), u("photo-1551028719-00167b16eac5")],
    description: "Waterproof three-layer shell with sealed seams. Built for the worst, designed for everywhere.",
    isNew: true,
  },
  {
    id: "6", slug: "flex-leggings", name: "Flex Leggings", brand: "VOLT",
    category: "Women", type: "Pants", price: 68, rating: 4.7, reviewCount: 301,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Charcoal", hex: "#3a3a3a" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [u("photo-1506629082955-511b1aa562c8"), u("photo-1518310383802-640c2de311b2")],
    description: "Four-way stretch leggings with high waist and hidden pocket. Squat-proof guarantee.",
    isTrending: true,
  },
  {
    id: "7", slug: "court-low-shoe", name: "Court Low", brand: "VOLT",
    category: "Unisex", type: "Shoes", price: 95, rating: 4.5, reviewCount: 187,
    colors: [{ name: "White", hex: "#f5f5f5" }, { name: "Black", hex: "#0a0a0a" }],
    sizes: ["7", "8", "9", "10", "11", "12"],
    images: [u("photo-1595950653106-6c9ebd614d3a"), u("photo-1600269452121-4f2416e55c28")],
    description: "Heritage court silhouette in premium leather. Vulcanized rubber sole, padded collar.",
  },
  {
    id: "8", slug: "oversized-crew", name: "Oversized Crew", brand: "VOLT",
    category: "Unisex", type: "Hoodies", price: 79, rating: 4.6, reviewCount: 95,
    colors: [{ name: "Cream", hex: "#efe7d6" }, { name: "Black", hex: "#0a0a0a" }],
    sizes: ["S", "M", "L", "XL"],
    images: [u("photo-1556821840-3a63f95609a7"), u("photo-1620799140408-edc6dcb6d633")],
    description: "Heavyweight oversized crewneck. Drop shoulder, cropped hem, vintage wash.",
  },
  {
    id: "9", slug: "bucket-hat-volt", name: "Bucket Hat Volt", brand: "VOLT",
    category: "Unisex", type: "Accessories", price: 32, rating: 4.3, reviewCount: 54,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Volt", hex: "#d4ff00" }],
    sizes: ["One Size"],
    images: [u("photo-1521369909029-2afed882baee"), u("photo-1576871337632-b9aef4c17ab9")],
    description: "Nylon bucket hat with reflective trim. Packable.",
    isNew: true,
  },
  {
    id: "10", slug: "tech-cargo-pant", name: "Tech Cargo Pant", brand: "VOLT",
    category: "Men", type: "Pants", price: 110, rating: 4.5, reviewCount: 76,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Khaki", hex: "#9a8a6a" }],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [u("photo-1473966968600-fa801b869a1a"), u("photo-1624378439575-d8705ad7ae80")],
    description: "Ripstop cargo with articulated knees and zippered pockets. Tactical meets street.",
  },
  {
    id: "11", slug: "ribbed-tank", name: "Ribbed Tank", brand: "VOLT",
    category: "Women", type: "Tees", price: 28, rating: 4.4, reviewCount: 142,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "White", hex: "#f5f5f5" }, { name: "Volt", hex: "#d4ff00" }],
    sizes: ["XS", "S", "M", "L"],
    images: [u("photo-1602810316693-3667c854239a"), u("photo-1571945153237-4929e783af4a")],
    description: "Ribbed knit fitted tank. Soft, stretchy, layerable.",
  },
  {
    id: "12", slug: "moto-puffer", name: "Moto Puffer", brand: "VOLT",
    category: "Women", type: "Jackets", price: 229, compareAt: 279, rating: 4.7, reviewCount: 38,
    colors: [{ name: "Black", hex: "#0a0a0a" }],
    sizes: ["XS", "S", "M", "L"],
    images: [u("photo-1551028719-00167b16eac5"), u("photo-1591047139829-d91aecb6caea")],
    description: "Cropped recycled-down puffer with moto-quilt detailing. Wind- and water-resistant.",
    isNew: true,
  },
  {
    id: "13", slug: "trail-runner-x", name: "Trail Runner X", brand: "VOLT",
    category: "Unisex", type: "Shoes", price: 165, rating: 4.6, reviewCount: 121,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Olive", hex: "#4a5d3a" }],
    sizes: ["7", "8", "9", "10", "11", "12", "13"],
    images: [u("photo-1606107557195-0e29a4b5b4aa"), u("photo-1542291026-7eec264c27ff")],
    description: "Aggressive lugged outsole, rock plate, and weatherproof mesh. Off-road ready.",
  },
  {
    id: "14", slug: "essential-tee-3pack", name: "Essential Tee 3-Pack", brand: "VOLT",
    category: "Men", type: "Tees", price: 60, rating: 4.5, reviewCount: 532,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "White", hex: "#f5f5f5" }],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [u("photo-1583743814966-8936f5b7be1a"), u("photo-1521572163474-6864f9cf17ab")],
    description: "Three crew-neck tees in supima cotton. Wardrobe foundation.",
  },
  {
    id: "15", slug: "performance-cap", name: "Performance Cap", brand: "VOLT",
    category: "Unisex", type: "Accessories", price: 25, rating: 4.4, reviewCount: 98,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "White", hex: "#f5f5f5" }],
    sizes: ["One Size"],
    images: [u("photo-1521369909029-2afed882baee"), u("photo-1588850561407-ed78c282e89b")],
    description: "Lightweight running cap with sweatband and laser-perforated panels.",
  },
  {
    id: "16", slug: "fleece-wide-pant", name: "Fleece Wide Pant", brand: "VOLT",
    category: "Women", type: "Pants", price: 85, rating: 4.6, reviewCount: 67,
    colors: [{ name: "Grey", hex: "#7a7a7a" }, { name: "Black", hex: "#0a0a0a" }],
    sizes: ["XS", "S", "M", "L"],
    images: [u("photo-1552902865-b72c031ac5ea"), u("photo-1594633312681-425c7b97ccd1")],
    description: "Wide-leg heavyweight fleece pant with elastic waist. Lounge-meets-street.",
  },
  {
    id: "17", slug: "nylon-crossbody", name: "Nylon Crossbody", brand: "VOLT",
    category: "Unisex", type: "Accessories", price: 55, rating: 4.5, reviewCount: 73,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Volt", hex: "#d4ff00" }],
    sizes: ["One Size"],
    images: [u("photo-1591561954557-26941169b49e"), u("photo-1547949003-9792a18a2601")],
    description: "Compact ripstop crossbody with adjustable strap. Carries the essentials.",
    isTrending: true,
  },
  {
    id: "18", slug: "compression-tee", name: "Compression Tee", brand: "VOLT",
    category: "Men", type: "Tees", price: 42, rating: 4.5, reviewCount: 156,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "White", hex: "#f5f5f5" }],
    sizes: ["S", "M", "L", "XL"],
    images: [u("photo-1581655353564-df123a1eb820"), u("photo-1583743814966-8936f5b7be1a")],
    description: "Second-skin compression fit for training. Sweat-wicking, anti-odor.",
  },
  {
    id: "19", slug: "windbreaker-volt", name: "Windbreaker Volt", brand: "VOLT",
    category: "Unisex", type: "Jackets", price: 119, rating: 4.6, reviewCount: 82,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Volt", hex: "#d4ff00" }],
    sizes: ["S", "M", "L", "XL"],
    images: [u("photo-1551028719-00167b16eac5"), u("photo-1591047139829-d91aecb6caea")],
    description: "Packable nylon windbreaker with elastic hem and reflective hits.",
    isNew: true,
  },
  {
    id: "20", slug: "logo-socks-3pack", name: "Logo Socks 3-Pack", brand: "VOLT",
    category: "Unisex", type: "Accessories", price: 22, rating: 4.7, reviewCount: 312,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "White", hex: "#f5f5f5" }],
    sizes: ["S/M", "L/XL"],
    images: [u("photo-1586350977771-2a1dc6d59175"), u("photo-1577909556468-7d6db8b4e4f1")],
    description: "Cushioned crew socks with arch support. Three-pack.",
  },
  {
    id: "21", slug: "studio-shorts", name: "Studio Shorts", brand: "VOLT",
    category: "Women", type: "Pants", price: 48, rating: 4.5, reviewCount: 54,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Stone", hex: "#cdc8bf" }],
    sizes: ["XS", "S", "M", "L"],
    images: [u("photo-1506629082955-511b1aa562c8"), u("photo-1518310383802-640c2de311b2")],
    description: "High-rise studio shorts with hidden pocket. Squat-proof, sweat-wicking.",
  },
  {
    id: "22", slug: "wool-beanie", name: "Wool Beanie", brand: "VOLT",
    category: "Unisex", type: "Accessories", price: 28, rating: 4.6, reviewCount: 89,
    colors: [{ name: "Black", hex: "#0a0a0a" }, { name: "Cream", hex: "#efe7d6" }, { name: "Volt", hex: "#d4ff00" }],
    sizes: ["One Size"],
    images: [u("photo-1576871337632-b9aef4c17ab9"), u("photo-1521369909029-2afed882baee")],
    description: "Ribbed merino wool beanie with foldover cuff.",
  },
  {
    id: "23", slug: "denim-relaxed", name: "Denim Relaxed", brand: "VOLT",
    category: "Men", type: "Pants", price: 95, rating: 4.4, reviewCount: 47,
    colors: [{ name: "Indigo", hex: "#2c3e5d" }, { name: "Black", hex: "#0a0a0a" }],
    sizes: ["28", "30", "32", "34", "36", "38"],
    images: [u("photo-1473966968600-fa801b869a1a"), u("photo-1542272604-787c3835535d")],
    description: "Relaxed-fit selvedge denim. Heavy 14oz weight, button fly.",
  },
  {
    id: "24", slug: "court-mid", name: "Court Mid", brand: "VOLT",
    category: "Unisex", type: "Shoes", price: 115, rating: 4.5, reviewCount: 132,
    colors: [{ name: "White", hex: "#f5f5f5" }, { name: "Black", hex: "#0a0a0a" }, { name: "Volt", hex: "#d4ff00" }],
    sizes: ["7", "8", "9", "10", "11", "12"],
    images: [u("photo-1600185365926-3a2ce3cdb9eb"), u("photo-1595950653106-6c9ebd614d3a")],
    description: "Mid-cut court silhouette. Premium leather, padded ankle, classic stripe.",
    isTrending: true,
  },
];

export const categories = [
  { name: "Men", image: u("photo-1617137968427-85924c800a22") },
  { name: "Women", image: u("photo-1483985988355-763728e1935b") },
  { name: "Unisex", image: u("photo-1620799140408-edc6dcb6d633") },
];
