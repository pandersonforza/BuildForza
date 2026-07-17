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
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/closeout/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
  };

  if (loading) return null;
  if (tasks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          My Closeout Tasks
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {tasks.length} item{tasks.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {tasks.map((task) => {
            const due = task.dueDate ? parseISO(task.dueDate) : null;
            const overdue = due && isPast(due);

            return (
              <li key={task.id} className="flex items-start gap-3 px-6 py-3">
                <button
                  onClick={() => markDone(task.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                  aria-label="Mark complete"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Link
                      href={`/projects/${task.project.id}/closeout`}
                      className="text-xs text-muted-foreground hover:text-foreground truncate"
                    >
                      {task.project.name}
                    </Link>
                    {due && (
                      <span
                        className={`text-xs shrink-0 ${
                          overdue ? "text-destructive font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {overdue ? "Overdue " : "Due "}
                        {format(due, "MMM d")}
                      </span>
                    )}
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
