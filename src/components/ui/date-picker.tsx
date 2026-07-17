"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Set date", className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = value ? parseISO(value) : undefined;
  const label = selected ? format(selected, "MMM d, yyyy") : placeholder;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded border border-border bg-background px-1.5 py-0.5 text-xs transition-colors hover:bg-muted w-full",
          value ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <CalendarIcon className="h-3 w-3 shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        {value && (
          <X
            className="h-3 w-3 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 rounded-md border border-border bg-card shadow-lg p-3">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : null);
              setOpen(false);
            }}
            classNames={{
              month: "space-y-3",
              month_caption: "flex justify-center items-center gap-2 px-1 py-1",
              caption_label: "text-sm font-medium text-foreground",
              nav: "flex items-center gap-1",
              button_previous: "h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              button_next: "h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "w-9 text-center text-xs text-muted-foreground font-normal pb-1",
              weeks: "space-y-0.5",
              week: "flex",
              day: "p-0",
              day_button: cn(
                "h-9 w-9 rounded-md text-sm transition-colors",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              ),
              selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md",
              today: "font-semibold text-primary",
              outside: "text-muted-foreground opacity-40",
              disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
              hidden: "invisible",
            }}
          />
        </div>
      )}
    </div>
  );
}
