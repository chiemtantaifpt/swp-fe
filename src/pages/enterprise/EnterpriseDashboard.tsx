import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import EnterpriseProfileSetup from "./EnterpriseProfileSetup";
import EnterprisePendingApproval from "./EnterprisePendingApproval";
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
  MapPinned, Recycle, AlertCircle, Eye, EyeOff, Image as ImageIcon, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { serviceAreaService, wasteCapabilityService, recyclingEnterpriseService, districtService, wardService } from "@/services/enterpriseConfig";
import { wasteTypeService } from "@/services/wasteType";
import { collectionRequestService, collectorAssignmentService, CollectionRequest, collectorService, Collector, collectorProofService, CollectorProof } from "@/services/collectionRequest";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── RequestCard (shared) ─────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, React.ReactNode> = {
  Offered:   <Badge className="text-xs">Chờ phản hồi</Badge>,
  Accepted:  <Badge variant="default" className="text-xs">Đã nhận</Badge>,
  Assigned:  <Badge variant="outline" className="text-xs">Đang thu gom</Badge>,
  Completed: <Badge className="bg-green-600 text-xs text-white hover:bg-green-700">Hoàn thành</Badge>,
  Rejected:  <Badge variant="destructive" className="text-xs">Đã từ chối</Badge>,
};

// ─── ProofCard ───────────────────────────────────────────────────────────────
const PROOF_STATUS_BADGE: Record<string, React.ReactNode> = {
  Pending:  <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">Chờ duyệt</Badge>,
  Approved: <Badge className="bg-green-600 text-xs text-white hover:bg-green-700">Đã duyệt</Badge>,
  Rejected: <Badge variant="destructive" className="text-xs">Từ chối</Badge>,
};

const ProofCard = ({
  p,
  onView,
}: {
  p: CollectorProof;
  onView: (p: CollectorProof) => void;
}) => (
  <Card
    className="shadow-card cursor-pointer transition-shadow hover:shadow-md"
    onClick={() => onView(p)}
  >
    <CardContent className="p-4">
      <div className="flex gap-3">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt="Proof"
            className="h-20 w-20 shrink-0 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{p.assignmentId.slice(0, 8)}…</span>
            {p.wasteTypeName && <Badge variant="secondary" className="text-xs">{p.wasteTypeName}</Badge>}
            {PROOF_STATUS_BADGE[p.reviewStatus]}
          </div>
          {p.note && <p className="line-clamp-1 text-sm text-muted-foreground">{p.note}</p>}
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {p.regionCode ?? "—"}
            {p.collectedAt ? ` • ${new Date(p.collectedAt).toLocaleDateString("vi-VN")}` : ""}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 self-center text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); onView(p); }}
        >
          <Eye className="mr-1 h-4 w-4" /> Xem
        </Button>
      </div>
    </CardContent>
  </Card>
);

// ─── RequestCard ──────────────────────────────────────────────────────────────
const RequestCard = ({
  r,
  onView,
}: {
  r: CollectionRequest;
  onView: (r: CollectionRequest) => void;
}) => (
  <Card
    key={r.id}
    className="shadow-card cursor-pointer transition-shadow hover:shadow-md"
    onClick={() => onView(r)}
  >
    <CardContent className="p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</span>
            {r.wasteTypeName && <Badge variant="secondary" className="text-xs">{r.wasteTypeName}</Badge>}
            {STATUS_BADGE[r.status]}
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
        <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); onView(r); }}>
          <Eye className="mr-1 h-4 w-4" /> Chi tiết
        </Button>
      </div>
    </CardContent>
  </Card>
);

// ═══════════════════════════════════════════════════════════════════════════════
const EnterpriseDashboard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ── check if enterprise profile exists ──────────────────────────────────────
  const { data: myProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["enterpriseProfile"],
    queryFn: () => recyclingEnterpriseService.getProfile(),
    enabled: !!user?.id,
    retry: false,
  });

  // ── resolve enterpriseId from profile (already fetched above) ──
  const enterpriseId = myProfile?.id ?? "";

  // ── collection request detail dialog ──
  const [selectedRequest, setSelectedRequest] = useState<CollectionRequest | null>(null);
  const [rejectReason, setRejectReason]       = useState("");
  const [rejectDialogId, setRejectDialogId]   = useState<string | null>(null);

  // ── inner tab state for requests ──
  const [reqStatusTab, setReqStatusTab] = useState<"Offered" | "Accepted" | "Assigned" | "Completed">("Offered");

  // ── proof review state ──
  const [proofReviewTab, setProofReviewTab] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  const [selectedProof, setSelectedProof] = useState<CollectorProof | null>(null);
  const [reviewNote, setReviewNote] = useState("");

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

  // ── collector proof queries (enterprise) ──
  const { data: pendingProofsData,  isLoading: pendingProofsLoading  } = useQuery({
    queryKey: ["collectorProofs", "Pending"],
    queryFn:  () => collectorProofService.getForEnterprise({ reviewStatus: "Pending",  pageSize: 50 }),
  });
  const { data: approvedProofsData, isLoading: approvedProofsLoading } = useQuery({
    queryKey: ["collectorProofs", "Approved"],
    queryFn:  () => collectorProofService.getForEnterprise({ reviewStatus: "Approved", pageSize: 50 }),
  });
  const { data: rejectedProofsData, isLoading: rejectedProofsLoading } = useQuery({
    queryKey: ["collectorProofs", "Rejected"],
    queryFn:  () => collectorProofService.getForEnterprise({ reviewStatus: "Rejected", pageSize: 50 }),
  });
  const pendingProofsCount = pendingProofsData?.totalCount ?? 0;

  // ── collection request mutations ──
  const acceptReq = useMutation({
    mutationFn: (id: string) => collectionRequestService.accept(id),
    onSuccess: () => {
      toast.success("Đã tiếp nhận yêu cầu");
      setSelectedRequest(null);
      qc.invalidateQueries({ queryKey: ["collectionRequests"] });
    },
    onError: () => toast.error("Tiếp nhận thất bại"),
  });
  const rejectReq = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      collectionRequestService.reject(id, reason),
    onSuccess: () => {
      toast.success("Đã từ chối yêu cầu");
      setSelectedRequest(null); setRejectDialogId(null); setRejectReason("");
      qc.invalidateQueries({ queryKey: ["collectionRequests"] });
    },
    onError: (err: unknown) => {
      let msg = "Từ chối thất bại";
      if (err && typeof err === "object" && err !== null) {
        const errObj = err as { response?: { data?: { message?: string } }; message?: string };
        msg = errObj.response?.data?.message || errObj.message || msg;
      }
      toast.error(msg);
    },
  });

  // ── assign collector state ──
  const [assignCollectorId, setAssignCollectorId] = useState("");

  const assignCollector = useMutation({
    mutationFn: ({ requestId, collectorId }: { requestId: string; collectorId: string }) =>
      collectorAssignmentService.create(requestId, collectorId),
    onSuccess: () => {
      toast.success("Đã gán collector thành công");
      setSelectedRequest(null);
      setAssignCollectorId("");
      qc.invalidateQueries({ queryKey: ["collectionRequests"] });
    },
    onError: () => toast.error("Gán collector thất bại"),
  });

  // ── review proof mutation ──
  const reviewProof = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: "Approved" | "Rejected"; note: string }) =>
      collectorProofService.review(id, status, note),
    onSuccess: (_, variables) => {
      toast.success(variables.status === "Approved" ? "Đã duyệt proof thành công" : "Đã từ chối proof");
      setSelectedProof(null);
      setReviewNote("");
      qc.invalidateQueries({ queryKey: ["collectorProofs"] });
      // Approving a proof marks the request as Completed, so refresh requests too
      qc.invalidateQueries({ queryKey: ["collectionRequests"] });
    },
    onError: () => toast.error("Thao tác thất bại, vui lòng thử lại"),
  });

  // ── collector state ──
  const [collectorDialog, setCollectorDialog] = useState(false);
  const [colEmail, setColEmail]               = useState("");
  const [colPassword, setColPassword]         = useState("");
  const [colFullName, setColFullName]         = useState("");
  const [showColPassword, setShowColPassword] = useState(false);

  // ── service area state ──
  const [areaSearch, setAreaSearch]           = useState("");
  const [areaDialog, setAreaDialog]           = useState<"add" | null>(null);
  const [areaDistrictId, setAreaDistrictId]   = useState("");
  const [areaWardId, setAreaWardId]           = useState("");

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

  // District + Ward for area dialog
  const { data: districtsData } = useQuery({
    queryKey: ["districts"],
    queryFn: () => districtService.getAll({ PageSize: 100 }),
    enabled: !!areaDialog,
  });
  const districts = districtsData?.items ?? [];

  const { data: wardsData } = useQuery({
    queryKey: ["wards", areaDistrictId],
    queryFn: () => wardService.getAll({ DistrictId: areaDistrictId, PageSize: 100 }),
    enabled: !!areaDistrictId,
  });
  const wards = wardsData?.items ?? [];

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

  // ── collector query & mutation ──
  const { data: collectors = [], isLoading: collectorsLoading } = useQuery({
    queryKey: ["myCollectors"],
    queryFn: () => collectorService.getMyCollectors(),
  });

  const createCollector = useMutation({
    mutationFn: () => collectorService.create({ email: colEmail.trim(), password: colPassword, fullName: colFullName.trim() }),
    onSuccess: () => {
      toast.success("Đã tạo collector thành công");
      setCollectorDialog(false); setColEmail(""); setColPassword(""); setColFullName("");
      qc.invalidateQueries({ queryKey: ["myCollectors"] });
    },
    onError: () => toast.error("Tạo collector thất bại"),
  });

  const submitCollector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colFullName.trim()) { toast.error("Vui lòng nhập họ tên"); return; }
    if (!colEmail.trim()) { toast.error("Vui lòng nhập email"); return; }
    if (colPassword.length < 6) { toast.error("Mật khẩu phải tối thiểu 6 ký tự"); return; }
    createCollector.mutate();
  };

  // ─── area mutations ──────────────────────────────────────────────────────────
  const createArea = useMutation({
    mutationFn: () => serviceAreaService.create({ districtId: areaDistrictId, wardId: areaWardId }),
    onSuccess: () => {
      toast.success("Đã thêm khu vực phục vụ");
      setAreaDialog(null); setAreaDistrictId(""); setAreaWardId("");
      qc.invalidateQueries({ queryKey: ["serviceAreas"] });
    },
    onError: () => toast.error("Thêm khu vực thất bại"),
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
  const areas = (areaData?.items ?? []).filter((a) => {
    const district = a.districtName ?? "";
    const ward = a.wardName ?? "";
    return (
      district.toLowerCase().includes(areaSearch.toLowerCase()) ||
      ward.toLowerCase().includes(areaSearch.toLowerCase())
    );
  });
  const caps = (capData?.items ?? []).filter((c) =>
    (c.wasteTypeName ?? "").toLowerCase().includes(capSearch.toLowerCase())
  );

  // ─── open edit dialogs ───────────────────────────────────────────────────────

  const openEditCap = (id: string, kg: number) => {
    setCapEditId(id); setCapKg(String(kg)); setCapDialog("edit");
  };

  // ─── submit handlers ─────────────────────────────────────────────────────────
  const submitArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaDistrictId) { toast.error("Vui lòng chọn quận/huyện"); return; }
    if (!areaWardId) { toast.error("Vui lòng chọn phường/xã"); return; }
    createArea.mutate();
  };
  const submitCap = (e: React.FormEvent) => {
    e.preventDefault();
    if (capDialog === "add" && !capWasteTypeId) { toast.error("Vui lòng chọn loại rác"); return; }
    if (!capKg || isNaN(parseFloat(capKg)) || parseFloat(capKg) <= 0) {
      toast.error("Vui lòng nhập công suất hợp lệ"); return;
    }
    if (capDialog === "add") {
      createCap.mutate();
    } else {
      updateCap.mutate();
    }
  };

  const areaSubmitting  = createArea.isPending;
  const capSubmitting   = createCap.isPending  || updateCap.isPending;

  // ════════════════════════════════════════════════════════════════════════════
  // Guard: show setup page if profile not yet created
  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!myProfile) {
    return <EnterpriseProfileSetup />;
  }

  if (myProfile.approvalStatus !== "Approved") {
    return <EnterprisePendingApproval profile={myProfile} />;
  }

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
          <TabsTrigger value="complaints">Khiếu nại</TabsTrigger>
          <TabsTrigger value="proofs" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Duyệt Proof
            {pendingProofsCount > 0 && (
              <Badge className="h-5 min-w-5 bg-destructive px-1 text-xs">{pendingProofsCount}</Badge>
            )}
          </TabsTrigger>
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
                    <RequestCard key={r.id} r={r} onView={setSelectedRequest} />
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
                    <RequestCard key={r.id} r={r} onView={setSelectedRequest} />
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
                    <RequestCard key={r.id} r={r} onView={setSelectedRequest} />
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
                    <RequestCard key={r.id} r={r} onView={setSelectedRequest} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="complaints">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <AlertCircle className="h-5 w-5 text-amber-600" /> Luồng khiếu nại doanh nghiệp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-foreground">
                Frontend đã bổ sung complaint flow cho Citizen và Admin. Riêng bước doanh nghiệp phản hồi dispute hiện chưa thể gọi API thật vì backend chưa có endpoint enterprise-specific để:
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p>- Lấy danh sách complaint liên quan đến doanh nghiệp hiện tại.</p>
                <p>- Gửi nội dung phản hồi dispute từ doanh nghiệp.</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                Hiện swagger chỉ có các endpoint complaint cho `Citizen` và `Admin`: tạo complaint, danh sách của tôi, danh sách admin, chi tiết và cập nhật status.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ Tab: Duyệt Proof ══ */}
        <TabsContent value="proofs">
          <Tabs value={proofReviewTab} onValueChange={(v) => setProofReviewTab(v as typeof proofReviewTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="Pending" className="gap-1.5">
                Chờ duyệt
                {pendingProofsCount > 0 && (
                  <Badge className="h-5 min-w-5 px-1 text-xs">{pendingProofsCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="Approved">Đã duyệt</TabsTrigger>
              <TabsTrigger value="Rejected">Từ chối</TabsTrigger>
            </TabsList>

            {/* Pending proofs */}
            <TabsContent value="Pending">
              <div className="space-y-3">
                {pendingProofsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="shadow-card">
                      <CardContent className="flex gap-3 p-4">
                        <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-2 py-1">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (pendingProofsData?.items ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Không có proof nào chờ duyệt</p>
                  </div>
                ) : (
                  (pendingProofsData?.items ?? []).map((p: CollectorProof) => (
                    <ProofCard key={p.id} p={p} onView={setSelectedProof} />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Approved proofs */}
            <TabsContent value="Approved">
              <div className="space-y-3">
                {approvedProofsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="shadow-card">
                      <CardContent className="flex gap-3 p-4">
                        <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-2 py-1">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (approvedProofsData?.items ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Chưa có proof nào được duyệt</p>
                  </div>
                ) : (
                  (approvedProofsData?.items ?? []).map((p: CollectorProof) => (
                    <ProofCard key={p.id} p={p} onView={setSelectedProof} />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Rejected proofs */}
            <TabsContent value="Rejected">
              <div className="space-y-3">
                {rejectedProofsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="shadow-card">
                      <CardContent className="flex gap-3 p-4">
                        <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
                        <div className="flex-1 space-y-2 py-1">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (rejectedProofsData?.items ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 opacity-40" />
                    <p className="text-sm">Chưa có proof nào bị từ chối</p>
                  </div>
                ) : (
                  (rejectedProofsData?.items ?? []).map((p: CollectorProof) => (
                    <ProofCard key={p.id} p={p} onView={setSelectedProof} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── Tab: Collectors ── */}
        <TabsContent value="collectors">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{collectors.length} collector</p>
            <Button size="sm" onClick={() => setCollectorDialog(true)}>
              <Plus className="mr-1 h-4 w-4" /> Thêm collector
            </Button>
          </div>

          {collectorsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="shadow-card">
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : collectors.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <AlertCircle className="h-10 w-10 opacity-40" />
              <p className="text-sm">Chưa có collector nào</p>
              <Button size="sm" variant="outline" onClick={() => setCollectorDialog(true)}>
                <Plus className="mr-1 h-4 w-4" /> Thêm collector
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collectors.map((c: Collector) => (
                <Card key={c.userId} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{c.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                      </div>
                      <Badge variant={c.isActive ? "default" : "secondary"} className="shrink-0 text-xs">
                        {c.isActive ? "Hoạt động" : "Khóa"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {c.isProfileCompleted ? (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">Hồ sơ đầy đủ</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Chưa hoàn thiện hồ sơ</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                  onClick={() => { setAreaDistrictId(""); setAreaWardId(""); setAreaDialog("add"); }}
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
                        <TableHead>Quận/Huyện</TableHead>
                        <TableHead>Phường/Xã</TableHead>
                        <TableHead className="hidden sm:table-cell">Ngày thêm</TableHead>
                        <TableHead className="w-[60px] text-right">Thao tác</TableHead>
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
                                onClick={() => { setAreaDistrictId(""); setAreaWardId(""); setAreaDialog("add"); }}
                              >
                                <Plus className="mr-1 h-4 w-4" /> Thêm khu vực
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        areas.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="text-sm font-medium">
                              {a.districtName ?? a.regionCode ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {a.wardName ?? "—"}
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                              {new Date(a.createdTime).toLocaleDateString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
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

      {/* ══ Dialog: Collection Request Detail ══ */}
      <Dialog open={!!selectedRequest} onOpenChange={(o) => { if (!o) setSelectedRequest(null); }}>
        {selectedRequest && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Chi tiết yêu cầu thu gom
                {STATUS_BADGE[selectedRequest.status]}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              {/* Info rows */}
              <div className="space-y-2 rounded-lg border p-3">
                {[
                  { label: "Mã yêu cầu",  value: selectedRequest.id },
                  { label: "Loại rác",     value: selectedRequest.wasteTypeName ?? "—" },
                  { label: "Độ ưu tiên",   value: String(selectedRequest.priorityScore) },
                  { label: "Mã khu vực",   value: selectedRequest.regionCode ?? "—" },
                  { label: "Toạ độ",       value: selectedRequest.latitude != null ? `${selectedRequest.latitude.toFixed(6)}, ${selectedRequest.longitude?.toFixed(6)}` : "—" },
                  { label: "Ngày tạo",     value: new Date(selectedRequest.createdTime).toLocaleString("vi-VN") },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="max-w-[60%] break-all text-right font-medium text-foreground">{value}</span>
                  </div>
                ))}
                {selectedRequest.note && (
                  <div className="flex justify-between gap-4 border-t pt-2">
                    <span className="text-muted-foreground">Ghi chú</span>
                    <span className="max-w-[60%] text-right text-foreground">{selectedRequest.note}</span>
                  </div>
                )}
                {selectedRequest.rejectReasonName && (
                  <div className="flex justify-between gap-4 border-t pt-2">
                    <span className="text-muted-foreground">Lý do từ chối</span>
                    <span className="max-w-[60%] text-right text-destructive font-medium">{selectedRequest.rejectReasonName}</span>
                  </div>
                )}
                {selectedRequest.rejectNote && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Ghi chú từ chối</span>
                    <span className="max-w-[60%] text-right text-foreground">{selectedRequest.rejectNote}</span>
                  </div>
                )}
              </div>

              {/* Images */}
              {(selectedRequest.imageUrls ?? []).length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <ImageIcon className="h-4 w-4 text-primary" /> Hình ảnh
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(selectedRequest.imageUrls ?? []).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt={`Ảnh ${i + 1}`}
                          className="h-36 w-full rounded-lg border object-cover transition-opacity hover:opacity-80"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions — only for Accepted: assign collector */}
            {selectedRequest.status === "Accepted" && (
              <div className="space-y-2">
                <Label>Gán Collector</Label>
                <div className="flex gap-2">
                  <Select value={assignCollectorId} onValueChange={setAssignCollectorId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Chọn collector…" />
                    </SelectTrigger>
                    <SelectContent>
                      {collectors.filter((c: Collector) => c.isActive).map((c: Collector) => (
                        <SelectItem key={c.userId} value={c.userId}>
                          {c.fullName} — {c.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!assignCollectorId || assignCollector.isPending}
                    onClick={() => assignCollector.mutate({ requestId: selectedRequest.id, collectorId: assignCollectorId })}
                  >
                    <Truck className="mr-1 h-4 w-4" />
                    {assignCollector.isPending ? "Đang gán…" : "Gán"}
                  </Button>
                </div>
              </div>
            )}

            {/* Actions — only for Offered */}
            {selectedRequest.status === "Offered" && (
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive"
                  disabled={rejectReq.isPending}
                  onClick={() => { setRejectDialogId(selectedRequest.id); setRejectReason(""); }}
                >
                  <XCircle className="mr-1 h-4 w-4" /> Từ chối
                </Button>
                <Button
                  className="flex-1"
                  disabled={acceptReq.isPending}
                  onClick={() => acceptReq.mutate(selectedRequest.id)}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {acceptReq.isPending ? "Đang xử lý…" : "Tiếp nhận"}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* ══ Dialog: Reject Reason ══ */}
      <Dialog open={!!rejectDialogId} onOpenChange={(o) => { if (!o) { setRejectDialogId(null); setRejectReason(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Lý do từ chối</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rejectReason">Lý do <span className="text-destructive">*</span></Label>
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger id="rejectReason" className="w-full">
                <SelectValue placeholder="Chọn lý do từ chối…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CapacityFull">Capacity Full</SelectItem>
                <SelectItem value="OutOfServiceArea">Out of Service Area</SelectItem>
                <SelectItem value="WrongWasteType">Wrong Waste Type</SelectItem>
                <SelectItem value="ImageNotClear">Image Not Clear</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogId(null); setRejectReason(""); }}>Hủy</Button>
            <Button
              variant="destructive"
              disabled={rejectReq.isPending || !rejectReason}
              onClick={() => {
                if (!rejectReason) {
                  toast.error("Vui lòng chọn lý do từ chối");
                  return;
                }
                rejectReq.mutate({ id: rejectDialogId!, reason: rejectReason });
              }}
            >
              {rejectReq.isPending ? "Đang xử lý…" : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Add Service Area ── */}
      <Dialog open={!!areaDialog} onOpenChange={(o) => { if (!o) { setAreaDialog(null); setAreaDistrictId(""); setAreaWardId(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Thêm khu vực phục vụ</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitArea} className="space-y-4">
            {/* District */}
            <div className="space-y-1.5">
              <Label htmlFor="districtId">Quận / Huyện <span className="text-destructive">*</span></Label>
              <Select
                value={areaDistrictId}
                onValueChange={(v) => { setAreaDistrictId(v); setAreaWardId(""); }}
              >
                <SelectTrigger id="districtId">
                  <SelectValue placeholder="Chọn quận/huyện…" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ward — only enabled after district selected */}
            <div className="space-y-1.5">
              <Label htmlFor="wardId">Phường / Xã <span className="text-destructive">*</span></Label>
              <Select
                value={areaWardId}
                onValueChange={setAreaWardId}
                disabled={!areaDistrictId}
              >
                <SelectTrigger id="wardId">
                  <SelectValue placeholder={areaDistrictId ? "Chọn phường/xã…" : "Chọn quận/huyện trước"} />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAreaDialog(null)}>Hủy</Button>
              <Button type="submit" disabled={areaSubmitting}>
                {areaSubmitting ? "Đang lưu…" : "Thêm"}
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
      {/* ── Dialog: Create Collector ── */}
      <Dialog open={collectorDialog} onOpenChange={(o) => { if (!o) { setCollectorDialog(false); setColEmail(""); setColPassword(""); setColFullName(""); setShowColPassword(false); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Thêm collector</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCollector} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="colFullName">Họ tên <span className="text-destructive">*</span></Label>
              <Input
                id="colFullName"
                placeholder="Nguyễn Văn A"
                value={colFullName}
                onChange={(e) => setColFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="colEmail">Email <span className="text-destructive">*</span></Label>
              <Input
                id="colEmail"
                type="email"
                placeholder="collector@example.com"
                value={colEmail}
                onChange={(e) => setColEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="colPassword">Mật khẩu <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="colPassword"
                  type={showColPassword ? "text" : "password"}
                  placeholder="Tối thiểu 6 ký tự (gồm in hoa, thường, số và ký tự đặc biệt)"
                  value={colPassword}
                  onChange={(e) => setColPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowColPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showColPassword ? "?n m?t kh?u" : "Hi?n m?t kh?u"}
                >
                  {showColPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCollectorDialog(false)}>Hủy</Button>
              <Button type="submit" disabled={createCollector.isPending}>
                {createCollector.isPending ? "Đang tạo…" : "Tạo collector"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* ══ Dialog: Proof Detail / Review ══ */}
      <Dialog open={!!selectedProof} onOpenChange={(o) => { if (!o) { setSelectedProof(null); setReviewNote(""); } }}>
        {selectedProof && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Bằng chứng thu gom
                {PROOF_STATUS_BADGE[selectedProof.reviewStatus]}
              </DialogTitle>
            </DialogHeader>

            {/* Proof image */}
            {selectedProof.imageUrl ? (
              <a href={selectedProof.imageUrl} target="_blank" rel="noreferrer" className="block">
                <img
                  src={selectedProof.imageUrl}
                  alt="Proof"
                  className="max-h-72 w-full rounded-lg border object-cover transition-opacity hover:opacity-90"
                />
              </a>
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded-lg border bg-muted">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}

            {/* Details */}
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              {[
                { label: "Mã giao việc",      value: selectedProof.assignmentId },
                { label: "Loại rác",           value: selectedProof.wasteTypeName ?? "—" },
                { label: "Khu vực",            value: selectedProof.regionCode ?? "—" },
                { label: "Thời gian thu gom",  value: selectedProof.collectedAt ? new Date(selectedProof.collectedAt).toLocaleString("vi-VN") : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="max-w-[60%] break-all text-right font-medium text-foreground">{value}</span>
                </div>
              ))}
              {selectedProof.note && (
                <div className="flex justify-between gap-4 border-t pt-2">
                  <span className="text-muted-foreground">Ghi chú collector</span>
                  <span className="max-w-[60%] text-right text-foreground">{selectedProof.note}</span>
                </div>
              )}
              {selectedProof.reviewNote && selectedProof.reviewStatus !== "Pending" && (
                <div className="flex justify-between gap-4 border-t pt-2">
                  <span className="text-muted-foreground">Nhận xét duyệt</span>
                  <span className={`max-w-[60%] text-right font-medium ${selectedProof.reviewStatus === "Rejected" ? "text-destructive" : "text-green-600"}`}>
                    {selectedProof.reviewNote}
                  </span>
                </div>
              )}
            </div>

            {/* Review actions — only available when Pending */}
            {selectedProof.reviewStatus === "Pending" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reviewNote">Nhận xét (tuỳ chọn)</Label>
                  <textarea
                    id="reviewNote"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Nhập nhận xét hoặc lý do từ chối…"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    disabled={reviewProof.isPending}
                    onClick={() => reviewProof.mutate({ id: selectedProof.id, status: "Rejected", note: reviewNote })}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    {reviewProof.isPending ? "Đang xử lý…" : "Từ chối"}
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={reviewProof.isPending}
                    onClick={() => reviewProof.mutate({ id: selectedProof.id, status: "Approved", note: reviewNote })}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    {reviewProof.isPending ? "Đang xử lý…" : "Duyệt"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </DashboardLayout>
  );
};

export default EnterpriseDashboard;
