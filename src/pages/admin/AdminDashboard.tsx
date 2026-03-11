import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Users, Package, AlertTriangle, BarChart3, Shield, Ban, CheckCircle, Eye,
  Plus, Pencil, Trash2, Leaf,
} from "lucide-react";
import { toast } from "sonner";
import { enterpriseApprovalService } from "@/services/enterpriseApproval";
import { wasteTypeService, WasteType, WASTE_CATEGORIES } from "@/services/wasteType";

const mockUsers = [
  { id: "1", name: "Nguyễn Văn An", email: "citizen@test.com", role: "citizen", status: "active", reports: 12 },
  { id: "2", name: "Công ty Tái chế Xanh", email: "enterprise@test.com", role: "enterprise", status: "active", reports: 0 },
  { id: "3", name: "Trần Minh Tuấn", email: "collector@test.com", role: "collector", status: "active", reports: 0 },
  { id: "5", name: "Lê Văn C", email: "levanc@email.com", role: "citizen", status: "active", reports: 8 },
  { id: "6", name: "Phạm Thị D", email: "phamthid@email.com", role: "citizen", status: "suspended", reports: 3 },
];

const mockComplaints = [
  { id: "CP-001", citizen: "Nguyễn Văn An", request: "WR-010", reason: "Thu gom trễ hơn cam kết 2 ngày", date: "2025-02-26", status: "pending" },
  { id: "CP-002", citizen: "Lê Văn C", request: "WR-015", reason: "Collector từ chối không có lý do chính đáng", date: "2025-02-25", status: "pending" },
  { id: "CP-003", citizen: "Trần Thị B", request: "WR-008", reason: "Rác không được thu gom hết", date: "2025-02-24", status: "resolved" },
];

const roleLabels: Record<string, string> = {
  citizen: "Công dân",
  enterprise: "Doanh nghiệp",
  collector: "Thu gom",
  admin: "Quản trị",
};

// ─── WasteType Form Dialog ────────────────────────────────────────────────────
interface WasteTypeFormProps {
  open: boolean;
  editing: WasteType | null;
  onClose: () => void;
}

const WasteTypeFormDialog = ({ open, editing, onClose }: WasteTypeFormProps) => {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);

  // Sync form fields mỗi khi dialog mở hoặc editing thay đổi
  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setCategory(String(editing?.category ?? "0"));
      setIsActive(editing?.isActive ?? true);
    }
  }, [open, editing]);

  const createMutation = useMutation({
    mutationFn: () =>
      wasteTypeService.create({ name, description, category: Number(category) }),
    onSuccess: () => {
      toast.success("Đã thêm loại rác thành công");
      qc.invalidateQueries({ queryKey: ["wasteTypes"] });
      onClose();
    },
    onError: () => toast.error("Thêm loại rác thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      wasteTypeService.update(editing!.id, {
        name,
        description,
        category: Number(category),
        isActive,
      }),
    onSuccess: () => {
      toast.success("Đã cập nhật loại rác thành công");
      qc.invalidateQueries({ queryKey: ["wasteTypes"] });
      onClose();
    },
    onError: () => toast.error("Cập nhật loại rác thất bại"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Vui lòng nhập tên loại rác"); return; }
    if (isEdit) updateMutation.mutate();
    else createMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Chỉnh sửa loại rác" : "Thêm loại rác mới"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Tên loại rác *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Chai nhựa PET" />
          </div>
          <div className="space-y-1">
            <Label>Mô tả</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả ngắn về loại rác" />
          </div>
          <div className="space-y-1">
            <Label>Danh mục</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(WASTE_CATEGORIES).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isEdit && (
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <Select value={isActive ? "true" : "false"} onValueChange={v => setIsActive(v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Đang hoạt động</SelectItem>
                  <SelectItem value="false">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const formatDate = (raw?: string | null): string => {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getReviewerName = (id: string): string => {
  // TODO: đổi API nếu có map id -> username. Hiện tạm dùng id để tránh trống.
  return id;
};

const AdminDashboard = () => {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingWasteType, setEditingWasteType] = useState<WasteType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WasteType | null>(null);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const {
    data: enterpriseApprovals,
    isLoading: enterpriseLoading,
    isError: enterpriseError,
  } = useQuery({
    queryKey: ["enterpriseApprovals"],
    queryFn: () => enterpriseApprovalService.getAll({ PageNumber: 1, PageSize: 50 }),
  });

  const approveMutation = useMutation({
    mutationFn: (enterpriseId: string) => enterpriseApprovalService.approve(enterpriseId),
    onSuccess: () => {
      toast.success("Duyệt doanh nghiệp thành công");
      qc.invalidateQueries({ queryKey: ["enterpriseApprovals"] });
    },
    onError: () => toast.error("Duyệt doanh nghiệp thất bại"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ enterpriseId, reason }: { enterpriseId: string; reason: string }) =>
      enterpriseApprovalService.reject(enterpriseId, reason),
    onSuccess: () => {
      toast.success("Từ chối doanh nghiệp thành công");
      qc.invalidateQueries({ queryKey: ["enterpriseApprovals"] });
    },
    onError: () => toast.error("Từ chối doanh nghiệp thất bại"),
  });

  const handleApproveEnterprise = (enterpriseId: string) => {
    approveMutation.mutate(enterpriseId);
  };

  const openRejectDialog = (enterpriseId: string) => {
    setRejectEnterpriseId(enterpriseId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setRejectDialogOpen(false);
    setRejectEnterpriseId(null);
    setRejectReason("");
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    if (!rejectEnterpriseId) return;

    rejectMutation.mutate({ enterpriseId: rejectEnterpriseId, reason: rejectReason.trim() }, {
      onSuccess: () => {
        closeRejectDialog();
      },
      onError: () => {
        // Đã có toast lỗi chung
      }
    });
  };

  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [rejectEnterpriseId, setRejectEnterpriseId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: selectedEnterprise, isLoading: detailLoading, isError: detailError } = useQuery({
    queryKey: ["enterpriseApproval", selectedEnterpriseId],
    queryFn: () => enterpriseApprovalService.getById(selectedEnterpriseId!),
    enabled: !!selectedEnterpriseId,
  });

  const openEnterpriseDetail = (enterpriseId: string) => {
    setSelectedEnterpriseId(enterpriseId);
    setDetailOpen(true);
  };

  const closeEnterpriseDetail = () => {
    setDetailOpen(false);
    setSelectedEnterpriseId(null);
  };

  const { data: wasteTypes = [], isLoading: wtLoading } = useQuery({
    queryKey: ["wasteTypes"],
    queryFn: () => wasteTypeService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => wasteTypeService.delete(id),
    onSuccess: () => {
      toast.success("Đã xóa loại rác");
      qc.invalidateQueries({ queryKey: ["wasteTypes"] });
    },
    onError: () => toast.error("Xóa loại rác thất bại"),
  });

  const handleEdit = (wt: WasteType) => {
    setEditingWasteType(wt);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingWasteType(null);
    setFormOpen(true);
  };

  const handleDelete = (wt: WasteType) => {
    setDeleteTarget(wt);
  };

  const filteredWasteTypes = wasteTypes.filter(wt => {
    const matchKeyword = filterKeyword === "" || wt.name.toLowerCase().includes(filterKeyword.toLowerCase());
    const matchCat = filterCategory === "all" || String(wt.category) === filterCategory;
    return matchKeyword && matchCat;
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Quản trị hệ thống</h1>
        <p className="text-sm text-muted-foreground">Giám sát hoạt động và quản lý người dùng</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Người dùng", value: "1,234", color: "bg-eco-light" },
          { icon: Package, label: "Đơn trong tháng", value: "856", color: "bg-eco-medium" },
          { icon: CheckCircle, label: "Tỷ lệ hoàn thành", value: "87%", color: "bg-eco-teal" },
          { icon: AlertTriangle, label: "Khiếu nại chờ", value: "2", color: "bg-eco-light" },
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

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Quản lý người dùng</TabsTrigger>
          <TabsTrigger value="wastetype">Loại rác</TabsTrigger>
          <TabsTrigger value="complaints">Khiếu nại</TabsTrigger>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        </TabsList>

        {/* ── Users Tab ─────────────────────────────────────── */}
        <TabsContent value="users">
          <Card className="shadow-card mb-4">
            <CardHeader>
              <CardTitle className="font-display text-base">Danh sách doanh nghiệp</CardTitle>
            </CardHeader>
            <CardContent>
              {enterpriseLoading ? (
                <p>Đang tải danh sách doanh nghiệp...</p>
              ) : enterpriseError ? (
                <p className="text-destructive">Không thể tải dữ liệu doanh nghiệp</p>
              ) : (
                <div className="space-y-2">
                  {(enterpriseApprovals?.items?.length ?? 0) === 0 ? (
                    <p>Không có doanh nghiệp.</p>
                  ) : (
                    enterpriseApprovals?.items?.map((item) => (
                      <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">MST: {item.taxCode} · {item.address}</p>
                          <Badge variant={item.approvalStatus === "PendingApproval" ? "outline" : "secondary"}>
                            {item.approvalStatus}
                          </Badge>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Button size="sm" variant="outline" onClick={() => openEnterpriseDetail(item.id)}>
                            Chi tiết
                          </Button>
                          {item.approvalStatus === "PendingApproval" ? (
                            <>
                              <Button size="sm" onClick={() => handleApproveEnterprise(item.id)} disabled={approveMutation.isPending}>
                                {approveMutation.isPending ? "Đang xử lý..." : "Duyệt"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => openRejectDialog(item.id)} disabled={rejectMutation.isPending}>
                                {rejectMutation.isPending ? "Đang xử lý..." : "Từ chối"}
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary">Đã xử lý</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) closeEnterpriseDetail(); }}>
            <DialogContent className="max-w-4xl w-[90vw] md:w-[80vw] lg:w-[70vw]">
              <DialogHeader className="pb-2 border-b border-border">
                <DialogTitle className="font-display">Chi tiết doanh nghiệp</DialogTitle>
              </DialogHeader>

              {detailLoading ? (
                <p>Đang tải chi tiết...</p>
              ) : detailError ? (
                <p className="text-destructive">Lỗi khi lấy chi tiết doanh nghiệp</p>
              ) : selectedEnterprise ? (
                <div className="space-y-4 py-2">
                  <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-lg border border-border p-4 shadow-sm bg-white">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Thông tin chung</h3>
                      <div className="space-y-1 text-sm text-foreground">
                        <p><span className="text-muted-foreground">Tên:</span> {selectedEnterprise.name}</p>
                        <p><span className="text-muted-foreground">MST:</span> {selectedEnterprise.taxCode}</p>
                        <p><span className="text-muted-foreground">Địa chỉ:</span> {selectedEnterprise.address}</p>
                        <p><span className="text-muted-foreground">Giấy phép:</span> {selectedEnterprise.environmentLicenseFileId || "Chưa có"}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4 shadow-sm bg-white">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Trạng thái</h3>
                      <div className="space-y-2 text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Trạng thái phê duyệt:</span>
                          <Badge variant={selectedEnterprise.approvalStatus === "PendingApproval" ? "outline" : "secondary"}>{selectedEnterprise.approvalStatus}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Trạng thái hoạt động:</span>
                          <Badge variant="default">{selectedEnterprise.operationalStatus}</Badge>
                        </div>
                        <p><span className="text-muted-foreground">Người đại diện:</span> {selectedEnterprise.legalRepresentative}</p>
                        <p><span className="text-muted-foreground">Chức vụ:</span> {selectedEnterprise.representativePosition}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4 shadow-sm bg-white">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Thời gian</h3>
                      <div className="space-y-1 text-sm text-foreground">
                        <p><span className="text-muted-foreground">Thời gian nộp:</span> {formatDate(selectedEnterprise.submittedAt)}</p>
                        <p><span className="text-muted-foreground">Thời gian xem:</span> {formatDate(selectedEnterprise.reviewedAt)}</p>
                        <p><span className="text-muted-foreground">Thời gian tạo:</span> {formatDate(selectedEnterprise.createdTime)}</p>
                        <p><span className="text-muted-foreground">Người xét duyệt:</span> {selectedEnterprise.reviewedByUserId ? getReviewerName(selectedEnterprise.reviewedByUserId) : "Chưa có"}</p>
                        <p><span className="text-muted-foreground">Lý do từ chối:</span> {selectedEnterprise.rejectionReason ?? "Không"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4 shadow-sm bg-white">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Tài liệu</h3>
                    {selectedEnterprise.documents && selectedEnterprise.documents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedEnterprise.documents.map((doc) => (
                          <div key={doc.id} className="rounded-md border border-border p-3 bg-slate-50">
                            <p className="font-medium text-sm">{doc.originalFileName}</p>
                            <div className="mt-1 text-xs text-muted-foreground grid gap-1 sm:grid-cols-2">
                              <span>Loại: {doc.documentType}</span>
                              <span>Kích thước: {doc.fileSize.toLocaleString()} bytes</span>
                              <span>Tải lên: {formatDate(doc.uploadedAt)}</span>
                              <span>Trạng thái xóa: {doc.isDeleted ? "Đã xóa" : "Hoạt động"}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer">Xem file</a>
                              </Button>
                              <Button size="sm" variant="secondary" asChild>
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" download>Tải xuống</a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Không có tài liệu.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p>Chưa có dữ liệu</p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={closeEnterpriseDetail}>Đóng</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={rejectDialogOpen} onOpenChange={(open) => { if (!open) closeRejectDialog(); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yêu cầu từ chối doanh nghiệp</DialogTitle>
                <p className="text-sm text-muted-foreground">Nhập lý do từ chối và xác nhận.</p>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Label htmlFor="rejectReason">Lý do</Label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  className="w-full rounded-md border border-border p-2 text-sm leading-relaxed focus:border-primary focus:outline-none"
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeRejectDialog}>Hủy</Button>
                <Button onClick={handleConfirmReject} disabled={rejectMutation.isPending}>Xác nhận</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Danh sách người dùng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockUsers.map(u => (
                  <div key={u.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{u.name}</span>
                        <Badge variant="outline">{roleLabels[u.role]}</Badge>
                        <Badge variant={u.status === "active" ? "default" : "destructive"}>
                          {u.status === "active" ? "Hoạt động" : "Tạm khóa"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toast.info(`Xem chi tiết ${u.name}`)}>
                        <Eye className="mr-1 h-3 w-3" /> Chi tiết
                      </Button>
                      {u.status === "active" ? (
                        <Button size="sm" variant="outline" onClick={() => toast.warning(`Đã khóa tài khoản ${u.name}`)}>
                          <Ban className="mr-1 h-3 w-3" /> Khóa
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => toast.success(`Đã mở khóa ${u.name}`)}>
                          <CheckCircle className="mr-1 h-3 w-3" /> Mở khóa
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WasteType Tab ──────────────────────────────────── */}
        <TabsContent value="wastetype">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Leaf className="h-5 w-5 text-primary" /> Quản lý loại rác
                </CardTitle>
                <Button size="sm" onClick={handleAddNew}>
                  <Plus className="mr-1 h-4 w-4" /> Thêm loại rác
                </Button>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Tìm theo tên..."
                  value={filterKeyword}
                  onChange={e => setFilterKeyword(e.target.value)}
                  className="sm:max-w-xs"
                />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="sm:max-w-[160px]">
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {Object.entries(WASTE_CATEGORIES).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {wtLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Đang tải...</p>
              ) : filteredWasteTypes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Không có loại rác nào</p>
              ) : (
                <div className="space-y-2">
                  {filteredWasteTypes.map(wt => (
                    <div
                      key={wt.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{wt.name}</span>
                          {wt.category !== undefined && (
                            <Badge variant="outline">{WASTE_CATEGORIES[wt.category] ?? "Khác"}</Badge>
                          )}
                          <Badge variant={wt.isActive !== false ? "default" : "secondary"}>
                            {wt.isActive !== false ? "Hoạt động" : "Ngừng"}
                          </Badge>
                        </div>
                        {wt.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{wt.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(wt)}>
                          <Pencil className="mr-1 h-3 w-3" /> Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(wt)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Complaints Tab ─────────────────────────────────── */}
        <TabsContent value="complaints">
          <div className="space-y-3">
            {mockComplaints.map(c => (
              <Card key={c.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{c.id}</span>
                        <Badge variant={c.status === "pending" ? "secondary" : "default"}>
                          {c.status === "pending" ? "Chờ xử lý" : "Đã giải quyết"}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{c.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        Người gửi: {c.citizen} • Đơn: {c.request} • {c.date}
                      </p>
                    </div>
                    {c.status === "pending" && (
                      <Button size="sm" onClick={() => toast.success(`Đã giải quyết khiếu nại ${c.id}`)}>
                        <Shield className="mr-1 h-4 w-4" /> Giải quyết
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Overview Tab ───────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <BarChart3 className="h-5 w-5 text-primary" /> Theo khu vực
                </CardTitle>
              </CardHeader>
              <CardContent>
                {[
                  { area: "Quận 1", requests: 156, pct: 100 },
                  { area: "Quận 3", requests: 120, pct: 77 },
                  { area: "Quận 7", requests: 98, pct: 63 },
                  { area: "Quận Bình Thạnh", requests: 85, pct: 54 },
                  { area: "Quận Phú Nhuận", requests: 72, pct: 46 },
                ].map((a, i) => (
                  <div key={i} className="mb-3">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">{a.area}</span>
                      <span className="text-muted-foreground">{a.requests} đơn</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${a.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Users className="h-5 w-5 text-primary" /> Phân bố người dùng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { role: "Công dân", count: 1089, icon: "👤" },
                  { role: "Doanh nghiệp tái chế", count: 23, icon: "🏭" },
                  { role: "Người thu gom", count: 118, icon: "🚛" },
                  { role: "Quản trị viên", count: 4, icon: "🛡️" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <span className="text-sm text-foreground">{r.icon} {r.role}</span>
                    <span className="font-display text-sm font-bold text-foreground">{r.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* WasteType Form Dialog */}
      <WasteTypeFormDialog
        open={formOpen}
        editing={editingWasteType}
        onClose={() => setFormOpen(false)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa loại rác <span className="font-semibold">"{deleteTarget?.name}"</span> không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminDashboard;
