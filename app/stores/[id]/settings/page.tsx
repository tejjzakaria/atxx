"use client";

import { useParams } from "next/navigation";
import StoreSettingsPanel from "@/components/settings/StoreSettingsPanel";

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  return <StoreSettingsPanel storeId={id} />;
}
