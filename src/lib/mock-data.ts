import { Category, Listing, Seller } from "./types";

export const categories: Category[] = [
  { slug: "furniture", name: "Furniture", icon: "Armchair" },
  { slug: "electronics", name: "Electronics", icon: "Smartphone" },
  { slug: "vehicles", name: "Vehicles", icon: "Car" },
  { slug: "housing", name: "Housing", icon: "Home" },
  { slug: "free", name: "Free Stuff", icon: "Gift" },
  { slug: "clothing", name: "Clothing", icon: "Shirt" },
  { slug: "tools", name: "Tools", icon: "Wrench" },
  { slug: "sporting", name: "Sporting Goods", icon: "Dumbbell" },
  { slug: "family", name: "Baby & Kids", icon: "Baby" },
  { slug: "pets", name: "Pets", icon: "PawPrint" },
  { slug: "services", name: "Services", icon: "Briefcase" },
  { slug: "jobs", name: "Jobs", icon: "BadgeDollarSign" },
];

const sellers: Seller[] = [
  { id: "s1", name: "Maria O.", verified: true, memberSince: "2023", responseRate: 96, avatarColor: "#0f6e5c", rating: 4.9, ratingCount: 41 },
  { id: "s2", name: "Devon R.", verified: true, memberSince: "2025", responseRate: 88, avatarColor: "#e8862f", rating: 4.7, ratingCount: 12 },
  { id: "s3", name: "Priya S.", verified: false, memberSince: "2026", responseRate: 73, avatarColor: "#5b6472", rating: 4.5, ratingCount: 3 },
  { id: "s4", name: "Marcus T.", verified: true, memberSince: "2022", responseRate: 99, avatarColor: "#1f8a52", rating: 5.0, ratingCount: 87 },
  { id: "s5", name: "Aaliyah B.", verified: true, memberSince: "2024", responseRate: 91, avatarColor: "#c96e1f", rating: 4.8, ratingCount: 25 },
];

const gradients = [
  "linear-gradient(135deg,#0f6e5c,#1f8a52)",
  "linear-gradient(135deg,#e8862f,#c96e1f)",
  "linear-gradient(135deg,#3d5a80,#293241)",
  "linear-gradient(135deg,#8a93a1,#5b6472)",
  "linear-gradient(135deg,#0b5346,#0f6e5c)",
  "linear-gradient(135deg,#d6483a,#c96e1f)",
];

export const listings: Listing[] = [
  {
    id: "l1",
    title: "Mid-Century Modern Sofa — Excellent Condition",
    price: 275,
    category: "furniture",
    location: "El Paso, TX",
    postedAt: "2026-09-17",
    condition: "Like New",
    description:
      "Beautiful 3-seat sofa, barely used, smoke-free and pet-free home. Solid wood legs, no stains or tears. Moving soon and need it gone by end of month. Pickup only, ground floor.",
    images: [gradients[0], gradients[2]],
    seller: sellers[0],
    featured: true,
  },
  {
    id: "l2",
    title: "PS5 Slim Bundle — 2 Controllers + 4 Games",
    price: 380,
    category: "electronics",
    location: "Fort Bliss, TX",
    postedAt: "2026-09-18",
    condition: "Good",
    description:
      "Selling my PS5 bundle before a PCS move. Works perfectly, includes original box, two DualSense controllers, and four games. Can demo before you buy.",
    images: [gradients[1]],
    seller: sellers[3],
    featured: true,
  },
  {
    id: "l3",
    title: "2018 Toyota Tacoma TRD Off-Road — Clean Title",
    price: 26800,
    category: "vehicles",
    location: "Las Cruces, NM",
    postedAt: "2026-09-15",
    condition: "Good",
    description:
      "72k miles, regularly serviced, new tires in July. Clean Carfax, no accidents. Great truck for the high desert. Serious inquiries only, cash or verified financing.",
    images: [gradients[3], gradients[0]],
    seller: sellers[4],
  },
  {
    id: "l4",
    title: "2BR/1BA Duplex Near Fort Bliss — Available Oct 1",
    price: 1350,
    category: "housing",
    location: "El Paso, TX",
    postedAt: "2026-09-16",
    description:
      "Quiet duplex 10 minutes from the East gate. Washer/dryer hookup, fenced yard, pet friendly with deposit. Military clause included in lease. No smoking.",
    images: [gradients[4]],
    seller: sellers[1],
  },
  {
    id: "l5",
    title: "Free Moving Boxes — Flattened, Good Condition",
    price: 0,
    isFree: true,
    category: "free",
    location: "El Paso, TX",
    postedAt: "2026-09-18",
    description:
      "About 25 boxes of various sizes left over from our move, all flattened and dry. Free to whoever can pick them up this weekend.",
    images: [gradients[5]],
    seller: sellers[2],
  },
  {
    id: "l6",
    title: "Kids Bike (16in) — Barely Ridden",
    price: 45,
    category: "family",
    location: "El Paso, TX",
    postedAt: "2026-09-14",
    condition: "Like New",
    description:
      "Outgrew this bike in a few months. Training wheels included but removable. No rust, tires hold air fine.",
    images: [gradients[2]],
    seller: sellers[0],
  },
  {
    id: "l7",
    title: "DeWalt 20V Cordless Drill Combo Kit",
    price: 95,
    category: "tools",
    location: "Fort Bliss, TX",
    postedAt: "2026-09-13",
    condition: "Good",
    description:
      "Drill + impact driver combo, two batteries, charger, and case. Used on one deployment-prep project, works great.",
    images: [gradients[1]],
    seller: sellers[3],
  },
  {
    id: "l8",
    title: "Peloton Bike — Includes Shoes, Size 9",
    price: 900,
    category: "sporting",
    location: "El Paso, TX",
    postedAt: "2026-09-12",
    condition: "Good",
    description:
      "Well maintained, all-access membership not included. Comes with a pair of cycling shoes size 9 and a mat. Buyer arranges pickup/transport.",
    images: [gradients[0], gradients[3]],
    seller: sellers[4],
  },
  {
    id: "l9",
    title: "Rescue Mix Puppy Needs a Home — 4 Months",
    price: 0,
    isFree: true,
    category: "pets",
    location: "Socorro, TX",
    postedAt: "2026-09-11",
    description:
      "Sweet, healthy puppy looking for a loving family. Up to date on first shots, vet records available. Good with kids and other dogs.",
    images: [gradients[4]],
    seller: sellers[2],
  },
  {
    id: "l10",
    title: "Professional House Cleaning — Flat Rate",
    price: 90,
    category: "services",
    location: "El Paso, TX",
    postedAt: "2026-09-10",
    description:
      "Deep clean or move-out clean, flat rate for up to 1200 sq ft. Background-checked, insured, and I bring my own supplies. Flexible scheduling around duty hours.",
    images: [gradients[5]],
    seller: sellers[1],
  },
  {
    id: "l11",
    title: "Part-Time Warehouse Associate — Weekends",
    price: 18,
    category: "jobs",
    location: "El Paso, TX",
    postedAt: "2026-09-09",
    description:
      "$18/hr, Saturday and Sunday shifts, 8am-4pm. Great for a spouse or part-time schedule. No experience required, on-the-job training provided.",
    images: [gradients[2]],
    seller: sellers[0],
  },
  {
    id: "l12",
    title: "Men's Carhartt Jacket — Size L",
    price: 35,
    category: "clothing",
    location: "El Paso, TX",
    postedAt: "2026-09-08",
    condition: "Good",
    description:
      "Warm, durable, a couple seasons of light wear but no rips or stains. Great for the colder desert nights.",
    images: [gradients[3]],
    seller: sellers[3],
  },
];

export function getListingById(id: string): Listing | undefined {
  return listings.find((l) => l.id === id);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
