import { useState, useRef, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, MapPin, Clock, Award, Trophy, Star, Camera, TrendingUp, Loader2, ChevronRight, X, Map, Search, AlertTriangle, ChevronDown, ChevronLeft, Leaf, Recycle, Flame, Package } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wasteReportService, WasteReport, CreateWasteReportRequest } from "@/services/wasteReport";
import { wasteTypeService } from "@/services/wasteType";
import { imageService } from "@/services/image";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ xử lý", variant: "secondary" },
  PROCESSING: { label: "Đã tiếp nhận", variant: "outline" },
  ASSIGNED: { label: "Đã điều phối", variant: "default" },
  COMPLETED: { label: "Hoàn thành", variant: "default" },
  REJECTED: { label: "Từ chối", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

const mockLeaderboard = [
  { rank: 1, name: "Trần Thị B", points: 520, district: "Quận 1" },
  { rank: 2, name: "Nguyễn Văn An", points: 320, district: "Quận 1" },
  { rank: 3, name: "Lê Văn C", points: 280, district: "Quận 1" },
  { rank: 4, name: "Phạm Thị D", points: 210, district: "Quận 1" },
  { rank: 5, name: "Hoàng Văn E", points: 180, district: "Quận 1" },
];

const CitizenDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Tạo blob preview URLs 1 lần khi imageFiles thay đổi, cleanup để tránh memory leak
  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

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
  const resetForm = () => {
    setForm({ description: "", address: "", latitude: undefined, longitude: undefined });
    setImageFiles([]);
    setSelectedWastes([]);
    setWtSearch("");
    setSelectedCategory(null);
    setLocationName(null);
  };

  // Fetch danh sách loại rác cho dropdown (chỉ active)
  const { data: allWasteTypes = [] } = useQuery({
    queryKey: ["wasteTypes"],
    queryFn: () => wasteTypeService.getAll(),
  });
  const wasteTypes = allWasteTypes.filter((w) => w.isActive !== false);

  // Fetch danh sách báo cáo của citizen hiện tại
  const { data: rawReports = [], isLoading: loadingReports } = useQuery({
    queryKey: ["wasteReports", user?.id],
    queryFn: () => wasteReportService.getAll({ CitizenId: user?.id }),
    enabled: !!user?.id,
    staleTime: 0,
  });

  // Filter client-side phòng trường hợp BE không filter đúng CitizenId
  const reports = rawReports.filter(
    (r) => !r.citizenId || r.citizenId === user?.id
  );

  // Mutation tạo báo cáo mới
  const createMutation = useMutation({
    mutationFn: wasteReportService.create,
    onSuccess: () => {
      toast.success("Báo cáo đã được gửi thành công!");
      setOpen(false);
      resetForm();
      // Refresh danh sách báo cáo
      queryClient.invalidateQueries({ queryKey: ["wasteReports"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gửi báo cáo thất bại. Vui lòng thử lại!");
    },
  });

  // Mutation hủy báo cáo
  const deleteMutation = useMutation({
    mutationFn: wasteReportService.delete,
    onSuccess: () => {
      toast.success("Báo cáo đã được hủy!");
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ["wasteReports"] });
    },
    onError: () => toast.error("Hủy báo cáo thất bại. Vui lòng thử lại!"),
  });

  // Mutation redispatch báo cáo
  const redispatchMutation = useMutation({
    mutationFn: wasteReportService.redispatch,
    onSuccess: () => {
      toast.success("Báo cáo đã được gửi lại!");
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ["wasteReports"] });
    },
    onError: () => toast.error("Gửi lại báo cáo thất bại. Vui lòng thử lại!"),
  });

  // Mutation update báo cáo khi NoEnterpriseAvailable
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
    { value: 0, label: "Hữu cơ",  Icon: Leaf,     iconColor: "text-green-600",  borderColor: "border-green-200",  bgHover: "hover:bg-green-50" },
    { value: 1, label: "Tái chế", Icon: Recycle,  iconColor: "text-blue-600",   borderColor: "border-blue-200",   bgHover: "hover:bg-blue-50" },
    { value: 2, label: "Nguy hại",Icon: Flame,    iconColor: "text-orange-600", borderColor: "border-orange-200", bgHover: "hover:bg-orange-50" },
    { value: 3, label: "Khác",    Icon: Package,  iconColor: "text-gray-500",   borderColor: "border-gray-200",   bgHover: "hover:bg-gray-50" },
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWastes.length === 0) { toast.error("Vui lòng chọn ít nhất 1 loại rác"); return; }
    if (imageFiles.length === 0) { toast.error("Vui lòng có ít nhất 1 ảnh"); return; }
    if (!form.latitude) { toast.error("Vui lòng xác định vị trí GPS"); return; }

    // Validate quantities > 0
    if (selectedWastes.some((w) => !w.quantity || w.quantity <= 0)) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }

    // Upload ảnh trước, lấy URLs
    let imageUrls: string[] = [];
    try {
      if (imageFiles.length === 1) {
        const result = await imageService.uploadOne(imageFiles[0]);
        imageUrls = [result.url];
      } else {
        const result = await imageService.uploadMultiple(imageFiles);
        if (result.failureCount > 0) {
          toast.error(`Upload ảnh thất bại ${result.failureCount} / ${imageFiles.length} file`);
          return;
        }
        imageUrls = result.uploaded.map((u) => u.url);
      }
    } catch {
      toast.error("Upload ảnh thất bại, vui lòng thử lại");
      return;
    }

    createMutation.mutate({
      description: form.description || undefined,
      latitude: form.latitude,
      longitude: form.longitude,
      wastes: selectedWastes.map((waste, i) => ({
        wasteTypeId: waste.wasteTypeId,
        quantity: waste.quantity,
        note: waste.note || undefined,
        // Gắn toàn bộ URL ảnh vào waste đầu tiên
        images: i === 0 ? imageUrls : undefined,
      })),
    });
  };

  const isSubmitDisabled = createMutation.isPending ||
    selectedWastes.length === 0 ||
    imageFiles.length === 0 ||
    !form.latitude ||
    selectedWastes.some((w) => !w.quantity || w.quantity <= 0);

  // Determine why the create button is disabled
  const getCreateButtonDisabledReason = () => {
    if (createMutation.isPending) return "Đang gửi báo cáo...";
    if (selectedWastes.length === 0) return "Vui lòng chọn ít nhất 1 loại rác";
    if (selectedWastes.some((w) => !w.quantity || w.quantity <= 0)) return "Vui lòng nhập số lượng > 0 cho tất cả loại rác";
    if (imageFiles.length === 0) return "Vui lòng thêm ít nhất 1 ảnh";
    if (!form.latitude) return "Vui lòng xác định vị trí GPS";
    return null;
  };

  const createButtonDisabledReason = getCreateButtonDisabledReason();
  const isCreateButtonDisabled = !!createButtonDisabledReason;

  // Thống kê nhanh từ danh sách báo cáo
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === "PENDING" || r.status === "PROCESSING").length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Xin chào, {user?.name} 👋</h1>
        <p className="text-sm text-muted-foreground">Quản lý báo cáo rác và theo dõi điểm thưởng</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: MapPin, label: "Báo cáo", value: totalReports.toString(), color: "bg-eco-light" },
          { icon: Clock, label: "Đang chờ", value: pendingReports.toString(), color: "bg-eco-medium" },
          { icon: Award, label: "Điểm thưởng", value: user?.points?.toString() || "0", color: "bg-eco-teal" },
          { icon: TrendingUp, label: "Xếp hạng", value: "#2", color: "bg-eco-light" },
        ].map((s, i) => (
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

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Báo cáo của tôi</TabsTrigger>
          <TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Lịch sử báo cáo</h2>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Tạo báo cáo mới</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md overflow-y-auto" style={{ maxHeight: "90vh" }}>
                <DialogHeader>
                  <DialogTitle className="font-display">Tạo báo cáo rác mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pb-2">

                  {/* ── Loại rác multi-select ── */}
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
                              /* ── Step 1: Category selection ── */
                              <div className="p-2">
                                <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Chọn danh mục
                                </p>
                                <div className="grid grid-cols-2 gap-2">
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
                              /* ── Step 2: WasteType list within selected category ── */
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
                      <div className="mt-1.5 flex items-start gap-2 rounded-md border-l-4 border-orange-400 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                        <span><span className="font-semibold">Rác nguy hại</span> sẽ được xử lý theo quy trình riêng.</span>
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
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Số lượng *</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      step="1"
                                      className="mt-1 h-8 text-sm"
                                      value={waste.quantity}
                                      onChange={(e) => {
                                        const qty = parseInt(e.target.value) || 1;
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
                                      placeholder="Ví dụ: túi 10kg"
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
                      value={form.description || ""}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
                                onClick={() => setImageFiles((prev) => prev.filter((_, j) => j !== i))}
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

                  {/* ── Địa chỉ chi tiết ── */}
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
                  {(selectedWastes.length === 0 || imageFiles.length === 0 || !form.latitude || selectedWastes.some((w) => !w.quantity || w.quantity <= 0)) && (
                    <ul className="space-y-0.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      {selectedWastes.length === 0 && <li>• Chọn ít nhất 1 loại rác</li>}
                      {selectedWastes.some((w) => !w.quantity || w.quantity <= 0) && <li>• Nhập số lượng &gt; 0 cho tất cả loại rác</li>}
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
                              isCreateButtonDisabled ? "opacity-50 cursor-not-allowed" : "shadow-sm hover:shadow-md"
                            }`}
                            disabled={isCreateButtonDisabled}
                          >
                            {createMutation.isPending ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...</>
                            ) : "Gửi báo cáo"}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {createButtonDisabledReason && (
                        <TooltipContent>
                          <p>{createButtonDisabledReason}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loadingReports ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
              <MapPin className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-foreground">Chưa có báo cáo nào</p>
              <p className="text-sm text-muted-foreground">Nhấn "Tạo báo cáo mới" để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => {
                const st = statusMap[r.status] || { label: r.status, variant: "secondary" as const };
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
                            alt="Ảnh báo cáo"
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
                      <div className="flex items-center gap-3">
                        {r.points != null && r.points > 0 && (
                          <span className="flex items-center gap-1 text-sm font-medium text-primary">
                            <Star className="h-4 w-4" /> +{r.points}
                          </span>
                        )}
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

        <TabsContent value="leaderboard">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Trophy className="h-5 w-5 text-primary" /> Bảng xếp hạng — Quận 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLeaderboard.map(l => (
                  <div key={l.rank} className={`flex items-center justify-between rounded-lg p-3 ${l.name === user?.name ? "bg-eco-light" : "bg-muted/50"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold ${l.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {l.rank}
                      </div>
                      <span className="text-sm font-medium text-foreground">{l.name}</span>
                      {l.name === user?.name && <Badge variant="outline" className="text-xs">Bạn</Badge>}
                    </div>
                    <span className="font-display text-sm font-bold text-primary">{l.points} điểm</span>
                  </div>
                ))}
              </div>
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

      {/* Modal chi tiết báo cáo */}
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
    </DashboardLayout>
  );
};

export default CitizenDashboard;
