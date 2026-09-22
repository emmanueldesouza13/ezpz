export type Settings = {
  id: number;
  logo_url: string;
  platform_mmg_number: string | null;
  listing_fee: number;
  taxi_mmg_number: string | null;
  taxi_fee: number;
  updated_at: string;
};

export type TaxiService = {
  id: string;
  owner_id: string;
  driver_name: string;
  vehicle_make: string;
  vehicle_model: string;
  plate: string;
  service_area: string;
  phone: string;
  mmg_number: string;
  notes: string;
  status: "active" | "removed";
  fee_status: "pending" | "paid" | "waived";
  fee_paid_at: string | null;
  created_at: string;
};

export type Category = {
  slug: string;
  name: string;
  icon: string; // lucide-react component name, e.g. "Briefcase"
  sort_order: number;
};

export type DaySchedule = {
  open: boolean;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
};

export type Schedule = {
  note?: string;
  days?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", DaySchedule>>;
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_color: string;
  avatar_url: string | null;
  verified: boolean;
  is_admin: boolean;
  mmg_number: string | null;
  rating: number;
  rating_count: number;
  response_rate: number;
  available: boolean;
  bio: string | null;
  location: string | null;
  schedule: Schedule | null;
  created_at: string;
};

export type Review = {
  id: string;
  seller_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  reviewer?: Profile;
};

export const DAY_LABELS: { key: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  category: string;
  location: string;
  images: string[]; // uploaded photo public URLs, or (for older/no-photo listings) a CSS gradient string from the preset palette
  video_url: string | null; // optional short clip showing the work, uploaded public URL
  featured: boolean;
  status: "active" | "sold" | "removed";
  fee_status: "pending" | "paid" | "waived";
  fee_paid_at: string | null;
  created_at: string;
  seller?: Profile;
};

export type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listing?: Listing;
  buyer?: Profile;
  seller?: Profile;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

// Preset gradient swatches sellers pick from when posting — keeps the moody
// jewel-tone look without needing photo uploads yet.
export const GRADIENTS = [
  "linear-gradient(135deg,#a72c53,#5e1a3a)",
  "linear-gradient(135deg,#cc9d4e,#8a6323)",
  "linear-gradient(135deg,#6b3fa0,#2e1a4d)",
  "linear-gradient(135deg,#2f8f6b,#134a38)",
  "linear-gradient(135deg,#3a1626,#170a12)",
  "linear-gradient(135deg,#c9713f,#7a1d3c)",
];
