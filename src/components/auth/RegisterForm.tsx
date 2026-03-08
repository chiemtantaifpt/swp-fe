import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type FieldErrors = Partial<
  Record<
    | "name"
    | "phone"
    | "email"
    | "password"
    | "confirmPassword",
    string
  >
>;

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Citizen");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const clearError = (field: keyof FieldErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const validate = () => {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    else if (!/^(0|\+84)\d{9}$/.test(phone.replace(/\s/g, "")))
      e.phone = "Số điện thoại không hợp lệ (VD: 0901234567)";
    if (!email.trim()) e.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Email không đúng định dạng";
    if (!password) e.password = "Vui lòng nhập mật khẩu";
    else if (password.length < 6) e.password = "Tối thiểu 6 ký tự";
    else if (!/\d/.test(password)) e.password = "Phải chứa ít nhất 1 chữ số";
    if (!confirmPassword) e.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (password !== confirmPassword) e.confirmPassword = "Mật khẩu không trùng khớp";
    // Removed enterprise validation as per requirements
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent | React.MouseEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(name, phone, email, password, role);
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Đăng ký thất bại. Vui lòng thử lại!";
      msg.split("\n").forEach((line) => {
        if (line.trim()) toast.error(line.trim());
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-elevated">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-2xl font-bold text-foreground">
          Tạo tài khoản
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Đăng ký để bắt đầu sử dụng nền tảng EcoCollect
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Use div instead of form to prevent browser from auto-clearing password fields on failed submission */}
        <div className="space-y-4">
          {/* Row: Họ tên + Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Họ tên</Label>
              <Input
                id="reg-name"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError("name"); }}
                disabled={loading}
                className={`focus-visible:ring-2 focus-visible:ring-primary/50 ${errors.name ? "border-destructive" : ""}`}
                autoComplete="name"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-phone">Số điện thoại</Label>
              <Input
                id="reg-phone"
                type="tel"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
                disabled={loading}
                className={`focus-visible:ring-2 focus-visible:ring-primary/50 ${errors.phone ? "border-destructive" : ""}`}
                autoComplete="tel"
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
              disabled={loading}
              className={`focus-visible:ring-2 focus-visible:ring-primary/50 ${errors.email ? "border-destructive" : ""}`}
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                disabled={loading}
                className={`pr-10 focus-visible:ring-2 focus-visible:ring-primary/50 ${errors.password ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Input
                id="reg-confirm"
                type={showConfirmPw ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
                disabled={loading}
                className={`pr-10 focus-visible:ring-2 focus-visible:ring-primary/50 ${errors.confirmPassword ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPw((v) => !v)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)} disabled={loading}>
              <SelectTrigger className="focus:ring-2 focus:ring-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Citizen">Công dân</SelectItem>
                <SelectItem value="Enterprise">Doanh nghiệp tái chế</SelectItem>
                <SelectItem value="Collector">Người thu gom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button
            type="button"
            onClick={handleSubmit}
            className="mt-2 w-full font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Tạo tài khoản
              </>
            )}
          </Button>
        </div>

        <Separator className="my-5" />

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline transition-colors"
          >
            Đăng nhập
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
