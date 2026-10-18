import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MapView } from "./map-view";

export const metadata: Metadata = {
  title: "Mapa · SIGHE",
};

export default async function MapaPage() {
  const supabase = await createClient();

  const { data: floors } = await supabase
    .from("floors")
    .select("id, name, sort_order, canvas_width, canvas_height")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return <MapView initialFloors={floors ?? []} />;
}
