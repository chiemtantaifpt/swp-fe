import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, MapPin, Clock, CheckCircle, Camera, Package, Navigation } from "lucide-react";
import { toast } from "sonner";

type TaskStatus = "ASSIGNED" | "ON_THE_WAY" | "ARRIVED" | "COMPLETED";

interface Task {
  id: string;
  citizen: string;
  wasteType: string;
  address: string;
  date: string;
  status: TaskStatus;
  weight?: string;
  priority?: "high" | "normal";
}

const statusFlow: Record<TaskStatus, { label: string; next?: TaskStatus; nextLabel?: string }> = {
  ASSIGNED: { label: "Đã phân công", next: "ON_THE_WAY", nextLabel: "Bắt đầu đi" },
  ON_THE_WAY: { label: "Đang di chuyển", next: "ARRIVED", nextLabel: "Đã đến nơi" },
  ARRIVED: { label: "Đã đến nơi", next: "COMPLETED", nextLabel: "Hoàn tất thu gom" },
  COMPLETED: { label: "Hoàn thành" },
};

const statusColors: Record<TaskStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ASSIGNED: "secondary",
  ON_THE_WAY: "outline",
  ARRIVED: "default",
  COMPLETED: "default",
};

const initialTasks: Task[] = [
  { id: "WR-004", citizen: "Phạm Thị D", wasteType: "Nhựa", address: "12 Hai Bà Trưng, Q.1", date: "2025-02-27 09:00", status: "ASSIGNED", weight: "~6kg", priority: "high" },
  { id: "WR-006", citizen: "Lý Văn F", wasteType: "Giấy/Carton", address: "90 Đồng Khởi, Q.1", date: "2025-02-27 09:30", status: "ASSIGNED", weight: "~10kg" },
  { id: "WR-007", citizen: "Mai Thị G", wasteType: "Kim loại", address: "34 Nguyễn Thái Bình, Q.1", date: "2025-02-27 10:00", status: "ASSIGNED", weight: "~4kg" },
];

const historyTasks: Task[] = [
  { id: "WR-001", citizen: "Nguyễn Văn An", wasteType: "Nhựa", address: "123 Nguyễn Huệ, Q.1", date: "2025-02-25", status: "COMPLETED", weight: "5kg" },
  { id: "WR-005", citizen: "Hoàng Văn E", wasteType: "Thủy tinh", address: "56 Pasteur, Q.1", date: "2025-02-25", status: "COMPLETED", weight: "4kg" },
];

const CollectorDashboard = () => {
  const [online, setOnline] = useState(true);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleAdvance = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const flow = statusFlow[t.status];
        if (!flow.next) return t;
        if (flow.next === "COMPLETED") {
          toast.success(`Đã hoàn tất thu gom ${id}! Ảnh xác nhận đã lưu.`);
        } else {
          toast.info(`Cập nhật trạng thái ${id}: ${statusFlow[flow.next].label}`);
        }
        return { ...t, status: flow.next };
      })
    );
  };

  const activeTasks = tasks.filter(t => t.status !== "COMPLETED");
  const completedTasks = [...tasks.filter(t => t.status === "COMPLETED"), ...historyTasks];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Bảng điều khiển Thu gom</h1>
          <p className="text-sm text-muted-foreground">Quản lý công việc thu gom được phân công</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
          <Switch checked={online} onCheckedChange={setOnline} />
          <span className="text-sm font-medium text-foreground">
            {online ? "🟢 Sẵn sàng nhận việc" : "⚫ Đang nghỉ"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Package, label: "Việc hôm nay", value: activeTasks.length.toString(), color: "bg-eco-light" },
          { icon: CheckCircle, label: "Đã hoàn thành", value: completedTasks.length.toString(), color: "bg-eco-medium" },
          { icon: Truck, label: "Tổng cộng", value: "44", color: "bg-eco-teal" },
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

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Việc cần làm ({activeTasks.length})</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {!online ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Bạn đang ở chế độ nghỉ. Bật "Sẵn sàng nhận việc" để nhận thông báo mới.</p>
              </CardContent>
            </Card>
          ) : activeTasks.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <CheckCircle className="mx-auto mb-2 h-12 w-12 text-eco-medium" />
                <p className="text-muted-foreground">Tất cả công việc đã hoàn thành! 🎉</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((t, i) => {
                const flow = statusFlow[t.status];
                return (
                  <Card key={t.id} className={`shadow-card ${t.priority === "high" ? "border-l-4 border-l-destructive" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm font-semibold text-foreground">{t.id}</span>
                            <Badge variant={statusColors[t.status]}>{flow.label}</Badge>
                            {t.priority === "high" && <Badge variant="destructive">Ưu tiên</Badge>}
                          </div>
                          <p className="text-sm text-foreground">{t.wasteType} — {t.weight}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {t.address}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {t.date}
                          </p>
                        </div>
                        {flow.next && (
                          <Button size="sm" onClick={() => handleAdvance(t.id)} className="shrink-0">
                            {flow.next === "ON_THE_WAY" && <Navigation className="mr-1 h-4 w-4" />}
                            {flow.next === "ARRIVED" && <MapPin className="mr-1 h-4 w-4" />}
                            {flow.next === "COMPLETED" && <Camera className="mr-1 h-4 w-4" />}
                            {flow.nextLabel}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Công việc đã hoàn thành</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.id} — {t.wasteType} ({t.weight})</p>
                      <p className="text-xs text-muted-foreground">{t.address} • {t.date}</p>
                    </div>
                    <Badge variant="default">Hoàn thành</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default CollectorDashboard;
