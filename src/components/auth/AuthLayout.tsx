import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";
import AnimatedBrandPanel from "./AnimatedBrandPanel";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      <div className="hidden overflow-hidden md:block md:w-[45%] lg:w-1/2">
        <div className="h-full w-full">
          <AnimatedBrandPanel />
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto bg-background md:overflow-hidden md:bg-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            background:
              "radial-gradient(circle at 28% 30%, rgba(124, 211, 181, 0.28), transparent 28%), radial-gradient(circle at 74% 66%, rgba(88, 164, 179, 0.22), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.72), rgba(245,250,246,0.82))",
          }}
        />

        <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-border bg-card px-5 py-3.5 md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Recycle className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-bold text-foreground">EcoCollect</span>
          </Link>
        </div>

        <div className="relative flex min-h-[calc(100vh-69px)] items-center justify-center px-4 py-6 md:min-h-screen md:px-6 md:py-4 lg:px-8 lg:py-5">
          <div className="w-full max-w-md md:max-w-[31rem]">{children}</div>
        </div>
      </div>
    </div>
  );
}
