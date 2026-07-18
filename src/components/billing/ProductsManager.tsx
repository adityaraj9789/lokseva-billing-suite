import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadProducts, saveProducts, type Product } from "@/lib/storage";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [draft, setDraft] = useState<Product>({ id: "", name: "", hsn: "", unit: "pcs", rate: 0, gst: 18 });

  const add = () => {
    if (!draft.name.trim()) { toast.error("Product name required"); return; }
    const p = { ...draft, id: crypto.randomUUID() };
    const next = [p, ...products];
    setProducts(next); saveProducts(next);
    setDraft({ id: "", name: "", hsn: "", unit: "pcs", rate: 0, gst: 18 });
    toast.success("Product added");
  };
  const remove = (id: string) => {
    const next = products.filter((p) => p.id !== id);
    setProducts(next); saveProducts(next);
  };
  const update = (id: string, patch: Partial<Product>) => {
    const next = products.map((p) => p.id === id ? { ...p, ...patch } : p);
    setProducts(next); saveProducts(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-primary mb-3">Add Product</h3>
        <div className="grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div><Label>HSN</Label><Input value={draft.hsn} onChange={(e) => setDraft({ ...draft, hsn: e.target.value })} /></div>
          <div><Label>Unit</Label><Input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} /></div>
          <div><Label>Rate</Label><Input type="number" step="0.01" value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: parseFloat(e.target.value) || 0 })} /></div>
          <div><Label>GST %</Label><Input type="number" step="0.01" value={draft.gst} onChange={(e) => setDraft({ ...draft, gst: parseFloat(e.target.value) || 0 })} /></div>
        </div>
        <Button onClick={add} className="mt-3"><Plus className="h-4 w-4 mr-1" />Add</Button>
      </div>

      <div>
        <h3 className="font-semibold text-primary mb-3">Products ({products.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="text-left p-2">Name</th><th className="text-left p-2">HSN</th>
                <th className="text-left p-2">Unit</th><th className="text-right p-2">Rate</th>
                <th className="text-right p-2">GST %</th><th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-2"><Input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} /></td>
                  <td className="p-2"><Input value={p.hsn} onChange={(e) => update(p.id, { hsn: e.target.value })} className="w-24" /></td>
                  <td className="p-2"><Input value={p.unit} onChange={(e) => update(p.id, { unit: e.target.value })} className="w-20" /></td>
                  <td className="p-2"><Input type="number" step="0.01" value={p.rate} onChange={(e) => update(p.id, { rate: parseFloat(e.target.value) || 0 })} className="w-24 text-right" /></td>
                  <td className="p-2"><Input type="number" step="0.01" value={p.gst} onChange={(e) => update(p.id, { gst: parseFloat(e.target.value) || 0 })} className="w-20 text-right" /></td>
                  <td className="p-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}