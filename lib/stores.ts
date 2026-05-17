export type Status = "Active" | "Paused" | "Disconnected";

export interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: "Fulfilled" | "Pending" | "Cancelled";
  date: string;
}

export interface Store {
  id: number;
  name: string;
  url: string;
  status: Status;
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  color: string;
  initials: string;
  recentOrders: Order[];
}

export const STORES: Store[] = [
  {
    id: 1, name: "Lumino Beauty", url: "lumino-beauty.atxx.store",
    status: "Active", revenue: 24500, orders: 1204, customers: 890, products: 134,
    color: "#ec4899", initials: "LB",
    recentOrders: [
      { id: "#1041", customer: "Emma Watson",  product: "Rose Serum 50ml",   amount: 49,  status: "Fulfilled", date: "Mar 16" },
      { id: "#1040", customer: "Ava Thompson", product: "Glow Kit Bundle",   amount: 89,  status: "Fulfilled", date: "Mar 16" },
      { id: "#1039", customer: "Mia Clarke",   product: "SPF Moisturiser",   amount: 34,  status: "Pending",   date: "Mar 15" },
      { id: "#1038", customer: "Noah Adams",   product: "Eye Cream Duo",     amount: 62,  status: "Cancelled", date: "Mar 15" },
      { id: "#1037", customer: "Liam Foster",  product: "Hydra Toner 100ml", amount: 28,  status: "Fulfilled", date: "Mar 14" },
    ],
  },
  {
    id: 2, name: "TechGear Hub", url: "techgear.atxx.store",
    status: "Active", revenue: 18200, orders: 876, customers: 654, products: 89,
    color: "#3b82f6", initials: "TG",
    recentOrders: [
      { id: "#2091", customer: "Jake Miller",  product: "Mechanical Keyboard", amount: 129, status: "Fulfilled", date: "Mar 16" },
      { id: "#2090", customer: "Sara Lee",     product: "USB-C Hub 7-in-1",   amount: 59,  status: "Pending",   date: "Mar 16" },
      { id: "#2089", customer: "Ryan Park",    product: "Webcam 4K Pro",      amount: 199, status: "Fulfilled", date: "Mar 15" },
      { id: "#2088", customer: "Chloe Evans",  product: "Wireless Charger",   amount: 39,  status: "Fulfilled", date: "Mar 14" },
      { id: "#2087", customer: "Tom Wilson",   product: "LED Desk Lamp",      amount: 45,  status: "Cancelled", date: "Mar 14" },
    ],
  },
  {
    id: 3, name: "The Cozy Store", url: "cozy.atxx.store",
    status: "Paused", revenue: 8900, orders: 421, customers: 312, products: 57,
    color: "#f59e0b", initials: "TC",
    recentOrders: [
      { id: "#3021", customer: "Sophie Hall",  product: "Linen Throw Blanket",  amount: 79, status: "Fulfilled", date: "Mar 12" },
      { id: "#3020", customer: "Isla Brown",   product: "Ceramic Mug Set",      amount: 38, status: "Pending",   date: "Mar 11" },
      { id: "#3019", customer: "Ethan Ross",   product: "Scented Candle Pack",  amount: 44, status: "Fulfilled", date: "Mar 10" },
      { id: "#3018", customer: "Lily Turner",  product: "Woven Storage Basket", amount: 55, status: "Cancelled", date: "Mar 9"  },
      { id: "#3017", customer: "James White",  product: "Cotton Cushion Cover", amount: 29, status: "Fulfilled", date: "Mar 8"  },
    ],
  },
  {
    id: 4, name: "Luxe Threads", url: "luxe.atxx.store",
    status: "Active", revenue: 31000, orders: 1540, customers: 1120, products: 210,
    color: "#8b5cf6", initials: "LT",
    recentOrders: [
      { id: "#4201", customer: "Grace Kim",    product: "Silk Slip Dress",     amount: 249, status: "Fulfilled", date: "Mar 16" },
      { id: "#4200", customer: "Zoe Martin",   product: "Cashmere Sweater",    amount: 189, status: "Fulfilled", date: "Mar 16" },
      { id: "#4199", customer: "Hannah Scott", product: "Linen Wide-Leg Pant", amount: 145, status: "Pending",   date: "Mar 15" },
      { id: "#4198", customer: "Olivia Reed",  product: "Blazer Set – Ivory",  amount: 320, status: "Fulfilled", date: "Mar 15" },
      { id: "#4197", customer: "Ella Hughes",  product: "Knit Midi Skirt",     amount: 98,  status: "Cancelled", date: "Mar 14" },
    ],
  },
];

export function getStore(id: string | number): Store | undefined {
  return STORES.find(s => s.id === Number(id));
}

export const STATUS_DOT: Record<Status, string> = {
  Active:       "bg-green-500",
  Paused:       "bg-amber-400",
  Disconnected: "bg-red-400",
};

export const STATUS_BADGE: Record<Status, string> = {
  Active:       "bg-green-100 text-green-700",
  Paused:       "bg-amber-100 text-amber-700",
  Disconnected: "bg-red-100 text-red-600",
};

export function fmtRevenue(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K MAD` : `${n} MAD`;
}
