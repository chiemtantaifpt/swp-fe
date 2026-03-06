import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package, Truck, Users, BarChart3, CheckCircle, XCircle,
  Clock, MapPin, Settings, Plus, Pencil, Trash2, Search,
  MapPinned, Recycle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { serviceAreaService, wasteCapabilityService, recyclingEnterpriseService } from "@/services/enterpriseConfig";
import { wasteTypeService } from "@/services/wasteType";
import { collectionRequestService, CollectionRequest } from "@/services/collectionRequest";

// ─── helpers ──────────────────────────────────────────────────────────────────


const mockCollectors = [
  { id: "C1", name: "Trần Minh Tuấn",    status: "online",  tasks: 3, completed: 42 },
  { id: "C2", name: "Nguyễn Hữu Phong",  status: "offline", tasks: 0, completed: 35 },
  { id: "C3", name: "Lê Thị Hoa",        status: "online",  tasks: 1, completed: 28 },
];

// ─── SkeletonRows ──────────────────────────────────────────────────────────────
const SkeletonRows = ({ cols, rows = 4 }: { cols: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: cols }).map((__, j) => (
          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

// ═══════════════════════════════════════════════════════════════════════════════
const EnterpriseDashboard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ── resolve enterpriseId: GET /RecyclingEnterprise → find by userId ──
  const { data: myEnterprise } = useQuery({
    queryKey: ["myEnterprise", user?.id],
    queryFn: async () => {
      const list = await recyclingEnterpriseService.getAll({ PageSize: 100 });
      const found = list.items.find((e) => e.userId === user?.id);
      if (!found) return null;
      return recyclingEnterpriseService.getById(found.id);
    },
    enabled: !!user?.id,
  });
  const enterpriseId = myEnterprise?.id ?? "";

  // ── inner tab state for requests ──
  const [reqStatusTab, setReqStatusTab] = useState<"Offered" | "Accepted" | "Assigned" | "Completed">("Offered");

  // ── collection request queries ──
  const { data: offeredData, isLoading: offeredLoading } = useQuery({
    queryKey: ["collectionRequests", "Offered"],
    queryFn: () => collectionRequestService.getAll({ Status: "Offered", PageSize: 50 }),
  });
  const { data: acceptedData, isLoading: acceptedLoading } = useQuery({
    queryKey: ["collectionRequests", "Accepted"],
    queryFn: () => collectionRequestService.getAll({ Status: "Accepted", PageSize: 50 }),
  });
  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: ["collectionRequests", "Assigned"],
    queryFn: () => collectionRequestService.getAll({ Status: "Assigned", PageSize: 50 }),
  });
  const { data: completedData, isLoading: completedLoading } = useQuery({
    queryKey: ["collectionRequests", "Completed"],
    queryFn: () => collectionRequestService.getAll({ Status: "Completed", PageSize: 50 }),
  });

  const offeredCount   = offeredData?.totalCount   ?? 0;
  const acceptedCount  = acceptedData?.totalCount  ?? 0;
  const assignedCount  = assignedData?.totalCount  ?? 0;
  const completedCount = completedData?.totalCount ?? 0;

  // ── collection request mutations ──
  const acceptReq = useMutation({
    mutationFn: (id: string) => collectionRequestService.accept(id),
    onSuccess: () => { toast.success("Đã tiếp nhận yêu cầu"); qc.invalidateQueries({ queryKey: ["collectionRequests"] }); },
    onError: () => toast.error("Tiếp nhận thất bại"),
  });
  const rejectReq = useMutation({
    mutationFn: (id: string) => collectionRequestService.reject(id),
    onSuccess: () => { toast.success("Đã từ chối yêu cầu"); qc.invalidateQueries({ queryKey: ["collectionRequests"] }); },
    onError: () => toast.error("Từ chối thất bại"),
  });

  // ── service area state ──
  const [areaSearch, setAreaSearch]           = useState("");
  const [areaDialog, setAreaDialog]           = useState<"add" | "edit" | null>(null);
  const [areaEditId, setAreaEditId]           = useState<string | null>(null);
  const [areaRegionCode, setAreaRegionCode]   = useState("");

  // ── waste capability state ──
  const [capSearch, setCapSearch]             = useState("");
  const [capDialog, setCapDialog]             = useState<"add" | "edit" | null>(null);
  const [capEditId, setCapEditId]             = useState<string | null>(null);
  const [capWasteTypeId, setCapWasteTypeId]   = useState("");
  const [capKg, setCapKg]                     = useState("");

  // ─── queries ────────────────────────────────────────────────────────────────
  const { data: areaData, isLoading: areaLoading } = useQuery({
    queryKey: ["serviceAreas", enterpriseId],
    queryFn: () => serviceAreaService.getAll({ EnterpriseId: enterpriseId, PageSize: 50 }),
    enabled: !!enterpriseId,
  });

  const { data: capData, isLoading: capLoading } = useQuery({
    queryKey: ["wasteCapabilities", enterpriseId],
    queryFn: () => wasteCapabilityService.getAll({ EnterpriseId: enterpriseId, PageSize: 50 }),
    enabled: !!enterpriseId,
  });

  const { data: allWasteTypes = [] } = useQuery({
    queryKey: ["wasteTypes"],
    queryFn: () => wasteTypeService.getAll(),
  });
  const activeWasteTypes = allWasteTypes.filter((w) => w.isActive !== false);

  // ─── area mutations ──────────────────────────────────────────────────────────
  const createArea = useMutation({
    mutationFn: () => serviceAreaService.create({ enterpriseId, regionCode: areaRegionCode.trim() }),
    onSuccess: () => {
      toast.success("Đã thêm khu vực phục vụ");
      setAreaDialog(null); setAreaRegionCode("");
      qc.invalidateQueries({ queryKey: ["serviceAreas"] });
    },
    onError: () => toast.error("Thêm khu vực thất bại"),
  });

  const updateArea = useMutation({
    mutationFn: () => serviceAreaService.update(areaEditId!, { regionCode: areaRegionCode.trim() }),
    onSuccess: () => {
      toast.success("Đã cập nhật khu vực");
      setAreaDialog(null); setAreaRegionCode(""); setAreaEditId(null);
      qc.invalidateQueries({ queryKey: ["serviceAreas"] });
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const deleteArea = useMutation({
    mutationFn: (id: string) => serviceAreaService.delete(id),
    onSuccess: () => {
      toast.success("Đã xóa khu vực");
      qc.invalidateQueries({ queryKey: ["serviceAreas"] });
    },
    onError: () => toast.error("Xóa thất bại"),
  });

  // ─── capability mutations ────────────────────────────────────────────────────
  const createCap = useMutation({
    mutationFn: () =>
      wasteCapabilityService.create({ enterpriseId, wasteTypeId: capWasteTypeId, dailyCapacityKg: parseFloat(capKg) }),
    onSuccess: () => {
      toast.success("Đã thêm năng lực xử lý");
      setCapDialog(null); setCapWasteTypeId(""); setCapKg("");
      qc.invalidateQueries({ queryKey: ["wasteCapabilities"] });
    },
    onError: () => toast.error("Thêm năng lực thất bại"),
  });

  const updateCap = useMutation({
    mutationFn: () => wasteCapabilityService.update(capEditId!, { dailyCapacityKg: parseFloat(capKg) }),
    onSuccess: () => {
      toast.success("Đã cập nhật năng lực");
      setCapDialog(null); setCapKg(""); setCapEditId(null);
      qc.invalidateQueries({ queryKey: ["wasteCapabilities"] });
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const deleteCap = useMutation({
    mutationFn: (id: string) => wasteCapabilityService.delete(id),
    onSuccess: () => {
      toast.success("Đã xóa năng lực");
      qc.invalidateQueries({ queryKey: ["wasteCapabilities"] });
    },
    onError: () => toast.error("Xóa thất bại"),
  });

  // ─── derived lists (client-side filter) ─────────────────────────────────────
  const areas = (areaData?.items ?? []).filter((a) =>
    a.regionCode.toLowerCase().includes(areaSearch.toLowerCase())
  );
  const caps = (capData?.items ?? []).filter((c) =>
    (c.wasteTypeName ?? "").toLowerCase().includes(capSearch.toLowerCase())
  );

  // ─── open edit dialogs ───────────────────────────────────────────────────────
  const openEditArea = (id: string, regionCode: string) => {
    setAreaEditId(id); setAreaRegionCode(regionCode); setAreaDialog("edit");
  };
  const openEditCap = (id: string, kg: number) => {
    setCapEditId(id); setCapKg(String(kg)); setCapDialog("edit");
  };

  // ─── submit handlers ─────────────────────────────────────────────────────────
  const submitArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaRegionCode.trim()) { toast.error("Vui lòng nhập mã khu vực"); return; }
    areaDialog === "add" ? createArea.mutate() : updateArea.mutate();
  };
  const submitCap = (e: React.FormEvent) => {
    e.preventDefault();
    if (capDialog === "add" && !capWasteTypeId) { toast.error("Vui lòng chọn loại rác"); return; }
    if (!capKg || isNaN(parseFloat(capKg)) || parseFloat(capKg) <= 0) {
      toast.error("Vui lòng nhập công suất hợp lệ"); return;
    }
    capDialog === "add" ? createCap.mutate() : updateCap.mutate();
  };

  const areaSubmitting  = createArea.isPending || updateArea.isPending;
  const capSubmitting   = createCap.isPending  || updateCap.isPending;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Doanh nghiệp</h1>
        <p className="text-sm text-muted-foreground">Quản lý yêu cầu thu gom và điều phối collector</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Package,      label: "Chờ phản hồi",  value: String(offeredCount),   color: "bg-eco-light"  },
          { icon: CheckCircle,  label: "Đã tiếp nhận",  value: String(acceptedCount),  color: "bg-eco-medium" },
          { icon: Truck,        label: "Đang thu gom",  value: String(assignedCount),  color: "bg-eco-teal"   },
          { icon: BarChart3,    label: "Hoàn thành",    value: String(completedCount), color: "bg-eco-light"  },
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

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Yêu cầu thu gom</TabsTrigger>
          <TabsTrigger value="collectors">Collectors</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Cấu hình
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Yêu cầu ── */}
        <TabsContent value="requests">
          <Tabs value={reqStatusTab} onValueChange={(v) => setReqStatusTab(v as typeof reqStatusTab)}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="Offered" className="gap-1.5">
                Chờ phản hồi
                {offeredCount > 0 && <Badge className="h-5 min-w-5 px-1 text-xs">{offeredCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="Accepted" className="gap-1.5">
                Đã nhận
                {acceptedCount > 0 && <Badge variant="outline" className="h-5 min-w-5 px-1 text-xs">{acceptedCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="Assigned" className="gap-1.5">
                Đang thu gom
                {assignedCount > 0 && <Badge variant="outline" className="h-5 min-w-5 px-1 text-xs">{assignedCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="Completed">Hoàn thành</TabsTrigger>
            </TabsList>

            {/* Offered */}
            <TabsContent value="Offered">
              <div className="space-y-3">
                {offeredLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="shadow-card"><CardContent className="space-y-2 p-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                  ))
                ) : (offeredData?.items ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Không có yêu cầu nào chờ phản hồi</p>
                  </div>
                ) : (
                  (offeredData?.items ?? []).map((r: CollectionRequest) => (
                    <Card key={r.id} className="shadow-card">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</span>
                              {r.wasteTypeName && <Badge variant="secondary" className="text-xs">{r.wasteTypeName}</Badge>}
                              {r.priorityScore > 0 && <Badge variant="outline" className="text-xs">Ưu tiên: {r.priorityScore}</Badge>}
                            </div>
                            {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {r.latitude != null ? `${r.latitude.toFixed(5)}, ${r.longitude?.toFixed(5)}` : ""}
                              {r.regionCode ? ` • ${r.regionCode}` : ""}
                              {" • "}{new Date(r.createdTime).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button size="sm" disabled={acceptReq.isPending} onClick={() => acceptReq.mutate(r.id)}>
                              <CheckCircle className="mr-1 h-4 w-4" /> Tiếp nhận
                            </Button>
                            <Button size="sm" variant="outline" disabled={rejectReq.isPending} onClick={() => rejectReq.mutate(r.id)}>
                              <XCircle className="mr-1 h-4 w-4" /> Từ chối
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Accepted */}
            <TabsContent value="Accepted">
              <div className="space-y-3">
                {acceptedLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="shadow-card"><CardContent className="space-y-2 p-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                  ))
                ) : (acceptedData?.items ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Không có yêu cầu nào đã nhận</p>
                  </div>
                ) : (
                  (acceptedData?.items ?? []).map((r: CollectionRequest) => (
                    <Card key={r.id} className="shadow-card">
                      <CardContent className="p-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</span>
                            {r.wasteTypeName && <Badge variant="secondary" className="text-xs">{r.wasteTypeName}</Badge>}
                            <Badge variant="default" className="text-xs">Đã nhận</Badge>
                          </div>
                          {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {r.latitude != null ? `${r.latitude.toFixed(5)}, ${r.longitude?.toFixed(5)}` : ""}
                            {r.regionCode ? ` • ${r.regionCode}` : ""}
                            {" • "}{new Date(r.createdTime).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Assigned */}
            <TabsContent value="Assigned">
              <div className="space-y-3">
                {assignedLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="shadow-card"><CardContent className="space-y-2 p-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                  ))
                ) : (assignedData?.items ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Không có yêu cầu nào đang thu gom</p>
                  </div>
                ) : (
                  (assignedData?.items ?? []).map((r: CollectionRequest) => (
                    <Card key={r.id} className="shadow-card">
                      <CardContent className="p-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</span>
                            {r.wasteTypeName && <Badge variant="secondary" className="text-xs">{r.wasteTypeName}</Badge>}
                            <Badge variant="outline" className="text-xs">Đang thu gom</Badge>
                          </div>
                          {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {r.latitude != null ? `${r.latitude.toFixed(5)}, ${r.longitude?.toFixed(5)}` : ""}
                            {r.regionCode ? ` • ${r.regionCode}` : ""}
                            {" • "}{new Date(r.createdTime).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Completed */}
            <TabsContent value="Completed">
              <div className="space-y-3">
                {completedLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="shadow-card"><CardContent className="space-y-2 p-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                  ))
                ) : (completedData?.items ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Chưa có yêu cầu nào hoàn thành</p>
                  </div>
                ) : (
                  (completedData?.items ?? []).map((r: CollectionRequest) => (
                    <Card key={r.id} className="shadow-card">
                      <CardContent className="p-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</span>
                            {r.wasteTypeName && <Badge variant="secondary" className="text-xs">{r.wasteTypeName}</Badge>}
                            <Badge className="text-xs">Hoàn thành</Badge>
                          </div>
                          {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {r.latitude != null ? `${r.latitude.toFixed(5)}, ${r.longitude?.toFixed(5)}` : ""}
                            {r.regionCode ? ` • ${r.regionCode}` : ""}
                            {" • "}{new Date(r.createdTime).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── Tab: Collectors ── */}
        <TabsContent value="collectors">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockCollectors.map((c) => (
              <Card key={c.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <Badge variant={c.status === "online" ? "default" : "secondary"}>
                      {c.status === "online" ? "Sẵn sàng" : "Offline"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <p className="text-xs text-muted-foreground">Đang làm</p>
                      <p className="font-display text-lg font-bold text-foreground">{c.tasks}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <p className="text-xs text-muted-foreground">Hoàn thành</p>
                      <p className="font-display text-lg font-bold text-foreground">{c.completed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Tab: Thống kê ── */}
        <TabsContent value="stats">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <BarChart3 className="h-5 w-5 text-primary" /> Theo loại rác
                </CardTitle>
              </CardHeader>
              <CardContent>
                {[
                  { type: "Nhựa",        amount: "120 kg", pct: 40 },
                  { type: "Giấy/Carton", amount: "90 kg",  pct: 30 },
                  { type: "Kim loại",    amount: "45 kg",  pct: 15 },
                  { type: "Thủy tinh",   amount: "30 kg",  pct: 10 },
                  { type: "Khác",        amount: "15 kg",  pct: 5  },
                ].map((w, i) => (
                  <div key={i} className="mb-3">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">{w.type}</span>
                      <span className="text-muted-foreground">{w.amount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${w.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Clock className="h-5 w-5 text-primary" /> Tổng quan tháng 2/2025
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Tổng yêu cầu",       value: "58"        },
                  { label: "Đã hoàn thành",       value: "48 (82.7%)" },
                  { label: "Tổng khối lượng",     value: "300 kg"    },
                  { label: "Thời gian xử lý TB",  value: "4.2 giờ"   },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between border-b border-border pb-2 last:border-0">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-semibold text-foreground">{s.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════════
            Tab: Cấu hình
        ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="config">
          <div className="grid gap-6 md:grid-cols-2">

            {/* ── Card A: Khu vực phục vụ ── */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <MapPinned className="h-5 w-5 text-primary" /> Khu vực phục vụ
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => { setAreaRegionCode(""); setAreaEditId(null); setAreaDialog("add"); }}
                >
                  <Plus className="mr-1 h-4 w-4" /> Thêm khu vực
                </Button>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã khu vực…"
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã khu vực</TableHead>
                        <TableHead className="hidden sm:table-cell">Ngày thêm</TableHead>
                        <TableHead className="w-[80px] text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areaLoading ? (
                        <SkeletonRows cols={3} />
                      ) : areas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3}>
                            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                              <AlertCircle className="h-8 w-8 opacity-40" />
                              <p className="text-sm">Chưa có khu vực nào</p>
                              <Button
                                size="sm" variant="outline"
                                onClick={() => { setAreaRegionCode(""); setAreaEditId(null); setAreaDialog("add"); }}
                              >
                                <Plus className="mr-1 h-4 w-4" /> Thêm khu vực
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        areas.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">{a.regionCode}</Badge>
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                              {new Date(a.createdTime).toLocaleDateString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon" variant="ghost" className="h-7 w-7"
                                  onClick={() => openEditArea(a.id, a.regionCode)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => deleteArea.mutate(a.id)}
                                  disabled={deleteArea.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {areaData && (
                  <p className="mt-2 text-right text-xs text-muted-foreground">
                    {areaData.totalCount} khu vực
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ── Card B: Năng lực xử lý rác ── */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Recycle className="h-5 w-5 text-primary" /> Loại rác & Công suất
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => { setCapWasteTypeId(""); setCapKg(""); setCapEditId(null); setCapDialog("add"); }}
                >
                  <Plus className="mr-1 h-4 w-4" /> Thêm loại rác
                </Button>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm loại rác…"
                    value={capSearch}
                    onChange={(e) => setCapSearch(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại rác</TableHead>
                        <TableHead>Công suất/ngày</TableHead>
                        <TableHead className="hidden sm:table-cell">Ngày thêm</TableHead>
                        <TableHead className="w-[80px] text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {capLoading ? (
                        <SkeletonRows cols={4} />
                      ) : caps.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                              <AlertCircle className="h-8 w-8 opacity-40" />
                              <p className="text-sm">Chưa cấu hình loại rác nào</p>
                              <Button
                                size="sm" variant="outline"
                                onClick={() => { setCapWasteTypeId(""); setCapKg(""); setCapEditId(null); setCapDialog("add"); }}
                              >
                                <Plus className="mr-1 h-4 w-4" /> Thêm loại rác
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        caps.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{c.wasteTypeName ?? c.wasteTypeId}</Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {c.dailyCapacityKg.toLocaleString("vi-VN")} kg
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                              {new Date(c.createdTime).toLocaleDateString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon" variant="ghost" className="h-7 w-7"
                                  onClick={() => openEditCap(c.id, c.dailyCapacityKg)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => deleteCap.mutate(c.id)}
                                  disabled={deleteCap.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {capData && (
                  <p className="mt-2 text-right text-xs text-muted-foreground">
                    {capData.totalCount} loại rác
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Add/Edit Service Area ── */}
      <Dialog open={!!areaDialog} onOpenChange={(o) => { if (!o) { setAreaDialog(null); setAreaRegionCode(""); setAreaEditId(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{areaDialog === "add" ? "Thêm khu vực phục vụ" : "Sửa khu vực phục vụ"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitArea} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="regionCode">Mã khu vực <span className="text-destructive">*</span></Label>
              <Input
                id="regionCode"
                placeholder="VD: Q1, HCM-01, DISTRICT-3…"
                value={areaRegionCode}
                onChange={(e) => setAreaRegionCode(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Mã định danh khu vực địa lý mà doanh nghiệp phục vụ.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAreaDialog(null)}>Hủy</Button>
              <Button type="submit" disabled={areaSubmitting}>
                {areaSubmitting ? "Đang lưu…" : areaDialog === "add" ? "Thêm" : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Add/Edit Waste Capability ── */}
      <Dialog open={!!capDialog} onOpenChange={(o) => { if (!o) { setCapDialog(null); setCapWasteTypeId(""); setCapKg(""); setCapEditId(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{capDialog === "add" ? "Thêm năng lực xử lý rác" : "Sửa công suất xử lý"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCap} className="space-y-4">
            {capDialog === "add" && (
              <div className="space-y-1.5">
                <Label htmlFor="wasteTypeId">Loại rác <span className="text-destructive">*</span></Label>
                <Select value={capWasteTypeId} onValueChange={setCapWasteTypeId}>
                  <SelectTrigger id="wasteTypeId">
                    <SelectValue placeholder="Chọn loại rác…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeWasteTypes.map((wt) => (
                      <SelectItem key={wt.id} value={wt.id}>{wt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="capacityKg">Công suất / ngày (kg) <span className="text-destructive">*</span></Label>
              <Input
                id="capacityKg"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="VD: 500"
                value={capKg}
                onChange={(e) => setCapKg(e.target.value)}
                autoFocus={capDialog === "edit"}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCapDialog(null)}>Hủy</Button>
              <Button type="submit" disabled={capSubmitting}>
                {capSubmitting ? "Đang lưu…" : capDialog === "add" ? "Thêm" : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EnterpriseDashboard;
