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
import { FilePlus2, ReceiptText, PackageSearch, Users, Settings } from "lucide-react";

const navigation = [
  { value: "new", label: "New Bill", icon: FilePlus2 },
  { value: "invoices", label: "Invoices", icon: ReceiptText },
  { value: "products", label: "Products", icon: PackageSearch },
  { value: "customers", label: "Customers", icon: Users },
  { value: "settings", label: "Settings", icon: Settings },
];

export function BillingApp() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [tab, setTab] = useState("new");

  useEffect(() => { setSettings(loadSettings()); }, []);

  const shop = settings;
  const header = useMemo(() => (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:gap-4 sm:py-4">
        <div className="flex min-w-0 items-center gap-3 sm:flex-1">
        <img src={logo} alt="Lokseva Agro Agency logo" width={56} height={56} className="h-12 w-12 shrink-0 rounded-full ring-2 ring-primary/20 sm:h-14 sm:w-14" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-primary leading-tight truncate">
            {shop?.name || "Lokseva Agro Agency"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{shop?.tagline}</p>
        </div>
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
      <main className="mx-auto max-w-6xl px-3 pb-28 pt-4 sm:px-4 sm:py-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="fixed inset-x-0 bottom-0 z-40 grid h-auto grid-cols-5 rounded-none border-t border-border bg-card p-1 pb-[max(.25rem,env(safe-area-inset-bottom))] shadow-lg sm:static sm:inline-grid sm:w-auto sm:rounded-md sm:border-0 sm:p-1 sm:shadow-none">
            {navigation.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="min-w-0 gap-1 px-1 py-2 text-[10px] sm:px-3 sm:py-1.5 sm:text-sm">
                <Icon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">{label}</span>
              </TabsTrigger>
            ))}
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