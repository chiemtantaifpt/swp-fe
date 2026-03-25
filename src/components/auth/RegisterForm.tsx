import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { districtService, wardService } from "@/services/enterpriseConfig";

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
  const [showLocationFields, setShowLocationFields] = useState(false);
  const [districtId, setDistrictId] = useState("");
  const [wardId, setWardId] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const { register } = useAuth();
  const navigate = useNavigate();
  const isCitizen = role === "Citizen";

  const { data: districtPage } = useQuery({
    queryKey: ["registerDistricts"],
    queryFn: () => districtService.getAll({ PageNumber: 1, PageSize: 100 }),
    enabled: isCitizen && showLocationFields,
  });
  const districts = districtPage?.items ?? [];

  const { data: wardPage } = useQuery({
    queryKey: ["registerWards", districtId],
    queryFn: () => wardService.getAll({ DistrictId: districtId, PageNumber: 1, PageSize: 100 }),
    enabled: isCitizen && showLocationFields && !!districtId,
  });
  const wards = wardPage?.items ?? [];

  const clearError = (field: keyof FieldErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const validate = () => {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    else if (!/^(0|\+84)\d{9}$/.test(phone.replace(/\s/g, ""))) {
      e.phone = "Số điện thoại không hợp lệ (VD: 0901234567)";
    }
    if (!email.trim()) e.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Email không đúng định dạng";
    }
    if (!password) e.password = "Vui lòng nhập mật khẩu";
    else if (password.length < 6) e.password = "Tối thiểu 6 ký tự";
    else if (!/\d/.test(password)) e.password = "Phải chứa ít nhất 1 chữ số";
    if (!confirmPassword) e.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (password !== confirmPassword) e.confirmPassword = "Mật khẩu không trùng khớp";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent | React.MouseEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(
        name,
        phone,
        email,
        password,
        role,
        isCitizen && (districtId || wardId)
          ? {
              districtId: districtId || undefined,
              wardId: wardId || undefined,
            }
          : undefined
      );
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
          Tạo tài khoản
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Đăng ký để bắt đầu sử dụng nền tảng EcoCollect
        </CardDescription>
      </CardHeader>

      <CardContent className="relative">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Họ tên</Label>
              <Input
                id="reg-name"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError("name"); }}
                disabled={loading}
                className={`border-white/45 bg-white/45 transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  errors.name ? "border-destructive focus-visible:ring-destructive/50" : ""
                }`}
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
                className={`border-white/45 bg-white/45 transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  errors.phone ? "border-destructive focus-visible:ring-destructive/50" : ""
                }`}
                autoComplete="tel"
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
              disabled={loading}
              className={`border-white/45 bg-white/45 transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                errors.email ? "border-destructive focus-visible:ring-destructive/50" : ""
              }`}
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

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
                className={`border-white/45 bg-white/45 pr-10 transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  errors.password ? "border-destructive focus-visible:ring-destructive/50" : ""
                }`}
                autoComplete="new-password"
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
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

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
                className={`border-white/45 bg-white/45 pr-10 transition-shadow placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  errors.confirmPassword ? "border-destructive focus-visible:ring-destructive/50" : ""
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPw((v) => !v)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showConfirmPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                const nextRole = v as UserRole;
                setRole(nextRole);
                if (nextRole !== "Citizen") {
                  setShowLocationFields(false);
                  setDistrictId("");
                  setWardId("");
                }
              }}
              disabled={loading}
            >
              <SelectTrigger className="border-white/45 bg-white/45 focus:ring-2 focus:ring-primary/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Citizen">Công dân</SelectItem>
                <SelectItem value="Enterprise">Doanh nghiệp tái chế</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isCitizen && (
            <div className="space-y-3 rounded-2xl border border-white/35 bg-white/20 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{"Hoàn thiện hồ sơ ngay"}</p>
                  <p className="text-xs text-muted-foreground">
                    {"Giúp hệ thống hiển thị bảng xếp hạng phù hợp với khu vực của bạn."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (showLocationFields) {
                      setDistrictId("");
                      setWardId("");
                    }
                    setShowLocationFields((prev) => !prev);
                  }}
                  disabled={loading}
                >
                  {showLocationFields ? "Bỏ qua lúc này" : "Thêm quận/phường"}
                </Button>
              </div>

              {showLocationFields && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{"Quận / Huyện"}</Label>
                    <Select
                      value={districtId}
                      onValueChange={(value) => {
                        setDistrictId(value);
                        setWardId("");
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className="border-white/45 bg-white/45 focus:ring-2 focus:ring-primary/40">
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>{"Phường / Xã"}</Label>
                    <Select
                      value={wardId}
                      onValueChange={setWardId}
                      disabled={loading || !districtId}
                    >
                      <SelectTrigger className="border-white/45 bg-white/45 focus:ring-2 focus:ring-primary/40">
                        <SelectValue placeholder={districtId ? "Chọn phường/xã" : "Chọn quận/huyện trước"} />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem key={ward.id} value={ward.id}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}


          <Button
            type="button"
            onClick={handleSubmit}
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
                <UserPlus className="mr-2 h-4 w-4" />
                Tạo tài khoản
              </>
            )}
          </Button>
        </div>

        <Separator className="my-5 bg-white/35" />

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
