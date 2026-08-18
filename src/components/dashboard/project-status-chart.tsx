"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ChartData {
  name: string;
  value: number;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  Active: "#10b981",
  "On Hold": "#f59e0b",
  Completed: "#3b82f6",
  Dead: "#ef4444",
};

export function ProjectStatusChart({
  group,
  activeStatusFilter,
  onStatusClick,
}: {
  group?: string;
  activeStatusFilter?: string | null;
  onStatusClick?: (status: string) => void;
}) {
  const [statusData, setStatusData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) return;
        let projects: { status: string; projectGroup: string }[] = await res.json();
        if (group && group !== "All") {
          projects = projects.filter((p) => p.projectGroup === group);
        }

        const statusCounts: Record<string, number> = {};
        for (const p of projects) {
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        }

        setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
      } catch {
        // silently handle
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [group]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const pieData = statusData.map((d) => ({
    ...d,
    fill: activeStatusFilter && activeStatusFilter !== d.name
      ? (STATUS_CHART_COLORS[d.name] || "#94a3b8") + "40"
      : (STATUS_CHART_COLORS[d.name] || "#94a3b8"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Projects by Status
          {activeStatusFilter && (
            <span className="text-xs font-normal text-muted-foreground">
              — {activeStatusFilter}
              <button
                onClick={() => onStatusClick?.(activeStatusFilter)}
                className="ml-1 text-primary hover:underline"
              >
                ✕
              </button>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-[200px] h-[200px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  onClick={(entry) => entry?.name && onStatusClick?.(entry.name as string)}
                  style={{ cursor: "pointer" }}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.375rem",
                    color: "var(--color-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-1.5 font-medium text-muted-foreground">Count</th>
                </tr>
              </thead>
              <tbody>
                {statusData.map((entry) => {
                  const isActive = activeStatusFilter === entry.name;
                  const isDimmed = activeStatusFilter && !isActive;
                  return (
                    <tr
                      key={entry.name}
                      onClick={() => onStatusClick?.(entry.name)}
                      className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                        isActive ? "bg-primary/10" : "hover:bg-muted/40"
                      } ${isDimmed ? "opacity-40" : ""}`}
                    >
                      <td className="py-1.5 flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: STATUS_CHART_COLORS[entry.name] || "#94a3b8" }}
                        />
                        <span className={isActive ? "font-medium" : ""}>{entry.name}</span>
                      </td>
                      <td className="text-right py-1.5 font-medium">{entry.value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
