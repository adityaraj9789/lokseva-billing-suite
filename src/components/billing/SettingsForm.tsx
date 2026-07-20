import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSettings, type ShopSettings } from "@/lib/storage";
import { toast } from "sonner";

export function SettingsForm({ settings, onSaved }: { settings: ShopSettings; onSaved: (s: ShopSettings) => void }) {
  const [s, setS] = useState<ShopSettings>(settings);
  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => setS((p) => ({ ...p, [k]: v }));

  const save = () => { saveSettings(s); onSaved(s); toast.success("Settings saved"); };

  const F = ({ label, k, type = "text" }: { label: string; k: keyof ShopSettings; type?: string }) => (
    <div><Label>{label}</Label>
      <Input type={type} value={String(s[k] ?? "")} onChange={(e) => {
        const val = type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value;
        set(k, val as ShopSettings[typeof k]);
      }} />
    </div>
  );
  void F;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-primary mb-3">Shop Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Shop Name" k="name" />
          <F label="Tagline" k="tagline" />
          <div className="sm:col-span-2"><F label="Address" k="address" /></div>
          <F label="Phone" k="phone" />
          <F label="Email" k="email" />
          <F label="GSTIN" k="gstin" />
          <F label="State" k="state" />
          <F label="State Code" k="stateCode" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-primary mb-3">Invoice Defaults</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <F label="Invoice Prefix" k="invoicePrefix" />
          <F label="Next Invoice #" k="nextInvoiceNo" type="number" />
          <F label="Default GST %" k="defaultGst" type="number" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-primary mb-3">Bank Details (shown on PDF)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Bank Name</Label><Input value={s.bankName ?? ""} onChange={(e) => set("bankName", e.target.value)} /></div>
          <div><Label>Account No.</Label><Input value={s.accountNo ?? ""} onChange={(e) => set("accountNo", e.target.value)} /></div>
          <div><Label>IFSC</Label><Input value={s.ifsc ?? ""} onChange={(e) => set("ifsc", e.target.value)} /></div>
          <div><Label>UPI ID</Label><Input value={s.upi ?? ""} onChange={(e) => set("upi", e.target.value)} /></div>
        </div>
      </div>

      <Button onClick={save}>Save Settings</Button>
    </div>
  );
}