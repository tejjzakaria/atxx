"use client";

import { useState, useEffect, useCallback } from "react";
import type { StoreDoc } from "@/lib/db/stores";

export function useStore(id: string) {
  const [store, setStore] = useState<StoreDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch(`/api/stores/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setStore(data); setLoading(false); });
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  return { store, loading, refresh };
}
