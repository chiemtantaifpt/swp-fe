import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, Recycle, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "./NotificationDropdown";

const roleLabels: Record<string, string> = {
  citizen: "Công dân",
  enterprise: "Doanh nghiệp",
  collector: "Thu gom",
  admin: "Quản trị",
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
          <Link to={`/${user?.role}`} className="min-w-0 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="truncate font-display text-base font-bold text-foreground sm:text-lg">EcoCollect</span>
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <NotificationDropdown />
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 transition-colors hover:bg-muted/80"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{user?.name}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {roleLabels[user?.role?.toLowerCase?.() || ""] ?? user?.role}
              </span>
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link to="/profile">Hồ sơ</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" /> Đăng xuất
            </Button>
          </div>

          <button className="shrink-0 md:hidden" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-card p-4 md:hidden">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{user?.name}</span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {roleLabels[user?.role?.toLowerCase?.() || ""] ?? user?.role}
                </span>
              </div>
              <div className="shrink-0">
                <NotificationDropdown />
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="mb-2 w-full justify-start">
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                <User className="mr-1 h-4 w-4" /> Hồ sơ
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
              <LogOut className="mr-1 h-4 w-4" /> Đăng xuất
            </Button>
          </div>
        )}
      </header>

      <main className="container mx-auto overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
