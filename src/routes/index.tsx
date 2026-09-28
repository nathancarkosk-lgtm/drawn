import { createFileRoute } from "@tanstack/react-router";
import { DrawnApp } from "@/components/drawn-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DrawnApp />;
}
