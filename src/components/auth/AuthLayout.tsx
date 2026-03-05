import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";
import AnimatedBrandPanel from "./AnimatedBrandPanel";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Left: Animated Brand Panel (desktop only) ── */}
      <div className="hidden md:block md:w-[45%] lg:w-1/2 flex-shrink-0 overflow-hidden">
        <div className="h-full w-full">
          <AnimatedBrandPanel />
        </div>
      </div>

      {/* ── Right: direct overflow-y-auto on the flex child ── */}
      {/* In a flex row with h-screen on parent, this child is capped at h-screen */}
      {/* overflow-y-auto then creates the scrollbar here, not on <body>        */}
      <div className="flex-1 overflow-y-auto bg-background md:bg-muted/30">
        {/* Mobile-only mini header — sticky inside the scroll area */}
        <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-border bg-card px-5 py-3.5 md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Recycle className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-bold text-foreground">EcoCollect</span>
          </Link>
        </div>

        {/* Form content */}
        <div className="flex justify-center px-4 py-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
