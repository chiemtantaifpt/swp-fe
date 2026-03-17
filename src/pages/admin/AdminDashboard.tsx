import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { complaintService } from "@/services/complaint";
import { disputeResolutionService } from "@/services/disputeResolution";
import { pointRuleService, PointRule } from "@/services/pointRule";
import {
  createDistrictThenWard,
  districtService,
  wardService,
} from "@/services/enterpriseConfig";

const mockUsers = [
  { id: "1", name: "Nguyễn Văn An", email: "citizen@test.com", role: "citizen", status: "active", reports: 12 },
  { id: "2", name: "Công ty Tái chế Xanh", email: "enterprise@test.com", role: "enterprise", status: "active", reports: 0 },
  { id: "3", name: "Trần Minh Tuấn", email: "collector@test.com", role: "collector", status: "active", reports: 0 },
  { id: "5", name: "Lê Văn C", email: "levanc@email.com", role: "citizen", status: "active", reports: 8 },
  { id: "6", name: "Phạm Thị D", email: "phamthid@email.com", role: "citizen", status: "suspended", reports: 3 },
];

const roleLabels: Record<string, string> = {
  citizen: "Công dân",
  enterprise: "Doanh nghiệp",
  collector: "Thu gom",
  admin: "Quản trị",
};

const complaintStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Open: { label: "Mở", variant: "secondary" },
  InReview: { label: "Đang xem xét", variant: "outline" },
  Resolved: { label: "Đã giải quyết", variant: "default" },
  Rejected: { label: "Từ chối", variant: "destructive" },
};

// ─── WasteType Form Dialog ────────────────────────────────────────────────────
interface WasteTypeFormProps {
  open: boolean;
  editing: WasteType | null;
  onClose: () => void;
}

interface PointRuleFormProps {
  open: boolean;
  editing: PointRule | null;
  wasteTypes: WasteType[];
  existingWasteTypeIds: string[];
  presetWasteTypeId?: string;
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

const PointRuleFormDialog = ({
  open,
  editing,
  wasteTypes,
  existingWasteTypeIds,
  presetWasteTypeId,
  onClose,
}: PointRuleFormProps) => {
  const qc = useQueryClient();
  const isEdit = !!editing;
  const [wasteTypeId, setWasteTypeId] = useState("");
  const [basePoint, setBasePoint] = useState("0");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      setWasteTypeId(editing?.wasteTypeId ?? presetWasteTypeId ?? "");
      setBasePoint(String(editing?.basePoint ?? 0));
      setIsActive(editing?.isActive ?? true);
    }
  }, [open, editing, presetWasteTypeId]);

  const availableWasteTypes = wasteTypes.filter((wt) =>
    isEdit ? wt.id === editing?.wasteTypeId || !existingWasteTypeIds.includes(wt.id) : !existingWasteTypeIds.includes(wt.id)
  );

  const createMutation = useMutation({
    mutationFn: () =>
      pointRuleService.create({
        wasteTypeId,
        basePoint: Number(basePoint),
      }),
    onSuccess: () => {
      toast.success("Đã tạo point rule thành công");
      qc.invalidateQueries({ queryKey: ["pointRules"] });
      onClose();
    },
    onError: () => toast.error("Tạo point rule thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      pointRuleService.update(editing!.wasteTypeId, {
        basePoint: Number(basePoint),
        isActive,
      }),
    onSuccess: () => {
      toast.success("Đã cập nhật point rule thành công");
      qc.invalidateQueries({ queryKey: ["pointRules"] });
      onClose();
    },
    onError: () => toast.error("Cập nhật point rule thất bại"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !wasteTypeId) {
      toast.error("Vui lòng chọn loại rác");
      return;
    }
    if (basePoint.trim() === "" || Number.isNaN(Number(basePoint))) {
      toast.error("Vui lòng nhập số điểm hợp lệ");
      return;
    }
    if (Number(basePoint) < 0) {
      toast.error("Điểm cơ bản không được âm");
      return;
    }
    if (isEdit) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Cập nhật point rule" : "Thêm point rule"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="pointRuleWasteType">Loại rác</Label>
            <Select value={wasteTypeId} onValueChange={setWasteTypeId} disabled={isEdit}>
              <SelectTrigger id="pointRuleWasteType">
                <SelectValue placeholder="Chọn loại rác" />
              </SelectTrigger>
              <SelectContent>
                {availableWasteTypes.map((wt) => (
                  <SelectItem key={wt.id} value={wt.id}>
                    {wt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="basePoint">Điểm cơ bản</Label>
            <Input
              id="basePoint"
              type="number"
              min="0"
              step="1"
              value={basePoint}
              onChange={(e) => setBasePoint(e.target.value)}
              placeholder="VD: 10"
            />
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="pointRuleStatus">Trạng thái</Label>
              <Select value={isActive ? "true" : "false"} onValueChange={(value) => setIsActive(value === "true")}>
                <SelectTrigger id="pointRuleStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Đang áp dụng</SelectItem>
                  <SelectItem value="false">Ngừng áp dụng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm rule"}
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
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>("all");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [complaintDetailOpen, setComplaintDetailOpen] = useState(false);
  const [pointRuleFormOpen, setPointRuleFormOpen] = useState(false);
  const [editingPointRule, setEditingPointRule] = useState<PointRule | null>(null);
  const [selectedPointRuleWasteTypeId, setSelectedPointRuleWasteTypeId] = useState("");
  const [districtDialogOpen, setDistrictDialogOpen] = useState(false);
  const [wardDialogOpen, setWardDialogOpen] = useState(false);
  const [quickLocationDialogOpen, setQuickLocationDialogOpen] = useState(false);
  const [districtName, setDistrictName] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("79");
  const [wardDistrictId, setWardDistrictId] = useState("");
  const [wardName, setWardName] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [quickDistrictName, setQuickDistrictName] = useState("");
  const [quickDistrictCode, setQuickDistrictCode] = useState("");
  const [quickProvinceCode, setQuickProvinceCode] = useState("79");
  const [quickWardName, setQuickWardName] = useState("");
  const [quickWardCode, setQuickWardCode] = useState("");

  const {
    data: enterpriseApprovals,
    isLoading: enterpriseLoading,
    isError: enterpriseError,
  } = useQuery({
    queryKey: ["enterpriseApprovals"],
    queryFn: () => enterpriseApprovalService.getAll({ PageNumber: 1, PageSize: 50 }),
  });

  const { data: complaintData, isLoading: complaintLoading, isError: complaintError } = useQuery({
    queryKey: ["adminComplaints"],
    queryFn: () => complaintService.getAdmin({ PageNumber: 1, PageSize: 100 }),
  });
  const complaints = complaintData?.items ?? [];
  const filteredComplaints = complaints.filter((complaint) =>
    complaintStatusFilter === "all" ? true : complaint.status === complaintStatusFilter
  );
  const openComplaintCount = complaints.filter((complaint) => {
    const status = complaint.status?.toUpperCase();
    return status === "OPEN" || status === "INREVIEW";
  }).length;

  const { data: complaintDetail, isLoading: complaintDetailLoading, isError: complaintDetailError } = useQuery({
    queryKey: ["adminComplaintDetail", selectedComplaintId],
    queryFn: () => complaintService.getById(selectedComplaintId!),
    enabled: !!selectedComplaintId,
  });

  const {
    data: complaintResolutionHistory = [],
    isLoading: complaintResolutionLoading,
    isError: complaintResolutionError,
  } = useQuery({
    queryKey: ["complaintResolutions", selectedComplaintId],
    queryFn: () => disputeResolutionService.getByComplaint(selectedComplaintId!),
    enabled: !!selectedComplaintId,
  });

  const updateComplaintStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => complaintService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(`Đã cập nhật khiếu nại sang trạng thái ${variables.status}`);
      qc.invalidateQueries({ queryKey: ["adminComplaints"] });
      qc.invalidateQueries({ queryKey: ["adminComplaintDetail", variables.id] });
      if (variables.status === "InReview") {
        setSelectedComplaintId(variables.id);
        setComplaintDetailOpen(true);
      }
    },
    onError: () => toast.error("Cập nhật trạng thái khiếu nại thất bại"),
  });

  const createResolutionMutation = useMutation({
    mutationFn: ({ complaintId, note }: { complaintId: string; note: string }) =>
      disputeResolutionService.create({
        complaintId,
        responseNote: note,
      }),
    onSuccess: (_, variables) => {
      toast.success("Đã ghi nhận kết quả xử lý khiếu nại");
      qc.invalidateQueries({ queryKey: ["adminComplaints"] });
      qc.invalidateQueries({ queryKey: ["adminComplaintDetail", variables.complaintId] });
      qc.invalidateQueries({ queryKey: ["complaintResolutions", variables.complaintId] });
    },
    onError: () => toast.error("Ghi nhận kết quả xử lý thất bại"),
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

  const openComplaintDetail = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    setComplaintDetailOpen(true);
  };

  const closeComplaintDetail = () => {
    setComplaintDetailOpen(false);
    setSelectedComplaintId(null);
  };

  const getComplaintTitle = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return "Khiếu nại";
    return trimmed.length > 72 ? `${trimmed.slice(0, 72)}...` : trimmed;
  };

  const { data: wasteTypes = [], isLoading: wtLoading } = useQuery({
    queryKey: ["wasteTypes"],
    queryFn: () => wasteTypeService.getAll(),
  });
  const { data: pointRules = [], isLoading: pointRuleLoading, isError: pointRuleError } = useQuery({
    queryKey: ["pointRules"],
    queryFn: () => pointRuleService.getAll(),
  });
  const pointRuleWasteTypeIds = pointRules.map((rule) => rule.wasteTypeId);
  const pointRuleItems = wasteTypes.map((wt) => {
    const rule = pointRules.find((item) => item.wasteTypeId === wt.id) ?? null;
    return {
      wasteType: wt,
      rule,
    };
  });

  const { data: districtPage, isLoading: districtLoading } = useQuery({
    queryKey: ["districts", "admin"],
    queryFn: () => districtService.getAll({ PageNumber: 1, PageSize: 100 }),
  });
  const districts = districtPage?.items ?? [];

  const { data: wardPage, isLoading: wardLoading } = useQuery({
    queryKey: ["wards", "admin"],
    queryFn: () => wardService.getAll({ PageNumber: 1, PageSize: 100 }),
  });
  const wards = wardPage?.items ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => wasteTypeService.delete(id),
    onSuccess: () => {
      toast.success("Đã xóa loại rác");
      qc.invalidateQueries({ queryKey: ["wasteTypes"] });
    },
    onError: () => toast.error("Xóa loại rác thất bại"),
  });

  const createDistrictMutation = useMutation({
    mutationFn: () =>
      districtService.create({
        name: districtName.trim(),
        code: districtCode.trim(),
        provinceCode: provinceCode.trim(),
      }),
    onSuccess: () => {
      toast.success("Đã tạo quận/huyện thành công");
      qc.invalidateQueries({ queryKey: ["districts", "admin"] });
      setDistrictDialogOpen(false);
      setDistrictName("");
      setDistrictCode("");
      setProvinceCode("79");
    },
    onError: () => toast.error("Tạo quận/huyện thất bại"),
  });

  const createWardMutation = useMutation({
    mutationFn: () =>
      wardService.create({
        districtId: wardDistrictId,
        name: wardName.trim(),
        code: wardCode.trim(),
      }),
    onSuccess: () => {
      toast.success("Đã tạo phường/xã thành công");
      qc.invalidateQueries({ queryKey: ["wards", "admin"] });
      setWardDialogOpen(false);
      setWardDistrictId("");
      setWardName("");
      setWardCode("");
    },
    onError: () => toast.error("Tạo phường/xã thất bại"),
  });

  const createDistrictThenWardMutation = useMutation({
    mutationFn: () =>
      createDistrictThenWard({
        district: {
          name: quickDistrictName.trim(),
          code: quickDistrictCode.trim(),
          provinceCode: quickProvinceCode.trim(),
        },
        ward: {
          name: quickWardName.trim(),
          code: quickWardCode.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Đã tạo quận/huyện và phường/xã thành công");
      qc.invalidateQueries({ queryKey: ["districts", "admin"] });
      qc.invalidateQueries({ queryKey: ["wards", "admin"] });
      setQuickLocationDialogOpen(false);
      setQuickDistrictName("");
      setQuickDistrictCode("");
      setQuickProvinceCode("79");
      setQuickWardName("");
      setQuickWardCode("");
    },
    onError: () => toast.error("Tạo nhanh địa bàn thất bại"),
  });

  const handleEdit = (wt: WasteType) => {
    setEditingWasteType(wt);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingWasteType(null);
    setFormOpen(true);
  };

  const handleAddPointRule = () => {
    setEditingPointRule(null);
    setSelectedPointRuleWasteTypeId("");
    setPointRuleFormOpen(true);
  };

  const handleAddPointRuleForWasteType = (wasteTypeId: string) => {
    setEditingPointRule(null);
    setSelectedPointRuleWasteTypeId(wasteTypeId);
    setPointRuleFormOpen(true);
  };

  const handleEditPointRule = (rule: PointRule) => {
    setEditingPointRule(rule);
    setSelectedPointRuleWasteTypeId("");
    setPointRuleFormOpen(true);
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
          { icon: AlertTriangle, label: "Khiếu nại chờ", value: complaintLoading ? "..." : String(openComplaintCount), color: "bg-eco-light" },
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
          <TabsTrigger value="point-rule">Point rule</TabsTrigger>
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

        <TabsContent value="point-rule">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-display text-base">Cấu hình point rule</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Thiết lập điểm cơ bản cho từng loại rác. Backend sẽ dùng rule này khi cộng điểm cho công dân.
                  </p>
                </div>
                <Button size="sm" onClick={handleAddPointRule}>
                  <Plus className="mr-1 h-4 w-4" /> Thêm point rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {wtLoading || pointRuleLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Đang tải point rule...</p>
              ) : pointRuleError ? (
                <p className="py-8 text-center text-sm text-destructive">Không thể tải point rule</p>
              ) : pointRuleItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Chưa có loại rác để cấu hình điểm</p>
              ) : (
                <div className="space-y-2">
                  {pointRuleItems.map(({ wasteType, rule }) => (
                    <div
                      key={wasteType.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{wasteType.name}</span>
                          <Badge variant="outline">{WASTE_CATEGORIES[wasteType.category ?? 3] ?? "Khác"}</Badge>
                          <Badge variant={rule ? (rule.isActive === false ? "secondary" : "default") : "outline"}>
                            {rule ? (rule.isActive === false ? "Ngừng áp dụng" : "Đang áp dụng") : "Chưa có rule"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {rule
                            ? `Điểm cơ bản: ${rule.basePoint} điểm`
                            : "Chưa cấu hình điểm cho loại rác này"}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        {rule ? (
                          <Button size="sm" variant="outline" onClick={() => handleEditPointRule(rule)}>
                            <Pencil className="mr-1 h-3 w-3" /> Cập nhật
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleAddPointRuleForWasteType(wasteType.id)}>
                            <Plus className="mr-1 h-3 w-3" /> Tạo rule
                          </Button>
                        )}
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
          <Card className="mb-4 shadow-card">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="font-display text-base">Danh sách khiếu nại</CardTitle>
                <Select value={complaintStatusFilter} onValueChange={setComplaintStatusFilter}>
                  <SelectTrigger className="sm:max-w-[220px]">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="Open">Mở</SelectItem>
                    <SelectItem value="InReview">Đang xem xét</SelectItem>
                    <SelectItem value="Resolved">Đã giải quyết</SelectItem>
                    <SelectItem value="Rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Luồng đúng: Mở {"->"} Đang xem xét {"->"} quản trị viên ghi kết quả xử lý hoặc từ chối. Khi xác nhận xử lý, hệ thống sẽ tự chuyển sang trạng thái đã giải quyết.
              </p>
            </CardHeader>
            <CardContent>
              {complaintLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Đang tải khiếu nại...</p>
              ) : complaintError ? (
                <p className="py-8 text-center text-sm text-destructive">Không thể tải danh sách khiếu nại</p>
              ) : filteredComplaints.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Chưa có khiếu nại nào phù hợp bộ lọc</p>
              ) : (
                <div className="space-y-3">
                  {filteredComplaints.map((complaint) => {
                    const badge = complaintStatusMap[complaint.status] || { label: complaint.status, variant: "secondary" as const };
                    return (
                      <Card key={complaint.id} className="shadow-card">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{complaint.type}</Badge>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </div>
                              <p className="text-sm font-medium text-foreground">{getComplaintTitle(complaint.content)}</p>
                              <p className="text-xs text-muted-foreground">
                                Khiếu nại được tạo lúc {new Date(complaint.createdTime).toLocaleString("vi-VN")}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              {complaint.status === "Open" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updateComplaintStatusMutation.isPending}
                                  onClick={() => updateComplaintStatusMutation.mutate({ id: complaint.id, status: "InReview" })}
                                >
                                  <Shield className="mr-1 h-4 w-4" /> Nhận xử lý
                                </Button>
                              )}
                              {complaint.status === "InReview" && (
                                <Badge variant="outline" className="px-3 py-2 text-xs">
                                  Đang trong bước xử lý
                                </Badge>
                              )}
                              <Button size="sm" onClick={() => openComplaintDetail(complaint.id)}>
                                <Eye className="mr-1 h-4 w-4" /> Chi tiết
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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
            <Card className="shadow-card sm:col-span-2">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <Package className="h-5 w-5 text-primary" /> Quản lý địa bàn
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDistrictDialogOpen(true)}>
                      <Plus className="mr-1 h-4 w-4" /> Thêm quận/huyện
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setWardDialogOpen(true)}>
                      <Plus className="mr-1 h-4 w-4" /> Thêm phường/xã
                    </Button>
                    <Button size="sm" onClick={() => setQuickLocationDialogOpen(true)}>
                      <Plus className="mr-1 h-4 w-4" /> Tạo nhanh cả hai
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Quận / Huyện</p>
                    <Badge variant="outline">{districts.length}</Badge>
                  </div>
                  {districtLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải quận/huyện...</p>
                  ) : districts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có quận/huyện nào.</p>
                  ) : (
                    <div className="space-y-2">
                      {districts.slice(0, 6).map((district) => (
                        <div key={district.id} className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                          <p className="font-medium text-foreground">{district.name}</p>
                          <p className="text-xs text-muted-foreground">Mã: {district.code} · Tỉnh/TP: {district.provinceCode}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Phường / Xã</p>
                    <Badge variant="outline">{wards.length}</Badge>
                  </div>
                  {wardLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải phường/xã...</p>
                  ) : wards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có phường/xã nào.</p>
                  ) : (
                    <div className="space-y-2">
                      {wards.slice(0, 6).map((ward) => (
                        <div key={ward.id} className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                          <p className="font-medium text-foreground">{ward.name}</p>
                          <p className="text-xs text-muted-foreground">{ward.districtName} · Mã: {ward.code}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={complaintDetailOpen} onOpenChange={(open) => { if (!open) closeComplaintDetail(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Chi tiết khiếu nại</DialogTitle>
          </DialogHeader>

          {complaintDetailLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Đang tải chi tiết khiếu nại...</p>
          ) : complaintDetailError ? (
            <p className="py-8 text-center text-sm text-destructive">Không thể tải chi tiết khiếu nại</p>
          ) : complaintDetail ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { label: "Loại khiếu nại", value: complaintDetail.type === "Feedback" ? "Phản hồi" : "Khiếu nại" },
                  { label: "Thời gian tạo", value: formatDate(complaintDetail.createdTime) },
                  { label: "Trạng thái", value: (complaintStatusMap[complaintDetail.status] || { label: complaintDetail.status }).label },
                  { label: "Nguồn gửi", value: complaintDetail.collectionRequestId ? "Từ yêu cầu thu gom" : "Từ báo cáo rác" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Trạng thái hiện tại</span>
                  <Badge variant={(complaintStatusMap[complaintDetail.status] || { variant: "secondary" as const }).variant}>
                    {(complaintStatusMap[complaintDetail.status] || { label: complaintDetail.status }).label}
                  </Badge>
                </div>
                <p className="text-sm text-foreground">{complaintDetail.content}</p>
              </div>

              {complaintDetail.status === "Open" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Khiếu nại này chưa được nhận xử lý. Bấm nút Bắt đầu xử lý ở dưới để chuyển sang bước xem xét.
                </div>
              )}

              {complaintDetail.status === "Rejected" && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  Khiếu nại đã bị từ chối và không còn ở bước nhập kết quả xử lý.
                </div>
              )}

              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Lịch sử xử lý</p>
                  <span className="text-xs text-muted-foreground">{complaintResolutionHistory.length} mục</span>
                </div>
                {complaintResolutionLoading ? (
                  <p className="text-sm text-muted-foreground">Đang tải lịch sử xử lý...</p>
                ) : complaintResolutionError ? (
                  <p className="text-sm text-destructive">Không thể tải lịch sử xử lý</p>
                ) : complaintResolutionHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có kết quả xử lý nào cho khiếu nại này.</p>
                ) : (
                  <div className="space-y-2">
                    {complaintResolutionHistory.map((resolution) => (
                      <div key={resolution.id} className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-foreground">{resolution.responseNote || resolution.resolutionNote || "Không có nội dung"}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate((resolution.resolvedAt ?? resolution.createdTime) || null)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Người xử lý: {resolution.handlerName || resolution.handlerId || "Không rõ"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Không có dữ liệu khiếu nại</p>
          )}

          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <Button variant="outline" onClick={closeComplaintDetail}>Đóng</Button>

            {complaintDetail && (
              <div className="flex flex-wrap justify-end gap-2">
                {complaintDetail.status === "Open" && (
                  <Button
                    disabled={updateComplaintStatusMutation.isPending}
                    onClick={() => updateComplaintStatusMutation.mutate({ id: complaintDetail.id, status: "InReview" })}
                  >
                    <Shield className="mr-1 h-4 w-4" /> Bắt đầu xử lý
                  </Button>
                )}

                {complaintDetail.status === "InReview" && (
                  <Button
                    variant="destructive"
                    disabled={updateComplaintStatusMutation.isPending}
                    onClick={() => updateComplaintStatusMutation.mutate({ id: complaintDetail.id, status: "Rejected" })}
                  >
                    Từ chối
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WasteType Form Dialog */}
      <WasteTypeFormDialog
        open={formOpen}
        editing={editingWasteType}
        onClose={() => setFormOpen(false)}
      />

      <PointRuleFormDialog
        open={pointRuleFormOpen}
        editing={editingPointRule}
        wasteTypes={wasteTypes}
        existingWasteTypeIds={pointRuleWasteTypeIds}
        presetWasteTypeId={selectedPointRuleWasteTypeId}
        onClose={() => {
          setPointRuleFormOpen(false);
          setEditingPointRule(null);
          setSelectedPointRuleWasteTypeId("");
        }}
      />

      <Dialog open={districtDialogOpen} onOpenChange={(open) => { if (!open) setDistrictDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Thêm quận/huyện</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="districtName">Tên quận/huyện</Label>
              <Input id="districtName" value={districtName} onChange={(e) => setDistrictName(e.target.value)} placeholder="VD: Quận 1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="districtCode">Mã quận/huyện</Label>
              <Input id="districtCode" value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} placeholder="VD: D1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provinceCode">Mã tỉnh/thành</Label>
              <Input id="provinceCode" value={provinceCode} onChange={(e) => setProvinceCode(e.target.value)} placeholder="VD: 79" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistrictDialogOpen(false)}>Hủy</Button>
            <Button
              disabled={createDistrictMutation.isPending || !districtName.trim() || !districtCode.trim() || !provinceCode.trim()}
              onClick={() => createDistrictMutation.mutate()}
            >
              {createDistrictMutation.isPending ? "Đang tạo..." : "Tạo quận/huyện"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wardDialogOpen} onOpenChange={(open) => { if (!open) setWardDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Thêm phường/xã</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wardDistrictId">Quận / Huyện</Label>
              <Select value={wardDistrictId} onValueChange={setWardDistrictId}>
                <SelectTrigger id="wardDistrictId">
                  <SelectValue placeholder="Chọn quận/huyện..." />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wardName">Tên phường/xã</Label>
              <Input id="wardName" value={wardName} onChange={(e) => setWardName(e.target.value)} placeholder="VD: Phường 1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wardCode">Mã phường/xã</Label>
              <Input id="wardCode" value={wardCode} onChange={(e) => setWardCode(e.target.value)} placeholder="VD: W1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWardDialogOpen(false)}>Hủy</Button>
            <Button
              disabled={createWardMutation.isPending || !wardDistrictId || !wardName.trim() || !wardCode.trim()}
              onClick={() => createWardMutation.mutate()}
            >
              {createWardMutation.isPending ? "Đang tạo..." : "Tạo phường/xã"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quickLocationDialogOpen} onOpenChange={(open) => { if (!open) setQuickLocationDialogOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Tạo nhanh quận/huyện và phường/xã</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">Quận / Huyện</p>
              <div className="space-y-1.5">
                <Label htmlFor="quickDistrictName">Tên</Label>
                <Input id="quickDistrictName" value={quickDistrictName} onChange={(e) => setQuickDistrictName(e.target.value)} placeholder="VD: Quận 1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quickDistrictCode">Mã</Label>
                <Input id="quickDistrictCode" value={quickDistrictCode} onChange={(e) => setQuickDistrictCode(e.target.value)} placeholder="VD: D1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quickProvinceCode">Mã tỉnh/thành</Label>
                <Input id="quickProvinceCode" value={quickProvinceCode} onChange={(e) => setQuickProvinceCode(e.target.value)} placeholder="VD: 79" />
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">Phường / Xã</p>
              <div className="space-y-1.5">
                <Label htmlFor="quickWardName">Tên</Label>
                <Input id="quickWardName" value={quickWardName} onChange={(e) => setQuickWardName(e.target.value)} placeholder="VD: Phường 1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quickWardCode">Mã</Label>
                <Input id="quickWardCode" value={quickWardCode} onChange={(e) => setQuickWardCode(e.target.value)} placeholder="VD: W1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickLocationDialogOpen(false)}>Hủy</Button>
            <Button
              disabled={
                createDistrictThenWardMutation.isPending ||
                !quickDistrictName.trim() ||
                !quickDistrictCode.trim() ||
                !quickProvinceCode.trim() ||
                !quickWardName.trim() ||
                !quickWardCode.trim()
              }
              onClick={() => createDistrictThenWardMutation.mutate()}
            >
              {createDistrictThenWardMutation.isPending ? "Đang tạo..." : "Tạo nhanh"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
