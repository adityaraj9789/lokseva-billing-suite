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

  const f = (label: string, k: keyof ShopSettings, type: string = "text") => (
    <Field label={label} type={type} value={s[k] as string | number | undefined} onChange={(v) => set(k, v as ShopSettings[typeof k])} />
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-primary mb-3">Shop Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {f("Shop Name", "name")}
          {f("Tagline", "tagline")}
          <div className="sm:col-span-2">{f("Address", "address")}</div>
          {f("Phone", "phone")}
          {f("Email", "email")}
          {f("GSTIN", "gstin")}
          {f("State", "state")}
          {f("State Code", "stateCode")}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-primary mb-3">Invoice Defaults</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {f("Invoice Prefix", "invoicePrefix")}
          {f("Next Invoice #", "nextInvoiceNo", "number")}
          {f("Default GST %", "defaultGst", "number")}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-primary mb-3">Bank Details (shown on PDF)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {f("Bank Name", "bankName")}
          {f("Account No.", "accountNo")}
          {f("IFSC", "ifsc")}
          {f("UPI ID", "upi")}
        </div>
      </div>

      <Button onClick={save}>Save Settings</Button>
    </div>
  );
}