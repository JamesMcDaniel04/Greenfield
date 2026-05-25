import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { emptyFilters, type Filters } from "@/lib/types";
import { MORE_FILTER_VOCAB } from "@/lib/browseFilters";

type MoreFilterKey =
  | "timeToMvp"
  | "buildMethods"
  | "teamSizes"
  | "founderBackgrounds"
  | "domainLearningTimes"
  | "barriersToEntry"
  | "acquisitionChannels";

type SectionConfig = {
  key: MoreFilterKey;
  title: string;
  options: readonly string[];
};

const SECTIONS: SectionConfig[] = [
  { key: "timeToMvp", title: "Time to MVP", options: MORE_FILTER_VOCAB.timeToMvp },
  { key: "buildMethods", title: "Build method", options: MORE_FILTER_VOCAB.buildMethods },
  { key: "teamSizes", title: "Team size", options: MORE_FILTER_VOCAB.teamSizes },
  { key: "founderBackgrounds", title: "Founder background", options: MORE_FILTER_VOCAB.founderBackgrounds },
  { key: "domainLearningTimes", title: "Domain learning time", options: MORE_FILTER_VOCAB.domainLearningTimes },
  { key: "barriersToEntry", title: "Barrier to entry", options: MORE_FILTER_VOCAB.barriersToEntry },
  { key: "acquisitionChannels", title: "Acquisition channel", options: MORE_FILTER_VOCAB.acquisitionChannels },
];

type Props = {
  filters: Filters;
  setFilters: (next: Filters) => void;
  activeCount: number;
};

export default function MoreFiltersDialog({ filters, setFilters, activeCount }: Props) {
  function toggle(key: MoreFilterKey, value: string) {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: next });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-full px-3">
          <SlidersHorizontal className="h-4 w-4" />
          More filters
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/80 px-6 py-5">
          <DialogTitle className="text-3xl">More Filters</DialogTitle>
          <DialogDescription>
            Narrow the catalog by founder fit, build path, and GTM constraints.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5">
          {SECTIONS.map((section, index) => (
            <div key={section.key}>
              {index > 0 ? <Separator className="mb-6" /> : null}
              <section className="pb-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {section.title}
                </h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {section.options.map((option) => {
                    const selected = filters[section.key].includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggle(section.key, option)}
                        className={cn(
                          "rounded-[1.35rem] border px-6 py-4 text-left text-base font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/40 text-foreground hover:border-primary/25 hover:bg-primary/[0.05]",
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          ))}
        </div>

        <DialogFooter className="border-t border-border/80 bg-card px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setFilters({ ...emptyFilters, q: filters.q })}
          >
            Clear all filters
          </Button>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
