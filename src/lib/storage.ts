export interface ShopSettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  state: string;
  stateCode: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  upi: string;
  invoicePrefix: string;
  nextInvoiceNo: number;
  defaultGst: number;
}

export interface Product {
  id: string;
  name: string;
  hsn: string;
  unit: string;
  rate: number;
  gst: number;
}

export interface InvoiceItem {
  productId?: string;
  name: string;
  hsn: string;
  unit: string;
  qty: number;
  rate: number;
  gst: number;
  discount: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerGstin: string;
  items: InvoiceItem[];
  notes: string;
  paymentMode: string;
  interState: boolean;
  roundOff: number;
  createdAt: number;
}

const K_SETTINGS = "las_settings_v1";
const K_PRODUCTS = "las_products_v1";
const K_INVOICES = "las_invoices_v1";

export const defaultSettings: ShopSettings = {
  name: "Lokseva Agro Agency",
  tagline: "Hardware • Agriculture Tools • Farm Supplies",
  address: "Main Market Road, Your Town",
  phone: "+91 90000 00000",
  email: "loksevaagro@example.com",
  gstin: "",
  state: "Maharashtra",
  stateCode: "27",
  bankName: "",
  accountNo: "",
  ifsc: "",
  upi: "",
  invoicePrefix: "INV",
  nextInvoiceNo: 1,
  defaultGst: 18,
};

const seedProducts: Product[] = [
  { id: "p1", name: "Iron Nails 2 inch (1 kg)", hsn: "7317", unit: "kg", rate: 90, gst: 18 },
  { id: "p2", name: "MS Wire 8 Gauge (per kg)", hsn: "7217", unit: "kg", rate: 75, gst: 18 },
  { id: "p3", name: "Sickle (Vili)", hsn: "8201", unit: "pcs", rate: 180, gst: 12 },
  { id: "p4", name: "Spade / Phawda", hsn: "8201", unit: "pcs", rate: 350, gst: 12 },
  { id: "p5", name: "PVC Pipe 1 inch (per ft)", hsn: "3917", unit: "ft", rate: 22, gst: 18 },
  { id: "p6", name: "Sprayer Pump 16 L", hsn: "8424", unit: "pcs", rate: 1650, gst: 12 },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function loadSettings(): ShopSettings {
  if (typeof window === "undefined") return defaultSettings;
  return { ...defaultSettings, ...safeParse<Partial<ShopSettings>>(localStorage.getItem(K_SETTINGS), {}) };
}
export function saveSettings(s: ShopSettings) {
  localStorage.setItem(K_SETTINGS, JSON.stringify(s));
}

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(K_PRODUCTS);
  if (raw === null) {
    localStorage.setItem(K_PRODUCTS, JSON.stringify(seedProducts));
    return seedProducts;
  }
  return safeParse<Product[]>(raw, []);
}
export function saveProducts(p: Product[]) {
  localStorage.setItem(K_PRODUCTS, JSON.stringify(p));
}

export function loadInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  return safeParse<Invoice[]>(localStorage.getItem(K_INVOICES), []);
}
export function saveInvoices(inv: Invoice[]) {
  localStorage.setItem(K_INVOICES, JSON.stringify(inv));
}

export function computeTotals(inv: Invoice) {
  let taxable = 0;
  let cgst = 0, sgst = 0, igst = 0;
  for (const it of inv.items) {
    const gross = it.qty * it.rate;
    const afterDisc = gross - (gross * (it.discount || 0)) / 100;
    taxable += afterDisc;
    const tax = (afterDisc * it.gst) / 100;
    if (inv.interState) igst += tax;
    else { cgst += tax / 2; sgst += tax / 2; }
  }
  const totalTax = cgst + sgst + igst;
  const grand = taxable + totalTax + (inv.roundOff || 0);
  return { taxable, cgst, sgst, igst, totalTax, grand };
}

export function numberToWordsINR(num: number): string {
  const n = Math.round(num);
  if (n === 0) return "Zero Rupees Only";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const two = (x: number): string => x < 20 ? a[x] : b[Math.floor(x/10)] + (x%10 ? " " + a[x%10] : "");
  const three = (x: number): string => {
    const h = Math.floor(x/100), r = x%100;
    return (h ? a[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : "");
  };
  let x = n;
  const crore = Math.floor(x / 10000000); x %= 10000000;
  const lakh = Math.floor(x / 100000); x %= 100000;
  const thousand = Math.floor(x / 1000); x %= 1000;
  const hundred = x;
  let out = "";
  if (crore) out += two(crore) + " Crore ";
  if (lakh) out += two(lakh) + " Lakh ";
  if (thousand) out += two(thousand) + " Thousand ";
  if (hundred) out += three(hundred);
  return out.trim() + " Rupees Only";
}

export function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}