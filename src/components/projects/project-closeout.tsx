"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/toast";

interface Assignee {
  id: string;
  name: string;
}

interface CloseoutItem {
  id: string;
  category: string;
  title: string;
  completed: boolean;
  assigneeId: string | null;
  assignee: Assignee | null;
  dueDate: string | null;
  notes: string | null;
  sortOrder: number;
}

interface ProjectCloseoutProps {
  projectId: string;
}

export function ProjectCloseout({ projectId }: ProjectCloseoutProps) {
  const [items, setItems] = useState<CloseoutItem[]>([]);
  const [users, setUsers] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/closeout?projectId=${projectId}`);
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load closeout checklist", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchItems();
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((data: Assignee[]) => setUsers(data))
      .catch(() => {});
  }, [fetchItems]);

  const updateItem = async (id: string, patch: Partial<CloseoutItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    try {
      const res = await fetch(`/api/closeout/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    } catch {
      toast({ title: "Error", description: "Failed to save change", variant: "destructive" });
      fetchItems();
    }
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading...</div>;

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground shrink-0">
          {completed} / {total} complete ({pct}%)
        </span>
      </div>

      {/* Categories */}
      {categories.map((category) => {
        const catItems = items.filter((i) => i.category === category);
        const catDone = catItems.filter((i) => i.completed).length;

        return (
          <div key={category} className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
              <h3 className="text-base font-semibold">{category.replace(/^\d+\.\s*/, "")}</h3>
              <span className="text-xs text-muted-foreground">{catDone}/{catItems.length}</span>
            </div>
            <div className="divide-y divide-border">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 px-4 py-3 ${item.completed ? "bg-muted/30" : ""}`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => updateItem(item.id, { completed: e.target.checked })}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500 cursor-pointer"
                  />

                  {/* Title */}
                  <span
                    className={`flex-1 leading-snug ${
                      item.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {item.title}
                  </span>

                  {/* Assignee */}
                  <select
                    value={item.assigneeId ?? ""}
                    onChange={(e) =>
                      updateItem(item.id, { assigneeId: e.target.value || null })
                    }
                    className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground w-36 shrink-0"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>

                  {/* Due date */}
                  <input
                    type="date"
                    value={item.dueDate ? item.dueDate.slice(0, 10) : ""}
                    onChange={(e) =>
                      updateItem(item.id, { dueDate: e.target.value || null })
                    }
                    className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground w-36 shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
