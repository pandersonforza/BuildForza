"use client";

import { useState, useEffect } from "react";
import { PROJECT_GROUPS } from "@/lib/constants";

const FALLBACK: string[] = [...PROJECT_GROUPS];

export function useGroups(): string[] {
  const [groups, setGroups] = useState<string[]>(FALLBACK);

  useEffect(() => {
    fetch("/api/admin/groups")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { name: string }[] | null) => {
        if (data && data.length > 0) setGroups(data.map((g) => g.name));
      })
      .catch(() => {/* keep fallback */});
  }, []);

  return groups;
}
