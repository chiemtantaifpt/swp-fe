import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, AlertTriangle, BarChart3, Shield, Ban, CheckCircle, Eye } from "lucide-react";
import { toast } from "sonner";

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

const AdminDashboard = () => {
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
          <TabsTrigger value="complaints">Khiếu nại</TabsTrigger>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
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

        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2 font-display text-base"><BarChart3 className="h-5 w-5 text-primary" /> Theo khu vực</CardTitle></CardHeader>
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
              <CardHeader><CardTitle className="flex items-center gap-2 font-display text-base"><Users className="h-5 w-5 text-primary" /> Phân bố người dùng</CardTitle></CardHeader>
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
    </DashboardLayout>
  );
};

export default AdminDashboard;
