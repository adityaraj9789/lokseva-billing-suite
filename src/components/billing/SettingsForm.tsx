import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSettings, type ShopSettings } from "@/lib/storage";
import { toast } from "sonner";

function Field({ label, value, onChange, type = "text" }: { label: string; value: string | number | undefined; onChange: (v: string | number) => void; type?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={String(value ?? "")}
        onChange={(e) => onChange(type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value)}
      />
    </div>
  );
}

export function SettingsForm({ settings, onSaved }: { settings: ShopSettings; onSaved: (s: ShopSettings) => void }) {
  const [s, setS] = useState<ShopSettings>(settings);
  const set = useCallback(<K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => setS((p) => ({ ...p, [k]: v })), []);

  const save = () => { saveSettings(s); onSaved(s); toast.success("Settings saved"); };

  const F = ({ label, k, type = "text" }: { label: string; k: keyof ShopSettings; type?: string }) => (
    <Field label={label} type={type} value={s[k] as string | number | undefined} onChange={(v) => set(k, v as ShopSettings[typeof k])} />
  );

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
          <F label="Bank Name" k="bankName" />
          <F label="Account No." k="accountNo" />
          <F label="IFSC" k="ifsc" />
          <F label="UPI ID" k="upi" />
        </div>
      </div>

      <Button onClick={save}>Save Settings</Button>
    </div>
  );
}