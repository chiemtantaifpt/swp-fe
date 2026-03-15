import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không đúng định dạng";
    }
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const roleToPath: Record<string, string> = {
      Citizen: "/citizen",
      Enterprise: "/enterprise",
      Collector: "/collector",
      Admin: "/admin",
    };

    setLoading(true);
    try {
      await login(email, password);
      const saved = JSON.parse(localStorage.getItem("eco_user") || "{}");
      toast.success("Đăng nhập thành công!");
      navigate(roleToPath[saved.role] || "/");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Email hoặc mật khẩu không đúng";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border border-white/35 bg-white/30 shadow-[0_20px_60px_-18px_rgba(31,61,49,0.35)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.34), rgba(255,255,255,0.14) 45%, rgba(124,211,181,0.12) 100%)",
        }}
      />

      <CardHeader className="relative pb-4">
        <CardTitle className="font-display text-2xl font-bold text-foreground">
          Đăng nhập
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Nhập thông tin tài khoản để truy cập hệ thống
        </CardDescription>
      </CardHeader>

      <CardContent className="relative">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              disabled={loading}
              className={`border-white/45 bg-white/45 transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                errors.email ? "border-destructive focus-visible:ring-destructive/50" : ""
              }`}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                disabled={loading}
                className={`border-white/45 bg-white/45 pr-10 transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  errors.password ? "border-destructive focus-visible:ring-destructive/50" : ""
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            className="mt-2 w-full border border-primary/20 bg-primary text-primary-foreground shadow-[0_16px_30px_-12px_rgba(65,133,148,0.55)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_22px_36px_-14px_rgba(65,133,148,0.65)] active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Đăng nhập
              </>
            )}
          </Button>
        </form>

        <Separator className="my-5 bg-white/35" />

        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
