import { useState, useRef } from "react";
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
import { Plus, MapPin, Clock, Award, Trophy, Star, Camera, TrendingUp, Loader2, ChevronRight, X, Map } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wasteReportService, WasteReport, CreateWasteReportRequest } from "@/services/wasteReport";
import { wasteTypeService } from "@/services/wasteType";

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

  // Form state (local - dùng riêng, không gõ theo CreateWasteReportRequest)
  const [form, setForm] = useState({
    wasteTypeId: "",
    description: "",
    address: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const resetForm = () => {
    setForm({ wasteTypeId: "", description: "", address: "", latitude: undefined, longitude: undefined });
    setImageFiles([]);
  };

  // Fetch danh sách loại rác cho dropdown
  const { data: wasteTypes = [] } = useQuery({
    queryKey: ["wasteTypes"],
    queryFn: () => wasteTypeService.getAll(),
  });

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

  // Lấy GPS tự động
  const getGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        toast.success("Đã lấy tọa độ GPS thành công!");
      },
      () => toast.error("Không thể lấy tọa độ GPS. Vui lòng nhập địa chỉ thủ công.")
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.wasteTypeId) {
      toast.error("Vui lòng chọn loại rác");
      return;
    }
    createMutation.mutate({
      description: form.description || undefined,
      latitude: form.latitude,
      longitude: form.longitude,
      wastes: [{ wasteTypeId: form.wasteTypeId, images: imageFiles.length > 0 ? imageFiles : undefined }],
    });
  };

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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Tạo báo cáo rác mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label>Loại rác *</Label>
                    <Select
                      value={form.wasteTypeId}
                      onValueChange={(v) => setForm((f) => ({ ...f, wasteTypeId: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Chọn loại rác" />
                      </SelectTrigger>
                      <SelectContent>
                        {wasteTypes.length > 0 ? (
                          wasteTypes.map((w) => (
                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                          ))
                        ) : (
                          // Fallback nếu API WasteType chưa có
                          ["Nhựa", "Giấy/Carton", "Kim loại", "Thủy tinh", "Hữu cơ", "Nguy hại", "Khác"].map((w) => (
                            <SelectItem key={w} value={w}>{w}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mô tả</Label>
                    <Textarea
                      className="mt-1"
                      placeholder="Mô tả ngắn về rác cần thu gom..."
                      value={form.description || ""}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Hình ảnh</Label>
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
                          <span className="mt-1 text-xs text-muted-foreground">Chụp / tải ảnh lên</span>
                        </div>
                      ) : (
                        <div className="flex w-full flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          {imageFiles.map((file, i) => (
                            <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
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
                  </div>
                  <div>
                    <Label>Vị trí GPS</Label>
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
                  </div>
                  <div>
                    <Label>Địa chỉ chi tiết *</Label>
                    <Input
                      className="mt-1"
                      placeholder="Số nhà, đường, phường..."
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...</>
                    ) : "Gửi báo cáo"}
                  </Button>
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
                const dateStr = r.createdAt ? (() => {
                  const d = new Date(r.createdAt);
                  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
                })() : "";
                const displayName = r.wasteTypeName || "Báo cáo rác";
                return (
                  <Card
                    key={r.id}
                    className="shadow-card cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => setSelectedReport(r)}
                  >
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-eco-light text-sm font-bold text-eco-dark">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{displayName}</p>
                          {r.address && <p className="text-xs text-muted-foreground">{r.address}</p>}
                          {dateStr && <p className="text-xs text-muted-foreground">{dateStr}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {r.points != null && r.points > 0 && (
                          <span className="flex items-center gap-1 text-sm font-medium text-primary">
                            <Star className="h-4 w-4" /> +{r.points} điểm
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
      />
    </DashboardLayout>
  );
};

export default CitizenDashboard;
