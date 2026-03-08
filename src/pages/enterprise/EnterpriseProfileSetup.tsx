import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { recyclingEnterpriseService, enterpriseDocumentsService } from "@/services/enterpriseConfig";
import {
  Building2, FileText, Upload, CheckCircle2, Info, Loader2, X, File as FileIcon,
} from "lucide-react";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

const STEPS = ["Thông tin doanh nghiệp", "Giấy phép & Xác nhận"] as const;

interface FormState {
  name: string;
  taxCode: string;
  address: string;
  legalRepresentative: string;
  representativePosition: string;
}

const EnterpriseProfileSetup = () => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<0 | 1>(0);
  const [submitting, setSubmitting] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    taxCode: "",
    address: "",
    legalRepresentative: "",
    representativePosition: "",
  });

  const setField = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validateStep0 = () => {
    const { name, taxCode, address, legalRepresentative, representativePosition } = form;
    if (!name.trim()) { toast.error("Vui lòng nhập tên doanh nghiệp"); return false; }
    if (!taxCode.trim()) { toast.error("Vui lòng nhập mã số thuế"); return false; }
    if (!address.trim()) { toast.error("Vui lòng nhập địa chỉ"); return false; }
    if (!legalRepresentative.trim()) { toast.error("Vui lòng nhập tên người đại diện pháp lý"); return false; }
    if (!representativePosition.trim()) { toast.error("Vui lòng nhập chức vụ người đại diện"); return false; }
    return true;
  };

  const handleNext = () => {
    if (!validateStep0()) return;
    setStep(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLicenseFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseFile) {
      toast.error("Vui lòng tải lên giấy phép môi trường");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create profile with placeholder UUID (documents API needs profile to exist first)
      await recyclingEnterpriseService.updateProfile({
        ...form,
        environmentLicenseFileId: NIL_UUID,
      });

      // Step 2: Upload environment license document (DocumentType = 0)
      let licenseFileId = NIL_UUID;
      try {
        const doc = await enterpriseDocumentsService.upload(0, licenseFile);
        licenseFileId = doc.id;
      } catch {
        toast.warning("Hồ sơ đã tạo nhưng tải giấy phép thất bại. Bạn có thể cập nhật sau.");
      }

      // Step 3: Update profile with real document ID
      if (licenseFileId !== NIL_UUID) {
        await recyclingEnterpriseService.updateProfile({
          ...form,
          environmentLicenseFileId: licenseFileId,
        });
      }

      toast.success("Đăng ký hồ sơ doanh nghiệp thành công! Đang chờ phê duyệt.");
      await qc.invalidateQueries({ queryKey: ["enterpriseProfile"] });
    } catch {
      toast.error("Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl py-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-eco-light">
            <Building2 className="h-7 w-7 text-eco-dark" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Hoàn thiện hồ sơ doanh nghiệp</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Để sử dụng đầy đủ tính năng, vui lòng cung cấp thông tin xác thực doanh nghiệp của bạn.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-0">
          {STEPS.map((label, idx) => (
            <div key={idx} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    idx < step
                      ? "bg-primary text-primary-foreground"
                      : idx === step
                      ? "border-2 border-primary bg-background text-primary"
                      : "border-2 border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {idx < step ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <span className={`text-xs ${idx === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`mb-5 mx-3 h-[2px] w-16 transition-colors ${idx < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ─── Step 0: Company Info ─── */}
        {step === 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Building2 className="h-5 w-5 text-primary" />
                Thông tin doanh nghiệp
              </CardTitle>
              <CardDescription>Nhập thông tin pháp lý của doanh nghiệp bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Tên DN + Mã số thuế */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    Tên doanh nghiệp <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="VD: Công ty TNHH EcoGreen"
                    value={form.name}
                    onChange={setField("name")}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxCode">
                    Mã số thuế <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="taxCode"
                    placeholder="VD: 0123456789"
                    value={form.taxCode}
                    onChange={setField("taxCode")}
                  />
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="space-y-1.5">
                <Label htmlFor="address">
                  Địa chỉ trụ sở <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="VD: 123 Nguyễn Văn Linh, Quận 7, TP.HCM"
                  value={form.address}
                  onChange={setField("address")}
                />
              </div>

              <Separator />

              {/* Người đại diện pháp lý */}
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Người đại diện pháp lý
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="legalRepresentative">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="legalRepresentative"
                    placeholder="VD: Nguyễn Văn A"
                    value={form.legalRepresentative}
                    onChange={setField("legalRepresentative")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="representativePosition">
                    Chức vụ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="representativePosition"
                    placeholder="VD: Giám đốc"
                    value={form.representativePosition}
                    onChange={setField("representativePosition")}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleNext} className="min-w-32">
                  Tiếp theo →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Step 1: License Upload + Review ─── */}
        {step === 1 && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Review card */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <FileText className="h-5 w-5 text-primary" />
                    Xác nhận thông tin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    { label: "Tên doanh nghiệp", value: form.name },
                    { label: "Mã số thuế", value: form.taxCode },
                    { label: "Địa chỉ", value: form.address },
                    { label: "Người đại diện", value: form.legalRepresentative },
                    { label: "Chức vụ", value: form.representativePosition },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between border-b border-border pb-2 last:border-0">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="max-w-[55%] text-right font-medium text-foreground">{row.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upload license */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <Upload className="h-5 w-5 text-primary" />
                    Giấy phép môi trường <span className="text-destructive">*</span>
                  </CardTitle>
                  <CardDescription>Tải lên giấy phép môi trường hoặc giấy chứng nhận đủ điều kiện hoạt động.</CardDescription>
                </CardHeader>
                <CardContent>
                  {licenseFile ? (
                    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <FileIcon className="h-8 w-8 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{licenseFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(licenseFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => { setLicenseFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Nhấn để chọn file</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">PDF, JPG, PNG tối đa 10MB</p>
                      </div>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </CardContent>
              </Card>

              {/* Notice */}
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Hồ sơ sẽ được admin xét duyệt. Trạng thái phê duyệt sẽ hiển thị sau khi bạn hoàn tất đăng ký.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  disabled={submitting}
                  className="flex-1"
                >
                  ← Quay lại
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Gửi hồ sơ
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Approval status note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">PendingApproval</Badge>
          <span>Hồ sơ chờ xét duyệt bởi quản trị viên</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseProfileSetup;
