import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Recycle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    const roleToPath: Record<string, string> = {
      "Citizen": "/citizen",
      "Enterprise": "/enterprise",
      "Collector": "/collector",
      "Admin": "/admin",
    };

    setLoading(true);
    try {
      await login(email, password);
      const saved = JSON.parse(localStorage.getItem("eco_user") || "{}");
      toast.success("Đăng nhập thành công!");
      navigate(roleToPath[saved.role] || "/");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Email hoặc mật khẩu không đúng";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 gradient-hero lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Recycle className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground">EcoCollect</h2>
          <p className="text-muted-foreground">
            Nền tảng kết nối người dân, doanh nghiệp tái chế và dịch vụ thu gom rác theo khu vực.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col items-center justify-center bg-card p-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">EcoCollect</span>
          </Link>

          <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Đăng nhập</h1>
          <p className="mb-8 text-sm text-muted-foreground">Nhập thông tin tài khoản để truy cập hệ thống</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="mt-1"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative mt-1">
                <Input 
                  id="password" 
                  type={showPw ? "text" : "password"} 
                  placeholder="••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                  onClick={() => setShowPw(!showPw)}
                  disabled={loading}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
