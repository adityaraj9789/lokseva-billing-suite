import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadCustomers, saveCustomers, type Customer } from "@/lib/storage";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [draft, setDraft] = useState<Customer>({ id: "", name: "", phone: "", address: "", gstin: "" });
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.address, c.gstin].some((v) => v.toLowerCase().includes(q))
    );
  }, [customers, query]);

  const add = () => {
    if (!draft.name.trim()) { toast.error("Customer name required"); return; }
    const c = { ...draft, id: crypto.randomUUID() };
    const next = [c, ...customers];
    setCustomers(next); saveCustomers(next);
    setDraft({ id: "", name: "", phone: "", address: "", gstin: "" });
    toast.success("Customer added");
  };
  const remove = (id: string) => {
    const next = customers.filter((c) => c.id !== id);
    setCustomers(next); saveCustomers(next);
  };
  const update = (id: string, patch: Partial<Customer>) => {
    const next = customers.map((c) => c.id === id ? { ...c, ...patch } : c);
    setCustomers(next); saveCustomers(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-primary mb-3">Add Customer</h3>
        <div className="grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></div>
          <div><Label>GSTIN</Label><Input value={draft.gstin} onChange={(e) => setDraft({ ...draft, gstin: e.target.value })} /></div>
        </div>
        <Button onClick={add} className="mt-3"><Plus className="h-4 w-4 mr-1" />Add</Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h3 className="font-semibold text-primary">Customers ({filtered.length})</h3>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search name, phone, GSTIN…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="text-left p-2">Name</th><th className="text-left p-2">Phone</th>
                <th className="text-left p-2">Address</th><th className="text-left p-2">GSTIN</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-2"><Input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} /></td>
                  <td className="p-2"><Input value={c.phone} onChange={(e) => update(c.id, { phone: e.target.value })} className="w-32" /></td>
                  <td className="p-2"><Input value={c.address} onChange={(e) => update(c.id, { address: e.target.value })} /></td>
                  <td className="p-2"><Input value={c.gstin} onChange={(e) => update(c.id, { gstin: e.target.value })} className="w-40" /></td>
                  <td className="p-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No customers yet. Add one above, or they'll be saved automatically when you create invoices.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}