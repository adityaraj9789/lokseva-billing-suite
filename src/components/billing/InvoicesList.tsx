import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { computeTotals, fmt, loadInvoices, saveInvoices, type Invoice, type ShopSettings } from "@/lib/storage";
import { generateInvoicePDF } from "@/lib/pdf";
import { FileDown, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function InvoicesList({ settings }: { settings: ShopSettings }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return invoices;
    return invoices.filter((i) =>
      i.number.toLowerCase().includes(s) ||
      i.customerName.toLowerCase().includes(s) ||
      i.customerPhone.includes(s)
    );
  }, [invoices, q]);

  const remove = (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    const next = invoices.filter((i) => i.id !== id);
    setInvoices(next);
    saveInvoices(next);
    toast.success("Invoice deleted");
  };

  const totalRevenue = invoices.reduce((sum, i) => sum + computeTotals(i).grand, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Invoices</div><div className="text-2xl font-bold">{invoices.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total Billed</div><div className="text-2xl font-bold text-primary">{fmt(totalRevenue)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Search</div>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Number, name, phone…" className="mt-1" />
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No invoices yet. Create one from the "New Bill" tab.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground">
                <tr>
                  <th className="text-left p-3">Invoice</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const t = computeTotals(inv);
                  return (
                    <tr key={inv.id} className="border-t border-border">
                      <td className="p-3 font-medium">{inv.number}</td>
                      <td className="p-3">{new Date(inv.date).toLocaleDateString("en-IN")}</td>
                      <td className="p-3">
                        <div>{inv.customerName}</div>
                        <div className="text-xs text-muted-foreground">{inv.customerPhone}</div>
                      </td>
                      <td className="p-3 text-right font-semibold">{fmt(t.grand)}</td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => generateInvoicePDF(inv, settings, "save")} aria-label="Download PDF">
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => generateInvoicePDF(inv, settings, "print")} aria-label="Print">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(inv.id)} aria-label="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}