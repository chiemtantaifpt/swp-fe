import { useState, useRef, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CitizenDashboardCharts } from "@/components/dashboard/RoleDashboardCharts";
import ReportDetailModal from "@/components/ReportDetailModal";
import MapPicker from "@/components/MapPicker";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SimplePagination from "@/components/SimplePagination";
import { Plus, MapPin, Clock, Award, Trophy, Star, Camera, TrendingUp, Loader2, ChevronRight, X, Map, Search, AlertTriangle, ChevronDown, ChevronLeft, Leaf, Recycle, Flame, Package, Gift, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wasteReportService, WasteReport, CreateWasteReportRequest } from "@/services/wasteReport";
import { wasteTypeService } from "@/services/wasteType";
import { imageService } from "@/services/image";
import { complaintService, Complaint } from "@/services/complaint";
import { disputeResolutionService } from "@/services/disputeResolution";
import { useCitizenPoint, useCitizenPointHistory, useCitizenPointLeaderboard, useCitizenPointMyRank } from "@/hooks/useCitizenPoint";
import { useActiveRewards, useMyRewardRedemptions, useRedeemReward } from "@/hooks/reward.hooks";
import {
  formatWasteQuantityInput,
  getWasteQuantityListValidationError,
  hasInvalidWasteQuantity,
  parseWasteQuantityInput,
} from "@/lib/reportQuantity";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ xử lý", variant: "secondary" },
  ACCEPTED: { label: "Đã tiếp nhận", variant: "outline" },
  PROCESSING: { label: "Đã tiếp nhận", variant: "outline" },
  ONTHEWAY: { label: "Đang đến lấy", variant: "outline" },
  COLLECTED: { label: "Đã thu gom", variant: "default" },
  VERIFIED: { label: "Hoàn thành", variant: "default" },
  ASSIGNED: { label: "Đã điều phối", variant: "default" },
  COMPLETED: { label: "Hoàn thành", variant: "default" },
  REJECTED: { label: "Từ chối", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
  NOENTERPRISEAVAILABLE: { label: "Không có đơn vị nhận", variant: "secondary" },
};

const complaintStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Open: { label: "Mở", variant: "secondary" },
  InReview: { label: "Đang xem xét", variant: "outline" },
  EnterpriseResponded: { label: "Doanh nghiệp đã phản hồi", variant: "outline" },
  Resolved: { label: "Đã giải quyết", variant: "default" },
  Rejected: { label: "Từ chối", variant: "destructive" },
};

const complaintTypeMap: Record<string, string> = {
  Feedback: "Phản hồi",
  Complaint: "Khiếu nại",
};

const suggestedCategoryMap: Record<string, { category: number; label: string }> = {
  Organic: { category: 0, label: "Hữu cơ" },
  Recyclable: { category: 1, label: "Tái chế" },
  Hazardous: { category: 2, label: "Nguy hại" },
  Other: { category: 3, label: "Khác" },
};

const suggestedCategoryMapByNumber: Record<number, { category: number; label: string }> = {
  0: { category: 0, label: "Hữu cơ" },
  1: { category: 1, label: "Tái chế" },
  2: { category: 2, label: "Nguy hại" },
  3: { category: 3, label: "Khác" },
};

const reportStatusFilterOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "accepted", label: "Đã tiếp nhận" },
  { value: "assigned", label: "Đã điều phối" },
  { value: "collected", label: "Đã thu gom" },
  { value: "completed", label: "Hoàn thành" },
] as const;

type ReportStatusFilterValue = (typeof reportStatusFilterOptions)[number]["value"];

const CitizenComplaintCard = ({
  complaint,
  reportSummary,
  onView,
}: {
  complaint: Complaint;
  reportSummary: string;
  onView: (complaint: Complaint) => void;
}) => {
  const badge = complaintStatusMap[complaint.status] || { label: complaint.status, variant: "secondary" as const };
  const complaintTypeLabel = complaintTypeMap[complaint.type] || complaint.type;
  const complaintSummary =
    complaint.status === "Resolved"
      ? "Đã có kết quả xử lý"
      : complaint.status === "EnterpriseResponded"
        ? "Doanh nghiệp đã phản hồi và đang chờ quản trị viên xem xét"
        : "Đang chờ phản hồi";

  return (
    <Card className="shadow-card">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{complaintTypeLabel}</Badge>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-foreground">{complaint.content}</p>
          <p className="text-xs text-muted-foreground">
            {reportSummary} • {new Date(complaint.createdTime).toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted-foreground">{complaintSummary}</span>
          <Button size="sm" variant="outline" onClick={() => onView(complaint)}>
            Xem chi tiết
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const CitizenDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipImageCleanupOnCloseRef = useRef(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; publicId: string }>>([]);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatusFilterValue>("all");
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imageSuggestion, setImageSuggestion] = useState<{
    categoryLabel?: string;
    wasteTypeId?: string | null;
    wasteTypeName?: string | null;
  } | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [complaintReport, setComplaintReport] = useState<WasteReport | null>(null);
  const [complaintType, setComplaintType] = useState("Feedback");
  const [complaintContent, setComplaintContent] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaintPageNumber, setComplaintPageNumber] = useState(1);
  const [rewardRedemptionPageNumber, setRewardRedemptionPageNumber] = useState(1);
  const [pointHistoryPageNumber, setPointHistoryPageNumber] = useState(1);
  const [selectedComplaintResolutionPageNumber, setSelectedComplaintResolutionPageNumber] = useState(1);

  // Táº¡o blob preview URLs 1 láº§n khi imageFiles thay Ä‘á»•i, cleanup Ä‘á»ƒ trÃ¡nh memory leak
  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  useEffect(() => {
    setSelectedComplaintResolutionPageNumber(1);
  }, [selectedComplaint?.id]);

  // Multi-select waste type state
  const [selectedWastes, setSelectedWastes] = useState<Array<{ wasteTypeId: string; quantity: number; note: string }>>([]);
  const [wtSearch, setWtSearch] = useState("");
  const [wtDropdownOpen, setWtDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    description: "",
    address: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const cleanupUploadedImages = async (images: Array<{ url: string; publicId: string }>) => {
    await Promise.allSettled(
      images
        .filter((image) => image.publicId)
        .map((image) => imageService.deleteOne(image.publicId))
    );
  };

  const resetForm = () => {
    setForm({ description: "", address: "", latitude: undefined, longitude: undefined });
    setImageFiles([]);
    setUploadedImages([]);
    setSelectedWastes([]);
    setWtSearch("");
    setSelectedCategory(null);
    setLocationName(null);
    setImageSuggestion(null);
  };

  // Fetch danh sÃ¡ch loáº¡i rÃ¡c cho dropdown (chá»‰ active)
  const { data: allWasteTypes = [] } = useQuery({
    queryKey: ["wasteTypes"],
    queryFn: () => wasteTypeService.getAll(),
  });
  const wasteTypes = allWasteTypes.filter((w) => w.isActive !== false);

  const applyImageSuggestion = (suggestedCategory?: string | null, suggestedWasteTypeId?: string | null) => {
    const suggestedWasteType = suggestedWasteTypeId
      ? wasteTypes.find((item) => item.id === suggestedWasteTypeId)
      : undefined;
    const resolvedSuggestion =
      (suggestedCategory && suggestedCategoryMap[suggestedCategory]) ||
      (suggestedWasteType?.category != null ? suggestedCategoryMapByNumber[suggestedWasteType.category] : undefined);

    if (resolvedSuggestion) {
      setSelectedCategory(resolvedSuggestion.category);
    }

    setImageSuggestion(
      resolvedSuggestion || suggestedWasteTypeId
        ? {
            categoryLabel: resolvedSuggestion?.label,
            wasteTypeId: suggestedWasteTypeId ?? null,
            wasteTypeName: suggestedWasteType?.name ?? null,
          }
        : null
    );

    if (suggestedWasteTypeId) {
      setSelectedWastes((prev) => {
        if (prev.some((item) => item.wasteTypeId === suggestedWasteTypeId)) return prev;
        if (prev.length >= 5) return prev;
        return [...prev, { wasteTypeId: suggestedWasteTypeId, quantity: 1, note: "" }];
      });

      toast.success(
        suggestedWasteType
          ? `Hệ thống gợi ý loại rác: ${suggestedWasteType.name}`
          : "Hệ thống đã gợi ý sẵn một loại rác phù hợp"
      );
      return;
    }

    if (suggestedCategory && suggestedCategoryMap[suggestedCategory]) {
      toast.success(`Hệ thống gợi ý nhóm rác: ${suggestedCategoryMap[suggestedCategory].label}`);
    }
  };

  const handleSelectImages = async (files: File[]) => {
    if (files.length === 0) return;
    if (imageFiles.length + files.length > 5) {
      toast.error("Chỉ được tải lên tối đa 5 ảnh");
      return;
    }

    setIsUploadingImages(true);
    try {
      if (files.length === 1) {
        const result = await imageService.uploadOne(files[0]);
        setImageFiles((prev) => [...prev, files[0]]);
        setUploadedImages((prev) => [...prev, { url: result.url, publicId: result.publicId }]);
        applyImageSuggestion(result.suggestedCategory, result.suggestedWasteTypeId);
      } else {
        const result = await imageService.uploadMultiple(files);
        const fileBuckets = new Map<string, File[]>();

        files.forEach((file) => {
          const bucket = fileBuckets.get(file.name) ?? [];
          bucket.push(file);
          fileBuckets.set(file.name, bucket);
        });

        const successfulResults = result.results.filter((item) => item.url && item.publicId);
        const failedResults = result.results.filter((item) => item.error);
        const successfulFiles = successfulResults
          .map((item) => {
            const bucket = fileBuckets.get(item.fileName);
            return bucket?.shift() ?? null;
          })
          .filter((file): file is File => !!file);

        if (successfulFiles.length > 0) {
          setImageFiles((prev) => [...prev, ...successfulFiles]);
          setUploadedImages((prev) => [
            ...prev,
            ...successfulResults.map((item) => ({
              url: item.url!,
              publicId: item.publicId!,
            })),
          ]);

          const suggestedResult =
            successfulResults.find((item) => item.suggestedWasteTypeId) ??
            successfulResults.find((item) => item.suggestedCategory);

          if (suggestedResult) {
            applyImageSuggestion(suggestedResult.suggestedCategory, suggestedResult.suggestedWasteTypeId);
          }
        }

        if (result.failureCount > 0) {
          const errorText =
            failedResults.map((entry) => entry.fileName + ": " + entry.error).join(" | ") ||
            ("Upload ảnh thất bại " + result.failureCount + "/" + files.length + " file");

          if (result.successCount > 0) {
            toast.warning("Đã tải lên " + result.successCount + " ảnh, nhưng có lỗi: " + errorText);
          } else {
            toast.error(errorText);
          }
          return;
        }

        toast.success("Đã tải lên " + result.successCount + " ảnh thành công");
      }
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Upload ảnh thất bại, vui lòng thử lại";
      toast.error(message);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const removedImage = uploadedImages[index];
    setImageFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    setUploadedImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    if (imageFiles.length <= 1) {
      setImageSuggestion(null);
    }
    if (removedImage?.publicId) {
      void imageService.deleteOne(removedImage.publicId).catch(() => {
        toast.error("Không thể xóa ảnh đã tải lên");
      });
    }
  };

  const closeCreateDialog = () => {
    setConfirmCreateOpen(false);
    if (skipImageCleanupOnCloseRef.current) {
      skipImageCleanupOnCloseRef.current = false;
      skipImageCleanupOnCloseRef.current = true;
      setOpen(false);
      resetForm();
      return;
    }
    setOpen(false);
    void cleanupUploadedImages(uploadedImages);
    resetForm();
  };

  // Fetch danh sÃ¡ch bÃ¡o cÃ¡o cá»§a citizen hiá»‡n táº¡i
  const { data: rawReports = [], isLoading: loadingReports } = useQuery({
    queryKey: ["wasteReports", user?.id],
    queryFn: () => wasteReportService.getAll({ CitizenId: user?.id }),
    enabled: !!user?.id,
    staleTime: 0,
  });

  // Filter client-side phÃ²ng trÆ°á»ng há»£p BE khÃ´ng filter Ä‘Ãºng CitizenId
  const reports = rawReports.filter(
    (r) => !r.citizenId || r.citizenId === user?.id
  );

  const filteredReports = reports.filter((report) => {
    if (reportStatusFilter === "all") return true;

    const normalizedStatus = (report.status || "").toUpperCase();

    switch (reportStatusFilter) {
      case "pending":
        return normalizedStatus === "PENDING";
      case "accepted":
        return ["ACCEPTED", "PROCESSING", "ONTHEWAY"].includes(normalizedStatus);
      case "assigned":
        return normalizedStatus === "ASSIGNED";
      case "collected":
        return normalizedStatus === "COLLECTED";
      case "completed":
        return ["VERIFIED", "COMPLETED"].includes(normalizedStatus);
      default:
        return true;
    }
  });

  const { data: complaintData, isLoading: loadingComplaints } = useQuery({
    queryKey: ["complaints", "my", user?.id, complaintPageNumber],
    queryFn: () => complaintService.getMy({ ComplainantId: user?.id, PageNumber: complaintPageNumber, PageSize: 10 }),
    enabled: !!user?.id,
  });
  const complaints = complaintData?.items ?? [];

  const {
    data: rewards = [],
    isLoading: rewardsLoading,
    isError: rewardsError,
  } = useActiveRewards();

  const {
    data: rewardRedemptionsData,
    isLoading: rewardRedemptionsLoading,
    isError: rewardRedemptionsError,
  } = useMyRewardRedemptions(rewardRedemptionPageNumber, 5);
  const rewardRedemptions = rewardRedemptionsData?.items ?? [];

  const {
    data: citizenPointHistoryData,
    isLoading: citizenPointHistoryLoading,
    isError: citizenPointHistoryError,
  } = useCitizenPointHistory(user?.id, {
    pageNumber: pointHistoryPageNumber,
    pageSize: 5,
  });
  const citizenPointHistory = citizenPointHistoryData?.items ?? [];

  const {
    data: selectedComplaintResolutionsData,
    isLoading: selectedComplaintResolutionsLoading,
    isError: selectedComplaintResolutionsError,
  } = useQuery({
    queryKey: ["complaintResolutions", selectedComplaint?.id, selectedComplaintResolutionPageNumber],
    queryFn: () =>
      disputeResolutionService.getAll({
        complaintId: selectedComplaint!.id,
        pageNumber: selectedComplaintResolutionPageNumber,
        pageSize: 5,
      }),
    enabled: !!selectedComplaint,
  });
  const selectedComplaintResolutions = selectedComplaintResolutionsData?.items ?? [];

  const resetComplaintForm = () => {
    setComplaintType("Feedback");
    setComplaintContent("");
    setComplaintReport(null);
  };

  const openComplaintDialog = (report: WasteReport) => {
    setComplaintReport(report);
    setComplaintType("Feedback");
    setComplaintContent("");
    setComplaintDialogOpen(true);
  };

  const closeComplaintDialog = () => {
    setComplaintDialogOpen(false);
    resetComplaintForm();
  };

  // Mutation táº¡o bÃ¡o cÃ¡o má»›i
  const createMutation = useMutation({
    mutationFn: wasteReportService.create,
    onSuccess: () => {
      toast.success("Báo cáo đã được gửi thành công!");
      setConfirmCreateOpen(false);
      setOpen(false);
      resetForm();
      // Refresh danh sÃ¡ch bÃ¡o cÃ¡o
      queryClient.invalidateQueries({ queryKey: ["wasteReports"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gửi báo cáo thất bại. Vui lòng thử lại!");
    },
  });

  // Mutation há»§y bÃ¡o cÃ¡o
  const deleteMutation = useMutation({
    mutationFn: wasteReportService.delete,
    onSuccess: () => {
      toast.success("Báo cáo đã được hủy!");
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ["wasteReports"] });
    },
    onError: () => toast.error("Hủy báo cáo thất bại. Vui lòng thử lại!"),
  });

  // Mutation redispatch bÃ¡o cÃ¡o
  const redispatchMutation = useMutation({
    mutationFn: wasteReportService.redispatch,
    onSuccess: () => {
      toast.success("Báo cáo đã được gửi lại!");
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ["wasteReports"] });
    },
    onError: () => toast.error("Gửi lại báo cáo thất bại. Vui lòng thử lại!"),
  });

  // Mutation update bÃ¡o cÃ¡o khi NoEnterpriseAvailable
  const updateNoEnterpriseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof wasteReportService.updateNoEnterpriseAvailable>[1] }) =>
      wasteReportService.updateNoEnterpriseAvailable(id, data),
    onSuccess: () => {
      toast.success("Báo cáo đã được cập nhật và gửi lại!");
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ["wasteReports"] });
    },
    onError: () => toast.error("Cập nhật báo cáo thất bại. Vui lòng thử lại!"),
  });

  const createComplaintMutation = useMutation({
    mutationFn: () =>
      complaintService.create({
        reportId: complaintReport!.id,
        collectionRequestId: complaintReport?.collectionRequestId ?? null,
        type: complaintType.trim(),
        content: complaintContent.trim(),
      }),
    onSuccess: () => {
      toast.success("Đã gửi khiếu nại thành công");
      queryClient.invalidateQueries({ queryKey: ["complaints", "my"] });
      closeComplaintDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gửi khiếu nại thất bại");
    },
  });

  const redeemRewardMutation = useRedeemReward();

  const getGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
        toast.success("Đã lấy tọa độ GPS thành công!");
        // Reverse geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
          const data = await res.json();
          const addr = data.address;
          const name = [addr.suburb || addr.quarter, addr.city_district || addr.county, addr.city || addr.town].filter(Boolean).join(", ");
          setLocationName(name || null);
        } catch { setLocationName(null); }
      },
      () => toast.error("Không thể lấy tọa độ GPS. Vui lòng nhập địa chỉ thủ công.")
    );
  };

  // Category cards for step-1 dropdown
  const CATEGORY_CARDS = [
    { value: 0, label: "Hữu cơ", Icon: Leaf, iconColor: "text-green-600", borderColor: "border-green-200", bgHover: "hover:bg-green-50" },
    { value: 1, label: "Tái chế", Icon: Recycle, iconColor: "text-blue-600", borderColor: "border-blue-200", bgHover: "hover:bg-blue-50" },
    { value: 2, label: "Nguy hại", Icon: Flame, iconColor: "text-orange-600", borderColor: "border-orange-200", bgHover: "hover:bg-orange-50" },
    { value: 3, label: "Khác", Icon: Package, iconColor: "text-gray-500", borderColor: "border-gray-200", bgHover: "hover:bg-gray-50" },
  ];

  // Grouped counts for step-1 cards (all active waste types, no search)
  const groupedWasteTypes = useMemo(() => {
    const groups: Record<number, typeof wasteTypes> = {};
    wasteTypes.forEach((w) => {
      const cat = w.category ?? 3;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(w);
    });
    return groups;
  }, [wasteTypes]);

  // Filtered list for step-2 (by selected category + search query)
  const filteredWasteTypes = useMemo(() => {
    return wasteTypes.filter((w) => {
      const cat = w.category ?? 3;
      const matchesCat = selectedCategory === null || cat === selectedCategory;
      const matchesSearch = !wtSearch || w.name.toLowerCase().includes(wtSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [wasteTypes, wtSearch, selectedCategory]);

  const hasHazardous = useMemo(() => {
    return selectedWastes.some((waste) => {
      const wt = wasteTypes.find((w) => w.id === waste.wasteTypeId);
      return wt?.category === 2;
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
          toast.error("Chỉ được chọn tối đa 5 loại rác");
          return prev;
        }
        return [...prev, { wasteTypeId: id, quantity: 1, note: "" }];
      }
    });
  };

  const getCreateReportValidationError = () => {
    if (selectedWastes.length === 0) return "Vui lòng chọn ít nhất 1 loại rác";
    const quantityError = getWasteQuantityListValidationError(selectedWastes);
    if (quantityError) return quantityError;
    if (imageFiles.length === 0) return "Vui lòng thêm ít nhất 1 ảnh";
    if (uploadedImages.length !== imageFiles.length) return "Ảnh đang được xử lý, vui lòng chờ một chút";
    if (!form.latitude) return "Vui lòng xác định vị trí GPS";
    return null;
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReport || isUploadingImages || createMutation.isPending) return;

    const validationError = getCreateReportValidationError();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setConfirmCreateOpen(true);
  };

  const handleConfirmCreateReport = async () => {
    if (isSubmittingReport || isUploadingImages || createMutation.isPending) return;

    const validationError = getCreateReportValidationError();
    if (validationError) {
      toast.error(validationError);
      setConfirmCreateOpen(false);
      return;
    }

    setConfirmCreateOpen(false);
    setIsSubmittingReport(true);
    try {
      const imageUrls = uploadedImages.map((image) => image.url);
      await createMutation.mutateAsync({
        description: form.description || undefined,
        address: form.address.trim() || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        wastes: selectedWastes.map((waste, i) => ({
          wasteTypeId: waste.wasteTypeId,
          quantity: waste.quantity,
          note: waste.note || undefined,
          images: i === 0 ? imageUrls : undefined,
        })),
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Gửi báo cáo thất bại, vui lòng thử lại";
      toast.error(message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const createReportDisabledReason = (() => {
    if (isSubmittingReport || createMutation.isPending) return "Đang gửi báo cáo...";
    if (isUploadingImages) return "Ảnh đang được phân tích, vui lòng chờ một chút";
    return getCreateReportValidationError();
  })();
  const isCreateReportDisabled = !!createReportDisabledReason;

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintReport) {
      toast.error("Không tìm thấy báo cáo liên quan cho khiếu nại này");
      return;
    }
    if (!complaintType.trim()) {
      toast.error("Vui lòng chọn loại khiếu nại");
      return;
    }
    if (!complaintContent.trim()) {
      toast.error("Vui lòng nhập nội dung khiếu nại");
      return;
    }
    createComplaintMutation.mutate();
  };

  const getComplaintReportSummary = (complaint: Complaint) => {
    const report = reports.find((item) => item.id === complaint.reportId);
    if (!report) return "Báo cáo liên quan";
    const title = report.description?.trim() || report.wastes?.map((w) => w.wasteTypeName || w.wasteTypeId).join(", ") || "Báo cáo rác";
    return title;
  };

  // Thá»‘ng kÃª nhanh tá»« danh sÃ¡ch bÃ¡o cÃ¡o
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => {
    const status = r.status?.toUpperCase();
    return status === "PENDING" || status === "PROCESSING";
  }).length;
  const openComplaintCount = complaints.filter((c) => {
    const status = c.status?.toUpperCase();
    return status === "OPEN" || status === "INREVIEW";
  }).length;
  const {
    data: citizenPointSummary,
    isLoading: citizenPointSummaryLoading,
    isError: citizenPointSummaryError,
  } = useCitizenPoint(user?.id);
  const {
    data: citizenPointMyRank,
    isLoading: citizenPointMyRankLoading,
    isError: citizenPointMyRankError,
  } = useCitizenPointMyRank("AllTime");
  const {
    data: citizenPointLeaderboard = [],
    isLoading: citizenPointLeaderboardLoading,
    isError: citizenPointLeaderboardError,
  } = useCitizenPointLeaderboard({ period: "AllTime", topCount: 10 });
  const stats = [
    { icon: MapPin, label: "Báo cáo", value: totalReports.toString(), color: "bg-eco-light" },
    { icon: Clock, label: "Đang chờ", value: pendingReports.toString(), color: "bg-eco-medium" },
    {
      icon: Award,
      label: "Điểm thưởng",
      value: citizenPointSummaryLoading ? "..." : citizenPointSummaryError ? "--" : String(citizenPointSummary?.totalPoints ?? 0),
      color: "bg-eco-teal",
    },
    {
      icon: TrendingUp,
      label: "Xếp hạng",
      value: citizenPointMyRankLoading ? "..." : citizenPointMyRankError ? "--" : citizenPointMyRank?.rank ? `#${citizenPointMyRank.rank}` : "Chưa có",
      color: "bg-eco-light",
    },
  ];
  const leaderboardLocationLabel =
    citizenPointLeaderboard.find((item) => item.districtName)?.districtName ||
    citizenPointLeaderboard.find((item) => item.wardName)?.wardName ||
    "Toàn hệ thống";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Xin chào, {user?.name} 👋</h1>
        <p className="text-sm text-muted-foreground">Quản lý báo cáo rác và theo dõi điểm thưởng</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-6 w-6 text-eco-dark" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Biểu đồ
          </TabsTrigger>
          <TabsTrigger value="reports">Báo cáo của tôi</TabsTrigger>
          <TabsTrigger value="rewards" className="gap-1.5">
            <Gift className="h-4 w-4" />
            Đổi quà
          </TabsTrigger>
          <TabsTrigger value="complaints" className="gap-1.5">
            Khiếu nại của tôi
            {openComplaintCount > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                {openComplaintCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CitizenDashboardCharts />
        </TabsContent>

        <TabsContent value="reports">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Lịch sử báo cáo</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={reportStatusFilter} onValueChange={(value) => setReportStatusFilter(value as ReportStatusFilterValue)}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {reportStatusFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeCreateDialog(); else setOpen(true); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Tạo báo cáo mới</Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100vw-1rem)] max-w-md overflow-y-auto" style={{ maxHeight: "90vh" }}>
                  <DialogHeader>
                    <DialogTitle className="font-display">Tạo báo cáo rác mới</DialogTitle>
                  </DialogHeader>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                    Ví dụ: ảnh chai nước suối có thể được gợi ý là nhóm <span className="font-medium text-foreground">Tái chế</span> và hệ thống có thể tự chọn sẵn loại rác phù hợp nếu nhận diện được.
                  </div>
                  {(imageSuggestion?.categoryLabel || imageSuggestion?.wasteTypeName) && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                      {imageSuggestion.wasteTypeName ? (
                        <>
                          Gợi ý từ ảnh: <span className="font-semibold">{imageSuggestion.wasteTypeName}</span>
                          {imageSuggestion.categoryLabel ? <> thuộc nhóm <span className="font-semibold">{imageSuggestion.categoryLabel}</span>.</> : "."}
                        </>
                      ) : (
                        <>
                          Gợi ý từ ảnh: <span className="font-semibold">{imageSuggestion.categoryLabel}</span>.
                        </>
                      )}
                    </div>
                  )}
                  <form onSubmit={handleCreateReport} className="space-y-4 pb-2">

                  {/* â”€â”€ Loáº¡i rÃ¡c multi-select â”€â”€ */}
                  <div>
                    <Label>Loại rác *</Label>
                    <div className="relative mt-1">
                      {/* Trigger box */}
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
                        {/* Counter + chevron */}
                        <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
                          {selectedWastes.length > 0 && (
                            <span className="text-[11px] font-medium text-muted-foreground">{selectedWastes.length}/5</span>
                          )}
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Dropdown panel */}
                      {wtDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => { setWtDropdownOpen(false); setWtSearch(""); setSelectedCategory(null); }} />
                          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">

                            {selectedCategory === null ? (
                              /* â”€â”€ Step 1: Category selection â”€â”€ */
                              <div className="p-2">
                                <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Chọn danh mục
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {CATEGORY_CARDS.map((cat) => {
                                    const count = (groupedWasteTypes[cat.value] ?? []).length;
                                    return (
                                      <button
                                        key={cat.value}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat.value); setWtSearch(""); }}
                                        className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-colors ${cat.borderColor} ${cat.bgHover}`}
                                      >
                                        <cat.Icon className={`h-6 w-6 ${cat.iconColor}`} />
                                        <span className="text-xs font-semibold">{cat.label}</span>
                                        <span className="text-[10px] text-muted-foreground">{count} loại</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              /* â”€â”€ Step 2: WasteType list within selected category â”€â”€ */
                              <div>
                                {/* Back button */}
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                  onClick={(e) => { e.stopPropagation(); setSelectedCategory(null); setWtSearch(""); }}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  <span>Quay lại danh mục</span>
                                  <span className="ml-auto font-medium text-foreground">
                                    {CATEGORY_CARDS.find((c) => c.value === selectedCategory)?.label}
                                  </span>
                                </button>
                                {/* Search */}
                                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <input
                                    autoFocus
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                    placeholder="Tìm loại rác..."
                                    value={wtSearch}
                                    onChange={(e) => setWtSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {/* WasteType list */}
                                <div className="max-h-52 overflow-y-auto py-1">
                                  {filteredWasteTypes.length === 0 ? (
                                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">Không tìm thấy loại rác</p>
                                  ) : (
                                    filteredWasteTypes.map((wt) => {
                                      const selected = selectedWastes.some((w) => w.wasteTypeId === wt.id);
                                      return (
                                        <div
                                          key={wt.id}
                                          className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${selected ? "bg-primary/5 font-medium text-primary" : ""}`}
                                          onClick={(e) => { e.stopPropagation(); toggleWasteType(wt.id); }}
                                        >
                                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                            selected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                                          }`}>
                                            {selected && <span className="text-[10px] leading-none">âœ“</span>}
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
                      <div className="mt-1.5 flex items-start gap-2 rounded-md border-l-4 border-orange-400 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                        <span><span className="font-semibold">Rác nguy hại</span> sẽ được xử lý theo quy trình riêng.</span>
                      </div>
                    )}
                  </div>

                  {/* â”€â”€ Chi tiáº¿t loáº¡i rÃ¡c â”€â”€ */}
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

                  {/* â”€â”€ MÃ´ táº£ â”€â”€ */}
                  <div>
                    <Label>Mô tả</Label>
                    <Textarea
                      className="mt-1"
                      placeholder="Mô tả ngắn về rác cần thu gom..."
                      value={form.description || ""}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Mô tả rõ ràng sẽ giúp đơn vị thu gom xử lý nhanh hơn.</p>
                  </div>

                  {/* â”€â”€ HÃ¬nh áº£nh â”€â”€ */}
                  <div>
                    <Label>Hình ảnh *</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        await handleSelectImages(files);
                        e.target.value = "";
                      }}
                    />
                    <div
                      className="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted p-3 transition-colors hover:border-primary"
                      onClick={() => { if (!isUploadingImages) fileInputRef.current?.click(); }}
                    >
                      {imageFiles.length === 0 ? (
                        <div className="text-center">
                          <Camera className="mx-auto h-6 w-6 text-muted-foreground" />
                          <span className="mt-1 block text-xs text-muted-foreground">Chụp / tải ảnh lên</span>
                        </div>
                      ) : (
                        <div className="flex w-full flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          {imageFiles.map((file, i) => (
                            <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                              <img src={imagePreviewUrls[i]} alt={file.name} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                                onClick={() => handleRemoveImage(i)}
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                          <div
                            className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-background hover:border-primary"
                            onClick={() => { if (!isUploadingImages) fileInputRef.current?.click(); }}
                          >
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Chụp rõ toàn bộ đống rác để xác nhận nhanh hơn.</p>
                  </div>

                  {/* â”€â”€ Vá»‹ trÃ­ GPS â”€â”€ */}
                  <div>
                    <Label>Vị trí GPS *</Label>
                    <div className="mt-1 flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="flex-1 gap-2" onClick={getGPS}>
                        <MapPin className="h-4 w-4" />
                        {form.latitude ? `${form.latitude.toFixed(5)}, ${form.longitude?.toFixed(5)}` : "GPS tự động"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setMapPickerOpen(true)}>
                        <Map className="h-4 w-4" />
                        Chọn trên bản đồ
                      </Button>
                    </div>
                    {form.latitude && locationName && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-primary" />
                        Đã xác định vị trí: <span className="font-medium text-foreground">{locationName}</span>
                      </p>
                    )}
                  </div>

                  {/* â”€â”€ Äá»‹a chá»‰ chi tiáº¿t â”€â”€ */}
                  <div>
                    <Label>Địa chỉ chi tiết</Label>
                    <Input
                      className="mt-1"
                      placeholder="Số nhà, đường, phường..."
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>

                  {/* Validation hints */}
                  {(selectedWastes.length === 0 || imageFiles.length === 0 || uploadedImages.length !== imageFiles.length || isUploadingImages || !form.latitude || hasInvalidWasteQuantity(selectedWastes)) && (
                    <ul className="space-y-0.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      {selectedWastes.length === 0 && <li>• Chọn ít nhất 1 loại rác</li>}
                      {hasInvalidWasteQuantity(selectedWastes) && <li>• Nhập khối lượng hợp lệ cho tất cả loại rác (&gt; 0 kg, tối đa 2 số lẻ)</li>}
                      {imageFiles.length === 0 && <li>• Thêm ít nhất 1 ảnh</li>}
                      {!form.latitude && <li>• Xác định vị trí GPS</li>}
                    </ul>
                  )}

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            type="submit"
                            className={`w-full border-2 border-primary/20 hover:border-primary/40 transition-colors ${
                              isCreateReportDisabled ? "opacity-50 cursor-not-allowed" : "shadow-sm hover:shadow-md"
                            }`}
                            disabled={isCreateReportDisabled}
                          >
                            {createMutation.isPending ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...</>
                            ) : "Gửi báo cáo"}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {createReportDisabledReason && (
                        <TooltipContent>
                          <p>{createReportDisabledReason}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loadingReports ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
              <MapPin className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-foreground">
                {reports.length === 0 ? "Chưa có báo cáo nào" : "Không có báo cáo phù hợp với bộ lọc"}
              </p>
              <p className="text-sm text-muted-foreground">
                {reports.length === 0 ? 'Nhấn "Tạo báo cáo mới" để bắt đầu' : "Hãy thử chọn trạng thái khác để xem thêm báo cáo"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((r) => {
                const normalizedStatus = (r.status || "").toUpperCase();
                const st = statusMap[normalizedStatus] || { label: r.status, variant: "secondary" as const };
                // Fix Invalid Date
                const dateStr = r.createdTime ? (() => {
                  const d = new Date(r.createdTime);
                  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
                })() : "";
                const wasteNames = r.wastes?.map(w => w.wasteTypeName || w.wasteTypeId).join(", ") || "Báo cáo rác";
                const hasImages = r.wastes?.some(w => w.imageUrls?.length);
                return (
                  <Card
                    key={r.id}
                    className="shadow-card cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => setSelectedReport(r)}
                  >
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        {hasImages && r.wastes?.[0]?.imageUrls?.[0] ? (
                          <img
                            src={r.wastes[0].imageUrls[0]}
                            alt="Report image"
                            className="h-10 w-10 rounded-lg object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-eco-light text-sm font-bold text-eco-dark">
                            <Recycle className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{wasteNames}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.latitude && r.longitude ? `Vị trí: ${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : "Vị trí chưa xác định"}
                          </p>
                          {dateStr && <p className="text-xs text-muted-foreground">{dateStr}</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
                        {r.points != null && r.points > 0 && (
                          <span className="flex items-center gap-1 text-sm font-medium text-primary">
                            <Star className="h-4 w-4" /> +{r.points}
                          </span>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openComplaintDialog(r);
                          }}
                        >
                          Khiếu nại
                        </Button>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rewards">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-card md:col-span-2">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-eco-light">
                      <Award className="h-6 w-6 text-eco-dark" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Điểm thưởng hiện tại</p>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {citizenPointSummaryLoading
                          ? "..."
                          : citizenPointSummaryError
                            ? "--"
                            : `${citizenPointSummary?.totalPoints ?? 0} điểm`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-eco-medium">
                      <Gift className="h-6 w-6 text-eco-dark" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phần thưởng khả dụng</p>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {rewardsLoading ? "..." : rewards.filter((reward) => reward.isActive && reward.stock > 0).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <Gift className="h-5 w-5 text-primary" /> Đổi phần thưởng bằng điểm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rewardsLoading ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Card key={`reward-skeleton-${index}`} className="border border-border/70 shadow-none">
                          <CardContent className="space-y-3 p-4">
                            <Skeleton className="h-28 w-full rounded-lg" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-9 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : rewardsError ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Không thể tải danh sách phần thưởng.</p>
                    </div>
                  ) : rewards.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <Gift className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Hiện chưa có phần thưởng nào để đổi.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {rewards.map((reward) => {
                        const currentPoints = citizenPointSummary?.totalPoints ?? 0;
                        const isSoldOut = reward.stock <= 0;
                        const notEnoughPoints = currentPoints < reward.pointCost;
                        const redeemDisabled =
                          redeemRewardMutation.isPending ||
                          !reward.isActive ||
                          isSoldOut ||
                          notEnoughPoints;

                        return (
                          <Card key={reward.id} className="border border-border/70 shadow-none">
                            <CardContent className="space-y-3 p-4">
                              {reward.imageUrl ? (
                                <img
                                  src={reward.imageUrl}
                                  alt={reward.name}
                                  className="h-32 w-full rounded-lg border object-cover"
                                />
                              ) : (
                                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
                                  <Gift className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                              )}

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-foreground">{reward.name}</p>
                                  <Badge variant={reward.isActive ? "outline" : "secondary"}>
                                    {reward.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                                  </Badge>
                                  {isSoldOut && <Badge variant="destructive">Hết hàng</Badge>}
                                </div>
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                  {reward.description || "Phần thưởng có thể đổi bằng điểm từ hoạt động tái chế của bạn."}
                                </p>
                              </div>

                              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                                <span className="text-muted-foreground">Điểm quy đổi</span>
                                <span className="font-semibold text-primary">{reward.pointCost} điểm</span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Còn lại: {reward.stock}</span>
                                {reward.createdTime && (
                                  <span>Tạo lúc {new Date(reward.createdTime).toLocaleDateString("vi-VN")}</span>
                                )}
                              </div>

                              <Button
                                className="w-full"
                                disabled={redeemDisabled}
                                onClick={() =>
                                  redeemRewardMutation.mutate(reward.id, {
                                    onSuccess: () => {
                                      toast.success("Đổi quà thành công. Điểm thưởng của bạn đã được cập nhật.");
                                    },
                                    onError: (error) => {
                                      toast.error(error.message || "Đổi quà thất bại");
                                    },
                                  })
                                }
                              >
                                {redeemRewardMutation.isPending ? "Đang xử lý..." : "Đổi ngay"}
                              </Button>

                              {notEnoughPoints && (
                                <p className="text-xs text-destructive">
                                  Bạn cần thêm {reward.pointCost - currentPoints} điểm để đổi phần thưởng này.
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <Clock className="h-5 w-5 text-primary" /> Lịch sử đổi thưởng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rewardRedemptionsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={`reward-redemption-skeleton-${index}`} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : rewardRedemptionsError ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Không thể tải lịch sử đổi thưởng.</p>
                    </div>
                  ) : rewardRedemptions.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <Gift className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Bạn chưa đổi phần thưởng nào.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {rewardRedemptions.map((redemption) => (
                          <div
                            key={redemption.id}
                            className="flex flex-col gap-3 rounded-lg border border-border/70 p-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
                                <Gift className="h-5 w-5 text-muted-foreground/50" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">{redemption.rewardName}</p>
                                  <Badge variant="outline">Đã đổi</Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {redemption.createdTime
                                    ? new Date(redemption.createdTime).toLocaleString("vi-VN")
                                    : "Chưa rõ thời gian"}
                                </p>
                              </div>
                              <span className="shrink-0 text-sm font-semibold text-primary">
                                -{redemption.pointCostSnapshot} điểm
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <SimplePagination
                        pageNumber={rewardRedemptionPageNumber}
                        pageSize={rewardRedemptionsData?.pageSize ?? 5}
                        totalCount={rewardRedemptionsData?.totalCount ?? rewardRedemptions.length}
                        onPageChange={setRewardRedemptionPageNumber}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <Award className="h-5 w-5 text-primary" /> Lịch sử điểm thưởng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {citizenPointHistoryLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={`citizen-point-history-skeleton-${index}`} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : citizenPointHistoryError ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Không thể tải lịch sử điểm thưởng.</p>
                    </div>
                  ) : citizenPointHistory.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <Award className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Bạn chưa có biến động điểm nào.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {citizenPointHistory.map((historyItem) => (
                          <div
                            key={historyItem.id}
                            className="rounded-lg border border-border/70 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                  {historyItem.reason?.trim() || historyItem.enterpriseName || "Cập nhật điểm thưởng"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {historyItem.createdTime
                                    ? new Date(historyItem.createdTime).toLocaleString("vi-VN")
                                    : "Chưa rõ thời gian"}
                                </p>
                                {(historyItem.source || historyItem.status) && (
                                  <p className="text-xs text-muted-foreground">
                                    {[historyItem.source, historyItem.status].filter(Boolean).join(" • ")}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold text-primary">
                                  {historyItem.points >= 0 ? "+" : ""}
                                  {historyItem.points} điểm
                                </p>
                                {historyItem.balanceAfter != null && (
                                  <p className="text-xs text-muted-foreground">
                                    Số dư: {historyItem.balanceAfter} điểm
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <SimplePagination
                        pageNumber={pointHistoryPageNumber}
                        pageSize={citizenPointHistoryData?.pageSize ?? 5}
                        totalCount={citizenPointHistoryData?.totalCount ?? citizenPointHistory.length}
                        onPageChange={setPointHistoryPageNumber}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="complaints">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Khiếu nại của tôi</h2>
              <p className="text-sm text-muted-foreground">Theo dõi trạng thái xử lý khiếu nại cho từng báo cáo.</p>
            </div>
          </div>

          {loadingComplaints ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
              <AlertTriangle className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-foreground">Chưa có khiếu nại nào</p>
              <p className="text-sm text-muted-foreground">Vào tab "Báo cáo của tôi" và bấm "Khiếu nại" trên báo cáo bạn muốn theo dõi.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {complaints.map((complaint) => (
                  <CitizenComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    reportSummary={getComplaintReportSummary(complaint)}
                    onView={setSelectedComplaint}
                  />
                ))}
              </div>
              <SimplePagination
                pageNumber={complaintData?.pageNumber ?? complaintPageNumber}
                pageSize={complaintData?.pageSize ?? 10}
                totalCount={complaintData?.totalCount ?? complaints.length}
                onPageChange={setComplaintPageNumber}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Trophy className="h-5 w-5 text-primary" /> Bảng xếp hạng - {leaderboardLocationLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {citizenPointLeaderboardLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải bảng xếp hạng...
                </div>
              ) : citizenPointLeaderboardError ? (
                <p className="text-sm text-destructive">Không thể tải bảng xếp hạng.</p>
              ) : citizenPointLeaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu bảng xếp hạng.</p>
              ) : (
                <div className="space-y-3">
                  {citizenPointLeaderboard.map((item, index) => {
                    const rank = item.rank ?? index + 1;
                    const isCurrentUser = item.citizenId === user?.id;

                    return (
                      <div key={`${item.citizenId || rank}-${index}`} className={`flex flex-col gap-2 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between ${isCurrentUser ? "bg-eco-light" : "bg-muted/50"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold ${rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {rank}
                          </div>
                          <span className="text-sm font-medium text-foreground">{item.citizenName || "Ẩn danh"}</span>
                          {isCurrentUser && <Badge variant="outline" className="text-xs">Bạn</Badge>}
                        </div>
                        <span className="font-display text-sm font-bold text-primary">{item.totalPoints} điểm</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Map Picker */}
      <MapPicker
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onConfirm={(lat, lng, address) => {
          setForm((f) => ({ ...f, latitude: lat, longitude: lng, address: address || f.address }));
          if (address) setLocationName(address);
          setMapPickerOpen(false);
        }}
        initialLat={form.latitude}
        initialLng={form.longitude}
      />

      {/* Modal chi tiáº¿t bÃ¡o cÃ¡o */}
      <ReportDetailModal
        report={selectedReport}
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onCancel={(id) => deleteMutation.mutate(id)}
        isCancelling={deleteMutation.isPending}
        onRedispatch={(id) => redispatchMutation.mutate(id)}
        isRedispatching={redispatchMutation.isPending}
        onUpdateNoEnterprise={(id, data) => updateNoEnterpriseMutation.mutate({ id, data })}
        isUpdatingNoEnterprise={updateNoEnterpriseMutation.isPending}
      />

      <AlertDialog open={confirmCreateOpen} onOpenChange={setConfirmCreateOpen}>
        <AlertDialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Xác nhận gửi báo cáo</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng kiểm tra lại thông tin trước khi gửi. Hệ thống có AI gợi ý loại rác từ ảnh, nên bạn nên xác nhận lại để đảm bảo báo cáo chính xác.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 text-sm">
            {(imageSuggestion?.categoryLabel || imageSuggestion?.wasteTypeName) && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-800">
                {imageSuggestion.wasteTypeName ? (
                  <>
                    AI đang gợi ý loại rác: <span className="font-semibold">{imageSuggestion.wasteTypeName}</span>
                    {imageSuggestion.categoryLabel ? <> thuộc nhóm <span className="font-semibold">{imageSuggestion.categoryLabel}</span></> : null}
                  </>
                ) : (
                  <>
                    AI đang gợi ý nhóm rác: <span className="font-semibold">{imageSuggestion.categoryLabel}</span>
                  </>
                )}
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Loại rác đã chọn</p>
              <div className="mt-2 space-y-2">
                {selectedWastes.map((waste) => {
                  const wasteType = wasteTypes.find((item) => item.id === waste.wasteTypeId);
                  return (
                    <div key={waste.wasteTypeId} className="rounded-md border border-border bg-background px-3 py-2">
                      <p className="font-medium text-foreground">{wasteType?.name ?? waste.wasteTypeId}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {waste.quantity} kg
                        {waste.note?.trim() ? ` • ${waste.note.trim()}` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hình ảnh</p>
                <p className="mt-1 font-medium text-foreground">{imageFiles.length} ảnh đã tải lên</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vị trí GPS</p>
                <p className="mt-1 font-medium text-foreground">
                  {locationName || `${form.latitude?.toFixed(5)}, ${form.longitude?.toFixed(5)}`}
                </p>
              </div>
            </div>

            {form.description?.trim() && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mô tả</p>
                <p className="mt-1 text-foreground">{form.description.trim()}</p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingReport || createMutation.isPending}>
              Xem lại
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmittingReport || createMutation.isPending}
              onClick={() => {
                void handleConfirmCreateReport();
              }}
            >
              {isSubmittingReport || createMutation.isPending ? "Đang gửi..." : "Xác nhận và gửi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={complaintDialogOpen} onOpenChange={(open) => { if (!open) closeComplaintDialog(); }}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Tạo khiếu nại</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateComplaint} className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">
                Báo cáo: {complaintReport?.description?.trim() || complaintReport?.wastes?.map((w) => w.wasteTypeName || w.wasteTypeId).join(", ") || "Báo cáo rác"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Khiếu nại sẽ được gửi kèm với báo cáo bạn đang chọn.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="complaintType">Loại khiếu nại</Label>
              <Select value={complaintType} onValueChange={setComplaintType}>
                <SelectTrigger id="complaintType">
                  <SelectValue>{complaintTypeMap[complaintType] || complaintType}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feedback">Phản hồi</SelectItem>
                  <SelectItem value="Complaint">Khiếu nại</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="complaintContent">Nội dung</Label>
              <Textarea
                id="complaintContent"
                rows={5}
                value={complaintContent}
                onChange={(e) => setComplaintContent(e.target.value)}
                placeholder="Mô tả vấn đề bạn muốn khiếu nại..."
                disabled={createComplaintMutation.isPending}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeComplaintDialog} disabled={createComplaintMutation.isPending}>
                Hủy
              </Button>
              <Button type="submit" disabled={createComplaintMutation.isPending}>
                {createComplaintMutation.isPending ? "Đang gửi..." : "Gửi khiếu nại"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedComplaint} onOpenChange={(open) => { if (!open) setSelectedComplaint(null); }}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Chi tiết khiếu nại</DialogTitle>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{complaintTypeMap[selectedComplaint.type] || selectedComplaint.type}</Badge>
                <Badge variant={(complaintStatusMap[selectedComplaint.status] || { variant: "secondary" as const }).variant}>
                  {(complaintStatusMap[selectedComplaint.status] || { label: selectedComplaint.status }).label}
                </Badge>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">Báo cáo liên quan</p>
                <p className="mt-1 text-sm text-foreground">{getComplaintReportSummary(selectedComplaint)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tạo lúc {new Date(selectedComplaint.createdTime).toLocaleString("vi-VN")}
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium text-foreground">Nội dung khiếu nại</p>
                <p className="mt-1 text-sm text-foreground">{selectedComplaint.content}</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">Kết quả xử lý</p>
                  {selectedComplaintResolutionsData?.totalCount ? (
                    <span className="text-xs text-muted-foreground">
                      {selectedComplaintResolutionsData.totalCount} mục
                    </span>
                  ) : null}
                </div>
                {selectedComplaint.status === "EnterpriseResponded" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Doanh nghiệp đã phản hồi khiếu nại này. Khiếu nại hiện đang chờ quản trị viên đưa ra kết quả cuối cùng.
                  </p>
                ) : selectedComplaint.status !== "Resolved" ? (
                  <p className="mt-1 text-sm text-muted-foreground">Khiếu nại này đang được xử lý hoặc chưa có kết quả cuối cùng.</p>
                ) : selectedComplaintResolutionsLoading ? (
                  <p className="mt-1 text-sm text-muted-foreground">Đang tải lịch sử xử lý...</p>
                ) : selectedComplaintResolutionsError ? (
                  <p className="mt-1 text-sm text-destructive">Không thể tải lịch sử xử lý.</p>
                ) : selectedComplaintResolutions.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">Chưa có lịch sử xử lý cho khiếu nại này.</p>
                ) : (
                  <>
                    <div className="mt-2 space-y-2">
                      {selectedComplaintResolutions.map((resolution) => (
                        <div key={resolution.id} className="rounded-md border border-border bg-muted/30 p-3">
                          <p className="text-sm text-foreground">{String(resolution.responseNote ?? resolution.resolutionNote ?? "Không có nội dung")}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(String(resolution.resolvedAt ?? resolution.createdTime ?? selectedComplaint.createdTime)).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      ))}
                    </div>
                    <SimplePagination
                      pageNumber={selectedComplaintResolutionsData?.pageNumber ?? selectedComplaintResolutionPageNumber}
                      pageSize={selectedComplaintResolutionsData?.pageSize ?? 5}
                      totalCount={selectedComplaintResolutionsData?.totalCount ?? selectedComplaintResolutions.length}
                      onPageChange={setSelectedComplaintResolutionPageNumber}
                    />
                  </>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedComplaint(null)}>Đóng</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CitizenDashboard;




