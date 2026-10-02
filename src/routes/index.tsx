import { createFileRoute } from "@tanstack/react-router";
import { BillingApp } from "@/components/BillingApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lokseva Agro Agency Billing" },
      { name: "description", content: "Create GST bills, manage products and customers, and download invoices for Lokseva Agro Agency." },
      { property: "og:title", content: "Lokseva Agro Agency Billing" },
      { property: "og:description", content: "Simple offline GST billing for Lokseva Agro Agency." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return <BillingApp />;
}
