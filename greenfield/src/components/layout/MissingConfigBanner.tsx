import { Sparkles } from "lucide-react";

import { isSupabaseConfigured } from "@/lib/supabase";

export default function MissingConfigBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="border-b border-amber-300/60 bg-amber-50 text-amber-900">
      <div className="container-wide flex items-start gap-3 py-3 text-sm">
        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <p className="font-medium">
            Demo mode — showing 12 sample opportunities. No backend is connected.
          </p>
          <p className="mt-0.5 text-amber-800/90">
            Browse, filter, and open any opportunity to see the full layout. Accounts, saves, and live data need Supabase —
            copy <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">.env.example</code> to{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">.env</code> in the{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">greenfield/</code> directory when you're ready.
          </p>
        </div>
      </div>
    </div>
  );
}
