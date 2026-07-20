import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo.png";
import { loadSettings, type ShopSettings } from "@/lib/storage";
import { NewInvoice } from "./billing/NewInvoice";
import { InvoicesList } from "./billing/InvoicesList";
import { ProductsManager } from "./billing/ProductsManager";
import { CustomersManager } from "./billing/CustomersManager";
import { SettingsForm } from "./billing/SettingsForm";
import { Toaster } from "@/components/ui/sonner";

export function BillingApp() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [tab, setTab] = useState("new");

  useEffect(() => { setSettings(loadSettings()); }, []);

  const shop = settings;
  const header = useMemo(() => (
    <header className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
        <img src={logo} alt="Lokseva Agro Agency logo" width={56} height={56} className="rounded-full ring-2 ring-primary/20" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-primary leading-tight truncate">
            {shop?.name || "Lokseva Agro Agency"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{shop?.tagline}</p>
        </div>
        <div className="hidden sm:block text-right text-xs text-muted-foreground">
          <div>Billing Software</div>
          <div>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
      </div>
    </header>
  ), [shop]);

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-background">
      {header}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full sm:w-auto">
            <TabsTrigger value="new">New Bill</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <NewInvoice settings={settings} onSettingsChange={setSettings} onSaved={() => setTab("invoices")} />
          </TabsContent>
          <TabsContent value="invoices" className="mt-6">
            <InvoicesList settings={settings} />
          </TabsContent>
          <TabsContent value="products" className="mt-6">
            <Card className="p-4 sm:p-6"><ProductsManager /></Card>
          </TabsContent>
          <TabsContent value="customers" className="mt-6">
            <Card className="p-4 sm:p-6"><CustomersManager /></Card>
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <Card className="p-4 sm:p-6"><SettingsForm settings={settings} onSaved={setSettings} /></Card>
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}