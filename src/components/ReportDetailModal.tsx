import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MapPin, Star, User, Truck, Calendar, FileText, AlertTriangle,
  CheckCircle2, Clock, XCircle, Loader2, ExternalLink, PackageCheck, Map, Camera,
  Plus, X, Search, ChevronDown, ChevronLeft,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { wasteTypeService } from "@/services/wasteType";
import { imageService } from "@/services/image";
import { RejectionReason, WasteItem, WasteReport, WasteReportStatus, wasteReportService } from "@/services/wasteReport";
import { useQuery } from "@tanstack/react-query";
import {
  formatWasteQuantityInput,
  getWasteQuantityListValidationError,
  hasInvalidWasteQuantity,
  parseWasteQuantityInput,
} from "@/lib/reportQuantity";

interface Props {
  report: WasteReport | null;
  open: boolean;
  onClose: () => void;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  onRedispatch: (id: string) => void;
  isRedispatching: boolean;
  onUpdateNoEnterprise: (id: string, data: Parameters<typeof wasteReportService.updateNoEnterpriseAvailable>[1]) => void;
  isUpdatingNoEnterprise: boolean;
}

const STATUS_STEPS = [
  { key: "PENDING",    label: "Chờ xử lý",   icon: Clock },
  { key: "PROCESSING", label: "Đã tiếp nhận",  icon: CheckCircle2 },
  { key: "ASSIGNED",   label: "Đã điều phối",  icon: Truck },
  { key: "COLLECTED",  label: "Đã thu gom",   icon: PackageCheck },
  { key: "COMPLETED",  label: "Hoàn thành",   icon: Star },
];

// Index trong 5-step timeline
const STEP_INDEX: Record<string, number> = {
  PENDING: 0,
  PROCESSING: 1,
  ASSIGNED: 2,
  COLLECTED: 3,
  COMPLETED: 4,
};

const PROOF_STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ duyệt proof", variant: "secondary" },
  APPROVED: { label: "Proof đã duyệt", variant: "default" },
  REJECTED: { label: "Proof bị từ chối", variant: "destructive" },
};

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

export default function ReportDetailModal({ report, open, onClose, onCancel, isCancelling, onRedispatch, isRedispatching, onUpdateNoEnterprise, isUpdatingNoEnterprise }: Props) {
  if (!report) return null;

  const normalizedStatus = report.status.toUpperCase() as WasteReportStatus;
  const isTerminal = normalizedStatus === "REJECTED" || normalizedStatus === "CANCELLED";

  const hardRejectionReasons: RejectionReason[] = ["WrongWasteType", "ImageNotClear"];
  const hasHardRejection = report.rejectionReasons?.some((r) => hardRejectionReasons.includes(r)) ?? false;
  const showRedispatchOption = normalizedStatus === "NOENTERPRISEAVAILABLE" && !hasHardRejection;
  const showEditOption = normalizedStatus === "NOENTERPRISEAVAILABLE" || normalizedStatus === "REJECTED";

  const [isEditOpen, setIsEditOpen] = useState(false);

  // --- state for edit form (reuse create-report UI) ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [wtDropdownOpen, setWtDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [wtSearch, setWtSearch] = useState("");
  const [selectedWastes, setSelectedWastes] = useState<Array<{ wasteTypeId: string; quantity: number; note: string }>>([]);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    description: report.description ?? "",
    address: report.address ?? "",
    latitude: report.latitude,
    longitude: report.longitude,
  });

  useEffect(() => {
    if (!open) return;
    setEditForm({
      description: report.description ?? "",
      address: report.address ?? "",
      latitude: report.latitude,
      longitude: report.longitude,
    });
    setSelectedWastes(
      report.wastes?.map((w) => ({
        wasteTypeId: w.wasteTypeId,
        quantity: w.quantity ?? 1,
        note: w.note ?? "",
      })) ?? []
    );
    setImagePreviewUrls(report.wastes?.[0]?.imageUrls ?? []);
    setImageFiles([]);
    setLocationName(null);
  }, [open, report]);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => (imageFiles.length === 0 ? prev : urls));
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const isEditDirty = useMemo(() => {
    // Check form fields
    if (editForm.description !== (report.description ?? "")) return true;
    if (editForm.latitude !== report.latitude) return true;
    if (editForm.longitude !== report.longitude) return true;
    if (editForm.address !== (report.address ?? "")) return true;

    // Check wastes - compare length first
    const originalWastes = report.wastes?.map((w) => ({
      wasteTypeId: w.wasteTypeId,
      quantity: w.quantity ?? 1,
      note: w.note ?? "",
    })) ?? [];

    if (selectedWastes.length !== originalWastes.length) return true;

    // Check each waste item
    for (let i = 0; i < selectedWastes.length; i++) {
      const current = selectedWastes[i];
      const original = originalWastes.find((w) => w.wasteTypeId === current.wasteTypeId);
      if (!original) return true;

      if (current.quantity !== original.quantity) return true;
      if ((current.note ?? "") !== original.note) return true;
    }

    // Check images - if new images were added
    if (imageFiles.length > 0) return true;

    return false;
  }, [editForm, selectedWastes, report, imageFiles]);

  // Determine why the button is disabled
  const getButtonDisabledReason = () => {
    if (isUpdatingNoEnterprise) return "Đang gửi báo cáo...";
    const quantityError = getWasteQuantityListValidationError(selectedWastes);
    if (quantityError) return quantityError;
    if (!isEditDirty) return "Chưa có thay đổi nào để lưu";
    return null;
  };

  const buttonDisabledReason = getButtonDisabledReason();
  const isButtonDisabled = !!buttonDisabledReason;

  // Waste types (used for edit form)
  const { data: allWasteTypes = [] } = useQuery({
    queryKey: ["wasteTypes"],
    queryFn: () => wasteTypeService.getAll(),
  });
  const wasteTypes = allWasteTypes.filter((w) => w.isActive !== false);
  const groupedWasteTypes = useMemo(() => {
    const groups: Record<number, typeof wasteTypes> = {} as any;
    wasteTypes.forEach((w) => {
      const cat = w.category ?? 0;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(w);
    });
    return groups;
  }, [wasteTypes]);

  const hasHazardous = useMemo(() => {
    return selectedWastes.some((waste) => {
      const wt = wasteTypes.find((w) => w.id === waste.wasteTypeId);
      return wt?.isHazardous;
    });
  }, [selectedWastes, wasteTypes]);

  const toggleWasteType = (id: string) => {
    setSelectedWastes((prev) => {
      const existing = prev.find((w) => w.wasteTypeId === id);
      if (existing) {
        // Remove
        return prev.filter((w) => w.wasteTypeId !== id);
      } else {
        // Add with default quantity 1 and empty note
        if (prev.length >= 5) {
          return prev;
        }
        return [...prev, { wasteTypeId: id, quantity: 1, note: "" }];
      }
    });
  };

  const needsProof = normalizedStatus === "ASSIGNED" || normalizedStatus === "COMPLETED" || normalizedStatus === "VERIFIED";
  const { data: proof, isLoading: proofLoading } = useQuery({
    queryKey: ["reportProof", report.id],
    queryFn: () => wasteReportService.getProof(report.id),
    enabled: open && needsProof,
    staleTime: 30_000,
  });

  // Xác định bước hiện tại trong 5-step timeline
  const currentStepKey = (() => {
    if (normalizedStatus === "COMPLETED") return "COMPLETED";
    if (normalizedStatus === "VERIFIED") return "COMPLETED";
    if (normalizedStatus === "ACCEPTED") return "PROCESSING";
    if (normalizedStatus === "ASSIGNED" && proof) return "COLLECTED";
    return normalizedStatus; // PENDING | PROCESSING | ASSIGNED
  })();
  const currentStepIndex = STEP_INDEX[currentStepKey] ?? 0;
  const proofBadge = proof
    ? PROOF_STATUS_BADGE[proof.reviewStatus?.toUpperCase?.() ?? ""] ?? {
        label: proof.reviewStatus,
        variant: "secondary" as const,
      }
    : null;

  const getGPS = () => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setEditForm((f) => ({ ...f, latitude: lat, longitude: lng }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
          const data = await res.json();
          const addr = data.address;
          const name = [addr.suburb || addr.quarter, addr.city_district || addr.county, addr.city || addr.town]
            .filter(Boolean)
            .join(", ");
          setLocationName(name || null);
        } catch {
          setLocationName(null);
        }
      },
      () => {},
    );
  };

  const handleEditSubmit = async () => {
    if (selectedWastes.length === 0) {
      return;
    }
    if (hasInvalidWasteQuantity(selectedWastes)) {
      return;
    }
    if (imagePreviewUrls.length === 0) {
      return;
    }
    if (!editForm.latitude) {
      return;
    }

    let imageUrls: string[] = imagePreviewUrls;
    if (imageFiles.length > 0) {
      try {
        if (imageFiles.length === 1) {
          const result = await imageService.uploadOne(imageFiles[0]);
          imageUrls = [result.url];
        } else {
          const result = await imageService.uploadMultiple(imageFiles);
          if (result.failureCount > 0) {
            return;
          }
          imageUrls = result.uploaded.map((u) => u.url);
        }
      } catch {
        return;
      }
    }

    const wastes = selectedWastes.map((waste, i) => ({
      wasteTypeId: waste.wasteTypeId,
      quantity: waste.quantity,
      note: waste.note || undefined,
      images: i === 0 ? imageUrls : undefined,
    }));

    onUpdateNoEnterprise(report.id, {
      description: editForm.description || undefined,
      address: editForm.address.trim() || undefined,
      latitude: editForm.latitude,
      longitude: editForm.longitude,
      wastes,
    });
    setIsEditOpen(false);
  };

  const mapsUrl = report.latitude && report.longitude
    ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Chi tiết báo cáo
          </DialogTitle>
        </DialogHeader>

        {/* Ảnh */}
        {report.wastes?.some(w => w.imageUrls?.length) && (
          <div className="space-y-2">
            {report.wastes.map((waste, wasteIndex) =>
              waste.imageUrls?.map((url, imgIndex) => (
                <div key={`${wasteIndex}-${imgIndex}`} className="overflow-hidden rounded-lg border border-border">
                  <img src={url} alt={`Ảnh loại rác ${waste.wasteTypeName || waste.wasteTypeId}`} className="h-52 w-full object-cover" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Trạng thái terminal */}
        {isTerminal ? (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium
            ${normalizedStatus === "REJECTED" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
            <XCircle className="h-4 w-4 shrink-0" />
            {normalizedStatus === "REJECTED" ? "Báo cáo đã bị từ chối" : "Báo cáo đã bị hủy"}
          </div>
        ) : (
          /* Timeline tiến trình */
          <div className="rounded-lg bg-muted/40 p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tiến trình</p>
            {proofLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-1 flex-1" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-1 flex-1" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ) : (
              <div className="flex items-start gap-0">
                {STATUS_STEPS.map((step, i) => {
                  const done = currentStepIndex >= i;
                  const active = currentStepIndex === i;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-1 flex-col items-center">
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
            )}
          </div>
        )}

        <Separator />

        {/* Thông tin chi tiết */}
        <div className="space-y-3 text-sm">
          {/* Người tạo */}
          {report.citizenName && (
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Người tạo</p>
                <p>{report.citizenName}</p>
              </div>
            </div>
          )}

          {/* Loại rác */}
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Loại rác</p>
              {report.wastes?.length ? (
                <ul className="space-y-1">
                  {report.wastes.map((waste, index) => (
                    <li key={index} className="font-medium">
                      {waste.wasteTypeName || waste.wasteTypeId || "—"}
                      {waste.quantity && <span className="text-sm text-muted-foreground"> ({waste.quantity} kg)</span>}
                      {waste.note && <span className="text-sm text-muted-foreground"> - {waste.note}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-medium">—</p>
              )}
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

          {(proofLoading || proof) && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Xác nhận thu gom</p>
                    <p className="font-medium text-foreground">
                      {proofLoading
                        ? "Đang tải ảnh xác nhận từ collector..."
                        : "Collector đã gửi ảnh xác nhận thu gom."}
                    </p>
                  </div>
                </div>
                {proofBadge && <Badge variant={proofBadge.variant}>{proofBadge.label}</Badge>}
              </div>

              {proofLoading ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Skeleton className="h-28 w-full rounded-lg" />
                  <Skeleton className="h-28 w-full rounded-lg" />
                </div>
              ) : proof ? (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="rounded-md border border-border bg-background px-3 py-2">
                      <p className="font-medium text-foreground">Thời gian xác nhận</p>
                      <p className="mt-1">{formatDate(proof.createdTime)}</p>
                    </div>
                    <div className="rounded-md border border-border bg-background px-3 py-2">
                      <p className="font-medium text-foreground">Số ảnh đã gửi</p>
                      <p className="mt-1">{proof.images?.length ?? 0} ảnh</p>
                    </div>
                  </div>

                  {proof.notes && (
                    <div className="rounded-md border border-border bg-background px-3 py-2">
                      <p className="text-xs font-medium text-foreground">Ghi chú của collector</p>
                      <p className="mt-1 text-sm text-foreground">{proof.notes}</p>
                    </div>
                  )}

                  {proof.images?.length ? (
                    <div className="grid grid-cols-2 gap-3">
                      {proof.images.map((url, index) => (
                        <a
                          key={`${proof.proofId}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90"
                        >
                          <img
                            src={url}
                            alt={`Ảnh xác nhận thu gom ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Collector chưa gửi ảnh xác nhận.</p>
                  )}
                </div>
              ) : null}
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
              <p>{formatDate(report.createdTime)}</p>
            </div>
          </div>

          {/* Lý do từ chối */}
          {report.rejectionReasons && report.rejectionReasons.length > 0 && (
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Lý do từ chối</p>
                <ul className="space-y-1">
                  {report.rejectionReasons.map((reason, index) => (
                    <li key={index} className="text-sm font-medium text-destructive">
                      {reason === "WrongWasteType" ? "Loại rác không đúng" : 
                       reason === "ImageNotClear" ? "Ảnh không rõ ràng" : reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>

          {normalizedStatus === "PENDING" && (
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

          {normalizedStatus === "NOENTERPRISEAVAILABLE" && (
            <>
              {hasHardRejection && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Báo cáo bị từ chối do ảnh hoặc loại rác không đúng. Vui lòng chỉnh sửa trước khi gửi lại.
                  </span>
                </div>
              )}

              {showRedispatchOption && (
                <Button
                  variant="default"
                  size="sm"
                  disabled={isRedispatching}
                  onClick={() => onRedispatch(report.id)}
                >
                  {isRedispatching ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang gửi lại...</>
                  ) : "Gửi lại báo cáo"}
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                disabled={isUpdatingNoEnterprise}
                onClick={() => setIsEditOpen(true)}
              >
                {isUpdatingNoEnterprise ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang gửi lại...</>
                ) : "Chỉnh sửa & gửi lại"}
              </Button>
            </>
          )}

          {normalizedStatus === "REJECTED" && (
            <>
              {hasHardRejection && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Báo cáo bị từ chối do ảnh hoặc loại rác không đúng. Vui lòng chỉnh sửa trước khi gửi lại.
                  </span>
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                disabled={isUpdatingNoEnterprise}
                onClick={() => setIsEditOpen(true)}
              >
                {isUpdatingNoEnterprise ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang gửi lại...</>
                ) : "Chỉnh sửa & gửi lại"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Dialog sửa báo cáo (edit) */}
    <Dialog open={isEditOpen} onOpenChange={(open) => setIsEditOpen(open)}>
      <DialogContent className="w-[calc(100vw-1rem)] max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa báo cáo</DialogTitle>
        </DialogHeader>

        <form className="space-y-4 pb-2" onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }}>
          {/* ── Loại rác multi-select ── */}
          <div>
            <Label>Loại rác *</Label>
            <div className="relative mt-1">
              <div
                className="min-h-10 cursor-pointer rounded-md border border-input bg-background px-3 py-2 pr-16 text-sm ring-offset-background transition-colors hover:border-primary focus-within:ring-2 focus-within:ring-ring"
                onClick={() => setWtDropdownOpen((v) => !v)}
              >
                {selectedWastes.length === 0 ? (
                  <span className="text-muted-foreground">Chọn tối đa 5 loại rác</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWastes.map((waste) => {
                      const wt = wasteTypes.find((w) => w.id === waste.wasteTypeId);
                      return (
                        <span key={waste.wasteTypeId} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {wt?.name ?? waste.wasteTypeId}
                          <button type="button" onClick={(e) => { e.stopPropagation(); toggleWasteType(waste.wasteTypeId); }}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
                  {selectedWastes.length > 0 && (
                    <span className="text-[11px] font-medium text-muted-foreground">{selectedWastes.length}/5</span>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {wtDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setWtDropdownOpen(false); setWtSearch(""); setSelectedCategory(null); }} />
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                    {selectedCategory === null ? (
                      <div className="p-2">
                        <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Chọn danh mục
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {[
                            { value: 0, label: "Hữu cơ" },
                            { value: 1, label: "Tái chế" },
                            { value: 2, label: "Nguy hại" },
                            { value: 3, label: "Khác" },
                          ].map((cat) => {
                            const count = (groupedWasteTypes[cat.value] ?? []).length;
                            return (
                              <button
                                key={cat.value}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat.value); setWtSearch(""); }}
                                className="flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-colors border-border hover:bg-muted"
                              >
                                <span className="text-xs font-semibold">{cat.label}</span>
                                <span className="text-[10px] text-muted-foreground">{count} loại</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); setSelectedCategory(null); setWtSearch(""); }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Quay lại danh mục</span>
                        </button>
                        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                          <Search className="h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            autoFocus
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Tìm loại rác..."
                            value={wtSearch}
                            onChange={(e) => setWtSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-52 overflow-y-auto py-1">
                          {filteredWasteTypes.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-muted-foreground">Không tìm thấy loại rác</p>
                          ) : (
                            filteredWasteTypes.map((wt) => {
                              const selected = selectedWastes.some((w) => w.wasteTypeId === wt.id);
                              return (
                                <div
                                  key={wt.id}
                                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${
                                    selected ? "bg-primary/5 font-medium text-primary" : ""
                                  }`}
                                  onClick={(e) => { e.stopPropagation(); toggleWasteType(wt.id); }}
                                >
                                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                    selected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                                  }`}>
                                    {selected && <span className="text-[10px] leading-none">✓</span>}
                                  </span>
                                  <span className="truncate">{wt.name}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">Bạn có thể chọn tối đa 5 loại rác trong một báo cáo.</p>
            {hasHazardous && (
              <div className="mt-1.5 flex items-start gap-2 rounded-md border-l-4 border-orange-400 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                <span>Loại rác nguy hại cần chú ý khi đóng gói và vận chuyển.</span>
              </div>
            )}
          </div>

          {/* ── Chi tiết loại rác ── */}
          {selectedWastes.length > 0 && (
            <div>
              <Label>Chi tiết loại rác</Label>
              <div className="mt-1 space-y-3">
                {selectedWastes.map((waste, index) => {
                  const wt = wasteTypes.find((w) => w.id === waste.wasteTypeId);
                  return (
                    <div key={waste.wasteTypeId} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{wt?.name ?? waste.wasteTypeId}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div>
                            <Label className="text-xs">Số lượng (kg) *</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              min="0.01"
                              step="0.01"
                              className="mt-1 h-8 text-sm"
                              placeholder="Ví dụ: 10"
                              value={formatWasteQuantityInput(waste.quantity)}
                              onChange={(e) => {
                                const qty = parseWasteQuantityInput(e.target.value);
                                setSelectedWastes((prev) =>
                                  prev.map((w, i) => (i === index ? { ...w, quantity: qty } : w))
                                );
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Ghi chú</Label>
                            <Input
                              className="mt-1 h-8 text-sm"
                              placeholder="Ví dụ: 2 túi nhỏ"
                              value={waste.note}
                              onChange={(e) => {
                                setSelectedWastes((prev) =>
                                  prev.map((w, i) => (i === index ? { ...w, note: e.target.value } : w))
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted"
                        onClick={() => toggleWasteType(waste.wasteTypeId)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Mô tả ── */}
          <div>
            <Label>Mô tả</Label>
            <Textarea
              className="mt-1"
              placeholder="Mô tả ngắn về rác cần thu gom..."
              value={editForm.description || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">Mô tả giúp đơn vị thu gom xử lý nhanh hơn.</p>
          </div>

          {/* ── Hình ảnh ── */}
          <div>
            <Label>Hình ảnh *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setImageFiles((prev) => [...prev, ...files]);
                e.target.value = "";
              }}
            />
            <div
              className="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted p-3 transition-colors hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreviewUrls.length === 0 ? (
                <div className="text-center">
                  <Camera className="mx-auto h-6 w-6 text-muted-foreground" />
                  <span className="mt-1 block text-xs text-muted-foreground">Chụp / tải ảnh lên</span>
                </div>
              ) : (
                <div className="flex w-full flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {imagePreviewUrls.map((url, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                      <img src={url} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                        onClick={() => {
                          setImageFiles((prev) => prev.filter((_, j) => j !== i));
                          setImagePreviewUrls((prev) => prev.filter((_, j) => j !== i));
                        }}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                  <div
                    className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-background hover:border-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Chụp rõ toàn bộ đống rác để xác nhận nhanh hơn.</p>
          </div>

          {/* ── Vị trí GPS ── */}
          <div>
            <Label>Vị trí GPS *</Label>
            <div className="mt-1 flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1 gap-2" onClick={getGPS}>
                <MapPin className="h-4 w-4" />
                {editForm.latitude ? `${editForm.latitude.toFixed(5)}, ${editForm.longitude?.toFixed(5)}` : "GPS tự động"}
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => {}}>
                <Map className="h-4 w-4" />
                Chọn trên bản đồ
              </Button>
            </div>
            {editForm.latitude && locationName && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                Đã xác định vị trí: <span className="font-medium text-foreground">{locationName}</span>
              </p>
            )}
          </div>

          {/* ── Địa chỉ chi tiết ── */}
          <div>
            <Label>Địa chỉ chi tiết</Label>
            <Input
              className="mt-1"
              placeholder="Số nhà, đường, phường..."
              value={editForm.address}
              onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          {/* Validation hints */}
          <div className="space-y-0.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {selectedWastes.length === 0 && <li>• Chọn ít nhất 1 loại rác</li>}
            {hasInvalidWasteQuantity(selectedWastes) && <li>• Nhập khối lượng hợp lệ cho tất cả loại rác (&gt; 0 kg, tối đa 2 số lẻ)</li>}
            {imagePreviewUrls.length === 0 && <li>• Thêm ít nhất 1 ảnh</li>}
            {!editForm.latitude && <li>• Xác định vị trí GPS</li>}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Hủy
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isButtonDisabled}
                      type="submit"
                      className={`border-2 border-secondary/20 hover:border-secondary/40 transition-colors ${
                        isButtonDisabled ? "opacity-50 cursor-not-allowed" : "shadow-sm hover:shadow-md"
                      }`}
                    >
                      {isUpdatingNoEnterprise ? (
                        <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang gửi lại...</>
                      ) : isEditDirty ? (
                        "Lưu & gửi lại"
                      ) : (
                        "Chưa có thay đổi"
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {buttonDisabledReason && (
                  <TooltipContent>
                    <p>{buttonDisabledReason}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </>
  );
}

