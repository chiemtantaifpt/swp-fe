import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Star, User, Truck, Calendar, FileText, AlertTriangle,
  CheckCircle2, Clock, XCircle, Loader2, ExternalLink,
} from "lucide-react";
import { WasteReport } from "@/services/wasteReport";

interface Props {
  report: WasteReport | null;
  open: boolean;
  onClose: () => void;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}

const STATUS_STEPS = [
  { key: "PENDING",    label: "Chờ xử lý",     icon: Clock },
  { key: "PROCESSING", label: "Đã tiếp nhận",   icon: CheckCircle2 },
  { key: "ASSIGNED",   label: "Đã điều phối",   icon: Truck },
  { key: "COMPLETED",  label: "Hoàn thành",     icon: Star },
];

const STATUS_ORDER = ["PENDING", "PROCESSING", "ASSIGNED", "COMPLETED"];

function formatDate(raw: string | undefined): string {
  if (!raw) return "—";
  // Handle .NET ticks (long number) or ISO string
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ReportDetailModal({ report, open, onClose, onCancel, isCancelling }: Props) {
  if (!report) return null;

  const isTerminal = report.status === "REJECTED" || report.status === "CANCELLED";
  const currentStepIndex = STATUS_ORDER.indexOf(report.status);

  const mapsUrl = report.latitude && report.longitude
    ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Chi tiết báo cáo
          </DialogTitle>
        </DialogHeader>

        {/* Ảnh */}
        {report.imageUrl && (
          <div className="overflow-hidden rounded-lg border border-border">
            <img src={report.imageUrl} alt="Ảnh báo cáo" className="h-52 w-full object-cover" />
          </div>
        )}

        {/* Trạng thái terminal */}
        {isTerminal ? (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium
            ${report.status === "REJECTED" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
            <XCircle className="h-4 w-4 shrink-0" />
            {report.status === "REJECTED" ? "Báo cáo đã bị từ chối" : "Báo cáo đã bị hủy"}
          </div>
        ) : (
          /* Timeline tiến trình */
          <div className="rounded-lg bg-muted/40 p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tiến trình</p>
            <div className="flex items-start gap-0">
              {STATUS_STEPS.map((step, i) => {
                const done = currentStepIndex >= i;
                const active = currentStepIndex === i;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-1 flex-col items-center">
                    {/* Icon + line */}
                    <div className="flex w-full items-center">
                      {i > 0 && (
                        <div className={`h-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} />
                      )}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors
                        ${active ? "border-primary bg-primary text-primary-foreground"
                          : done ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground"}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 ${currentStepIndex > i ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                    <p className={`mt-1.5 text-center text-[10px] leading-tight
                      ${active ? "font-semibold text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Thông tin chi tiết */}
        <div className="space-y-3 text-sm">
          {/* Loại rác */}
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Loại rác</p>
              <p className="font-medium">{report.wasteTypeName || report.wasteTypeId || "—"}</p>
            </div>
          </div>

          {/* Mô tả */}
          {report.description && (
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Mô tả</p>
                <p>{report.description}</p>
              </div>
            </div>
          )}

          {/* Vị trí */}
          {(report.address || mapsUrl) && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Vị trí</p>
                {report.address && <p>{report.address}</p>}
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Xem trên Google Maps
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Collector */}
          {report.collectorName && (
            <div className="flex items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Người thu gom</p>
                <p className="font-medium">{report.collectorName}</p>
              </div>
            </div>
          )}

          {/* Điểm thưởng */}
          {report.points != null && report.points > 0 && (
            <div className="flex items-start gap-2">
              <Star className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Điểm thưởng</p>
                <p className="font-semibold text-primary">+{report.points} điểm</p>
              </div>
            </div>
          )}

          {/* Ngày tạo */}
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Ngày tạo</p>
              <p>{formatDate(report.createdAt)}</p>
            </div>
          </div>

          {/* ID báo cáo */}
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Mã báo cáo</p>
              <p className="font-mono text-xs text-muted-foreground">{report.id}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
          {report.status === "PENDING" && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isCancelling}
              onClick={() => onCancel(report.id)}
            >
              {isCancelling ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang hủy...</>
              ) : "Hủy báo cáo"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
