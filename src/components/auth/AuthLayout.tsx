import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";
import AnimatedBrandPanel from "./AnimatedBrandPanel";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Left: Animated Brand Panel (desktop only) ── */}
      <div className="hidden md:block md:w-[45%] lg:w-1/2 flex-shrink-0">
        <div className="sticky top-0 h-screen w-full">
          <AnimatedBrandPanel />
        </div>
      </div>

      {/* ── Right: Form area ─────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* Mobile-only mini header */}
        <div className="flex items-center gap-2.5 border-b border-border bg-card px-5 py-3.5 md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Recycle className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-bold text-foreground">EcoCollect</span>
          </Link>
        </div>

        {/* Scrollable form container */}
        <div className="flex flex-1 items-start justify-center overflow-y-auto bg-background py-8 px-4 md:items-center md:bg-muted/30">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
