"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

interface CloseoutTask {
  id: string;
  title: string;
  category: string;
  dueDate: string | null;
  project: { id: string; name: string };
  completedAt?: Date;
}

export function CloseoutTasks() {
  const [tasks, setTasks] = useState<CloseoutTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/closeout/assigned");
      if (!res.ok) return;
      setTasks(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const markDone = async (id: string) => {
    const now = new Date();
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completedAt: now } : t));
    await fetch(`/api/closeout/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  if (loading) return null;
  if (tasks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-amber-500" />
          My Closeout Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {tasks.map((task) => {
            const due = task.dueDate ? parseISO(task.dueDate) : null;
            const overdue = due && isPast(due);
            const done = !!task.completedAt;

            return (
              <li
                key={task.id}
                className={`flex items-start gap-3 px-6 py-3 transition-opacity duration-500 ${done ? "opacity-50" : ""}`}
              >
                <button
                  onClick={() => !done && markDone(task.id)}
                  disabled={done}
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors ${
                    done
                      ? "border-emerald-500 bg-emerald-500 cursor-default"
                      : "border-border hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  }`}
                  aria-label="Mark complete"
                >
                  {done && (
                    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full p-0.5">
                      <path d="M3 8l3.5 3.5 6.5-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug truncate ${done ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Link
                      href={`/projects/${task.project.id}/closeout`}
                      className="text-xs text-muted-foreground hover:text-foreground truncate"
                    >
                      {task.project.name}
                    </Link>
                    {done ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                        Completed {format(task.completedAt!, "MMM d")}
                      </span>
                    ) : due ? (
                      <span className={`text-xs shrink-0 ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {overdue ? "Overdue " : "Due "}
                        {format(due, "MMM d")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
