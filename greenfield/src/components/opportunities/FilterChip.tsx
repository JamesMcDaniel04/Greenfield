import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

/**
 * A pill-shaped multi-select dropdown. Mirrors the "filter chip" pattern
 * common on filter bars: collapsed = "Industry", with active selections it
 * becomes "Industry · 2" and gains a clear-X.
 */
export default function FilterChip({ label, options, selected, onChange }: Props) {
  const count = selected.length;
  const active = count > 0;

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active
              ? "border-primary/40 bg-primary/[0.06] text-primary"
              : "border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          <span>{label}</span>
          {active && (
            <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
          {active ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Clear ${label}`}
              className="rounded-full p-0.5 hover:bg-primary/10"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange([]);
                }
              }}
            >
              <X className="h-3 w-3" />
            </span>
          ) : (
            <ChevronDown className="h-3 w-3 opacity-60" />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className={cn(
            "z-50 min-w-[14rem] max-h-80 overflow-auto rounded-lg border bg-popover p-1 shadow-lg",
            "data-[state=open]:animate-rise-in",
          )}
        >
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <DropdownMenu.Item
                key={opt}
                onSelect={(e) => { e.preventDefault(); toggle(opt); }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  "outline-none focus:bg-muted",
                  checked && "text-primary",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1">{opt}</span>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
