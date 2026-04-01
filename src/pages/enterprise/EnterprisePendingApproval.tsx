import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RecyclingEnterprise } from "@/services/enterpriseConfig";
import {
  Clock,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Building2,
  FileText,
  User,
  MapPin,
  Hash,
  Briefcase,
} from "lucide-react";

interface Props {
  profile: RecyclingEnterprise;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; description: string }
> = {
  PendingApproval: {
    label: "Chờ phê duyệt",
    color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200",
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    description:
      "Hồ sơ của bạn đã được gửi và đang chờ quản trị viên xét duyệt. Quá trình này thường mất 1-3 ngày làm việc.",
  },
  Rejected: {
    label: "Bị từ chối",
    color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    description:
      "Hồ sơ của bạn đã bị từ chối. Vui lòng xem lý do bên dưới và liên hệ quản trị viên để được hỗ trợ.",
  },
  Approved: {
    label: "Đã phê duyệt",
    color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200",
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    description: "Hồ sơ đã được phê duyệt.",
  },
};

const EnterprisePendingApproval = ({ profile }: Props) => {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const statusKey = profile.approvalStatus in STATUS_CONFIG ? profile.approvalStatus : "PendingApproval";
  const cfg = STATUS_CONFIG[statusKey];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await qc.invalidateQueries({ queryKey: ["enterpriseProfile"] });
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl py-4">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-eco-light">
            <Building2 className="h-7 w-7 text-eco-dark" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Hồ sơ doanh nghiệp</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trạng thái xét duyệt hồ sơ đăng ký của bạn
          </p>
        </div>

        <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${cfg.color}`}>
          <div className="mt-0.5 shrink-0">{cfg.icon}</div>
          <div>
            <p className="font-semibold">{cfg.label}</p>
            <p className="mt-0.5 text-sm opacity-90">{cfg.description}</p>
          </div>
        </div>

        {profile.rejectionReason && (
          <Card className="mb-6 border-red-200 shadow-card dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
                <XCircle className="h-4 w-4" /> Lý do từ chối
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{profile.rejectionReason}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <FileText className="h-5 w-5 text-primary" /> Thông tin hồ sơ đã nộp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { icon: Building2, label: "Tên doanh nghiệp", value: profile.name },
              { icon: Hash, label: "Mã số thuế", value: profile.taxCode },
              { icon: MapPin, label: "Địa chỉ", value: profile.address },
              { icon: User, label: "Người đại diện pháp lý", value: profile.legalRepresentative },
              { icon: Briefcase, label: "Chức vụ", value: profile.representativePosition },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 border-b border-border pb-2.5 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{label}</span>
                </div>
                <span className="max-w-[55%] text-right font-medium text-foreground">{value}</span>
              </div>
            ))}

            <Separator className="my-1" />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Trạng thái phê duyệt</span>
              <Badge variant="outline" className="text-xs">
                {cfg.label}
              </Badge>
            </div>

            {profile.submittedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ngày nộp hồ sơ</span>
                <span className="text-xs text-foreground">
                  {new Date(profile.submittedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-w-44"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Đang kiểm tra..." : "Kiểm tra trạng thái"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Nhấn để tải lại trạng thái phê duyệt mới nhất từ hệ thống.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EnterprisePendingApproval;
