import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, Users, BarChart3, CheckCircle, XCircle, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ xử lý", variant: "secondary" },
  PROCESSING: { label: "Đã tiếp nhận", variant: "outline" },
  ASSIGNED: { label: "Đã điều phối", variant: "default" },
  COMPLETED: { label: "Hoàn thành", variant: "default" },
  REJECTED: { label: "Từ chối", variant: "destructive" },
};

const mockRequests = [
  { id: "WR-001", citizen: "Nguyễn Văn An", wasteType: "Nhựa", status: "PENDING", date: "2025-02-27", address: "123 Nguyễn Huệ, Q.1", weight: "~5kg" },
  { id: "WR-002", citizen: "Trần Thị B", wasteType: "Giấy/Carton", status: "PENDING", date: "2025-02-27", address: "45 Lê Lợi, Q.1", weight: "~8kg" },
  { id: "WR-003", citizen: "Lê Văn C", wasteType: "Kim loại", status: "PROCESSING", date: "2025-02-26", address: "78 Trần Hưng Đạo, Q.1", weight: "~3kg" },
  { id: "WR-004", citizen: "Phạm Thị D", wasteType: "Nhựa", status: "ASSIGNED", date: "2025-02-26", address: "12 Hai Bà Trưng, Q.1", weight: "~6kg", collector: "Trần Minh Tuấn" },
  { id: "WR-005", citizen: "Hoàng Văn E", wasteType: "Thủy tinh", status: "COMPLETED", date: "2025-02-25", address: "56 Pasteur, Q.1", weight: "~4kg", collector: "Trần Minh Tuấn" },
];

const mockCollectors = [
  { id: "C1", name: "Trần Minh Tuấn", status: "online", tasks: 3, completed: 42 },
  { id: "C2", name: "Nguyễn Hữu Phong", status: "offline", tasks: 0, completed: 35 },
  { id: "C3", name: "Lê Thị Hoa", status: "online", tasks: 1, completed: 28 },
];

const EnterpriseDashboard = () => {
  const handleAccept = (id: string) => toast.success(`Đã tiếp nhận yêu cầu ${id}`);
  const handleReject = (id: string) => toast.info(`Đã từ chối yêu cầu ${id}`);
  const handleAssign = (id: string) => toast.success(`Đã gán collector cho ${id}`);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Doanh nghiệp</h1>
        <p className="text-sm text-muted-foreground">Quản lý yêu cầu thu gom và điều phối collector</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Package, label: "Yêu cầu mới", value: "2", color: "bg-eco-light" },
          { icon: Truck, label: "Đang thu gom", value: "1", color: "bg-eco-medium" },
          { icon: CheckCircle, label: "Hoàn thành", value: "48", color: "bg-eco-teal" },
          { icon: Users, label: "Collectors", value: "3", color: "bg-eco-light" },
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
        </TabsList>

        <TabsContent value="requests">
          <div className="space-y-3">
            {mockRequests.map(r => {
              const st = statusMap[r.status];
              return (
                <Card key={r.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{r.id}</span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{r.citizen}</span> — {r.wasteType} ({r.weight})
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {r.address} • {r.date}
                        </p>
                        {r.collector && <p className="mt-1 text-xs text-primary">Collector: {r.collector}</p>}
                      </div>
                      <div className="flex gap-2">
                        {r.status === "PENDING" && (
                          <>
                            <Button size="sm" onClick={() => handleAccept(r.id)}>
                              <CheckCircle className="mr-1 h-4 w-4" /> Tiếp nhận
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(r.id)}>
                              <XCircle className="mr-1 h-4 w-4" /> Từ chối
                            </Button>
                          </>
                        )}
                        {r.status === "PROCESSING" && (
                          <div className="flex items-center gap-2">
                            <Select onValueChange={() => handleAssign(r.id)}>
                              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Chọn Collector" /></SelectTrigger>
                              <SelectContent>
                                {mockCollectors.filter(c => c.status === "online").map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="collectors">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockCollectors.map(c => (
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

        <TabsContent value="stats">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2 font-display text-base"><BarChart3 className="h-5 w-5 text-primary" /> Theo loại rác</CardTitle></CardHeader>
              <CardContent>
                {[
                  { type: "Nhựa", amount: "120 kg", pct: 40 },
                  { type: "Giấy/Carton", amount: "90 kg", pct: 30 },
                  { type: "Kim loại", amount: "45 kg", pct: 15 },
                  { type: "Thủy tinh", amount: "30 kg", pct: 10 },
                  { type: "Khác", amount: "15 kg", pct: 5 },
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
              <CardHeader><CardTitle className="flex items-center gap-2 font-display text-base"><Clock className="h-5 w-5 text-primary" /> Tổng quan tháng 2/2025</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Tổng yêu cầu", value: "58" },
                  { label: "Đã hoàn thành", value: "48 (82.7%)" },
                  { label: "Tổng khối lượng", value: "300 kg" },
                  { label: "Thời gian xử lý TB", value: "4.2 giờ" },
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
      </Tabs>
    </DashboardLayout>
  );
};

export default EnterpriseDashboard;
