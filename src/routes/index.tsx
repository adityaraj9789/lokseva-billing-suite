import { createFileRoute } from "@tanstack/react-router";
import { BillingApp } from "@/components/BillingApp";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <BillingApp />;
}
