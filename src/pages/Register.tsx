import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Recycle } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Citizen");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation phía FE trước khi gọi API
    if (!name || !phone || !email || !password || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!/\d/.test(password)) {
      toast.error("Mật khẩu phải có ít nhất 1 chữ số (0-9)");
      return;
    }

    if (role === "Enterprise" && (!enterpriseName || !taxCode || !businessAddress || !legalRepresentative || !representativePosition)) {
      toast.error("Vui lòng nhập đầy đủ thông tin doanh nghiệp");
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
      await register(name, phone, email, password, role);
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Đăng ký thất bại. Vui lòng thử lại!";
      // Nếu có nhiều lỗi (mỗi dòng 1 lỗi), show từng toast
      msg.split("\n").forEach((line) => {
        if (line.trim()) toast.error(line.trim());
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-8 shadow-elevated" style={{ maxHeight: "calc(100vh - 2rem)" }}>
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Recycle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">EcoCollect</span>
        </Link>

        <h1 className="mb-2 text-center font-display text-2xl font-bold text-foreground">Tạo tài khoản</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">Đăng ký để bắt đầu sử dụng nền tảng</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Họ tên</Label>
            <Input 
              id="name" 
              placeholder="Nguyễn Văn A" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0901234567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              className="mt-1"
              disabled={loading}
            />
          </div>
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
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              className="mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label>Vai trò</Label>
            <Select value={role} onValueChange={v => setRole(v as UserRole)} disabled={loading}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Citizen">Công dân</SelectItem>
                <SelectItem value="Enterprise">Doanh nghiệp tái chế</SelectItem>
                <SelectItem value="Collector">Người thu gom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
