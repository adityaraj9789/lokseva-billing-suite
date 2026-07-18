import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Trash2, Plus, FileDown, Printer, Save, Search } from "lucide-react";
import {
  computeTotals, fmt, loadInvoices, loadProducts, loadCustomers, saveInvoices, saveSettings,
  upsertCustomerFromInvoice,
  type Invoice, type InvoiceItem, type Product, type Customer, type ShopSettings,
} from "@/lib/storage";
import { generateInvoicePDF } from "@/lib/pdf";
import { toast } from "sonner";

function emptyItem(defaultGst: number): InvoiceItem {
  return { name: "", hsn: "", unit: "pcs", qty: 1, rate: 0, gst: defaultGst, discount: 0 };
}

function nextInvoiceNumber(s: ShopSettings) {
  const n = String(s.nextInvoiceNo).padStart(4, "0");
  const y = new Date().getFullYear();
  return `${s.invoicePrefix}-${y}-${n}`;
}

export function NewInvoice({
  settings, onSettingsChange, onSaved,
}: {
  settings: ShopSettings;
  onSettingsChange: (s: ShopSettings) => void;
  onSaved: () => void;
}) {
  const [products] = useState<Product[]>(() => loadProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [pickerOpen, setPickerOpen] = useState<number | null>(null);
  const [custOpen, setCustOpen] = useState(false);
  const [inv, setInv] = useState<Invoice>(() => ({
    id: crypto.randomUUID(),
    number: nextInvoiceNumber(settings),
    date: new Date().toISOString().slice(0, 10),
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerGstin: "",
    items: [emptyItem(settings.defaultGst)],
    notes: "",
    paymentMode: "Cash",
    interState: false,
    roundOff: 0,
    createdAt: Date.now(),
  }));

  const totals = useMemo(() => computeTotals(inv), [inv]);

  const setItem = (i: number, patch: Partial<InvoiceItem>) => {
    setInv((p) => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) }));
  };
  const removeItem = (i: number) => setInv((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const addItem = () => setInv((p) => ({ ...p, items: [...p.items, emptyItem(settings.defaultGst)] }));

  const pickProduct = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItem(i, { productId: p.id, name: p.name, hsn: p.hsn, unit: p.unit, rate: p.rate, gst: p.gst });
  };

  const validate = () => {
    if (!inv.customerName.trim()) { toast.error("Enter customer name"); return false; }
    if (!inv.items.length || inv.items.some((it) => !it.name.trim() || it.qty <= 0)) {
      toast.error("Add at least one item with name and quantity"); return false;
    }
    return true;
  };

  const persist = () => {
    const list = loadInvoices();
    const existing = list.findIndex((x) => x.id === inv.id);
    if (existing >= 0) list[existing] = inv; else list.unshift(inv);
    saveInvoices(list);
    upsertCustomerFromInvoice(inv.customerName, inv.customerPhone, inv.customerAddress, inv.customerGstin);
    setCustomers(loadCustomers());
    const nextS = { ...settings, nextInvoiceNo: settings.nextInvoiceNo + 1 };
    saveSettings(nextS);
    onSettingsChange(nextS);
  };

  const pickCustomer = (c: Customer) => {
    setInv((p) => ({
      ...p,
      customerName: c.name,
      customerPhone: c.phone,
      customerAddress: c.address,
      customerGstin: c.gstin,
    }));
    setCustOpen(false);
  };

  const handleSave = () => {
    if (!validate()) return;
    persist();
    toast.success(`Invoice ${inv.number} saved`);
    onSaved();
  };

  const handlePdf = async (action: "save" | "print") => {
    if (!validate()) return;
    persist();
    await generateInvoicePDF(inv, settings, action);
    toast.success(action === "print" ? "Opening print view…" : "PDF downloaded");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Invoice No.</Label>
              <Input value={inv.number} onChange={(e) => setInv({ ...inv, number: e.target.value })} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={inv.date} onChange={(e) => setInv({ ...inv, date: e.target.value })} />
            </div>
            <div>
              <Label>Customer Name *</Label>
              <div className="flex gap-1">
                <Input value={inv.customerName} onChange={(e) => setInv({ ...inv, customerName: e.target.value })} placeholder="Ramesh Patil" />
                <Popover open={custOpen} onOpenChange={setCustOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0" aria-label="Search customers">
                      <Search className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[280px]" align="end">
                    <Command
                      filter={(value, search) => {
                        const c = customers.find((x) => x.id === value);
                        if (!c) return 0;
                        const hay = `${c.name} ${c.phone} ${c.gstin}`.toLowerCase();
                        return hay.includes(search.toLowerCase()) ? 1 : 0;
                      }}
                    >
                      <CommandInput placeholder="Search name or phone…" />
                      <CommandList>
                        <CommandEmpty>No customers saved yet.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((c) => (
                            <CommandItem key={c.id} value={c.id} onSelect={() => pickCustomer(c)}>
                              <div className="flex flex-col">
                                <span className="text-sm">{c.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {[c.phone, c.address].filter(Boolean).join(" • ")}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={inv.customerPhone} onChange={(e) => setInv({ ...inv, customerPhone: e.target.value })} placeholder="+91 …" />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input value={inv.customerAddress} onChange={(e) => setInv({ ...inv, customerAddress: e.target.value })} />
            </div>
            <div>
              <Label>GSTIN (optional)</Label>
              <Input value={inv.customerGstin} onChange={(e) => setInv({ ...inv, customerGstin: e.target.value })} />
            </div>
            <div>
              <Label>Payment Mode</Label>
              <Select value={inv.paymentMode} onValueChange={(v) => setInv({ ...inv, paymentMode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Cash", "UPI", "Card", "Bank Transfer", "Credit"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-primary">Items</h3>
            <Button size="sm" variant="secondary" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Add Row</Button>
          </div>

          <div className="space-y-3">
            {inv.items.map((it, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-12 items-end border-b border-border/50 pb-3 last:border-0">
                <div className="sm:col-span-4">
                  <Label className="text-xs">Item</Label>
                  <div className="flex gap-1">
                    <Input value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder="Product name" />
                    {products.length > 0 && (
                      <Popover open={pickerOpen === i} onOpenChange={(o) => setPickerOpen(o ? i : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="shrink-0" aria-label="Search products">
                            <Search className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[280px]" align="end">
                          <Command
                            filter={(value, search) => {
                              const p = products.find((x) => x.id === value);
                              if (!p) return 0;
                              const hay = `${p.name} ${p.hsn}`.toLowerCase();
                              return hay.includes(search.toLowerCase()) ? 1 : 0;
                            }}
                          >
                            <CommandInput placeholder="Search product or HSN…" />
                            <CommandList>
                              <CommandEmpty>No products found.</CommandEmpty>
                              <CommandGroup>
                                {products.map((p) => (
                                  <CommandItem
                                    key={p.id}
                                    value={p.id}
                                    onSelect={(v) => { pickProduct(i, v); setPickerOpen(null); }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm">{p.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        HSN {p.hsn} • ₹{p.rate} • {p.gst}% GST
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">HSN</Label>
                  <Input value={it.hsn} onChange={(e) => setItem(i, { hsn: e.target.value })} />
                </div>
                <div className="sm:col-span-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min={0} step="0.01" value={it.qty} onChange={(e) => setItem(i, { qty: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="sm:col-span-1">
                  <Label className="text-xs">Unit</Label>
                  <Input value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })} />
                </div>
                <div className="sm:col-span-1">
                  <Label className="text-xs">Rate</Label>
                  <Input type="number" min={0} step="0.01" value={it.rate} onChange={(e) => setItem(i, { rate: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="sm:col-span-1">
                  <Label className="text-xs">Disc %</Label>
                  <Input type="number" min={0} step="0.01" value={it.discount} onChange={(e) => setItem(i, { discount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="sm:col-span-1">
                  <Label className="text-xs">GST %</Label>
                  <Input type="number" min={0} step="0.01" value={it.gst} onChange={(e) => setItem(i, { gst: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => removeItem(i)} aria-label="Remove item">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <Label>Notes</Label>
          <Textarea value={inv.notes} onChange={(e) => setInv({ ...inv, notes: e.target.value })} placeholder="Terms, warranty info, thanks…" rows={3} />
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-4 sm:p-6 sticky top-4">
          <h3 className="font-semibold text-primary mb-3">Summary</h3>
          <div className="space-y-2 text-sm">
            <Row label="Taxable" value={fmt(totals.taxable)} />
            {inv.interState ? (
              <Row label="IGST" value={fmt(totals.igst)} />
            ) : (
              <>
                <Row label="CGST" value={fmt(totals.cgst)} />
                <Row label="SGST" value={fmt(totals.sgst)} />
              </>
            )}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Label className="text-xs text-muted-foreground">Round Off</Label>
              <Input className="h-8 w-24 text-right" type="number" step="0.01"
                value={inv.roundOff} onChange={(e) => setInv({ ...inv, roundOff: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox id="inter" checked={inv.interState} onCheckedChange={(v) => setInv({ ...inv, interState: !!v })} />
              <label htmlFor="inter" className="text-xs">Inter-state (IGST)</label>
            </div>
            <div className="border-t border-border pt-3 mt-2 flex items-center justify-between">
              <span className="font-semibold">Grand Total</span>
              <span className="text-xl font-bold text-primary">{fmt(totals.grand)}</span>
            </div>
          </div>

          <div className="grid gap-2 mt-4">
            <Button onClick={() => handlePdf("save")} className="w-full">
              <FileDown className="h-4 w-4 mr-2" />Save & Download PDF
            </Button>
            <Button onClick={() => handlePdf("print")} variant="secondary" className="w-full">
              <Printer className="h-4 w-4 mr-2" />Save & Print
            </Button>
            <Button onClick={handleSave} variant="outline" className="w-full">
              <Save className="h-4 w-4 mr-2" />Save Only
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}