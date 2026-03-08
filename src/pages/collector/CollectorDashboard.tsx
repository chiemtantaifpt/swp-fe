import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, MapPin, Clock, CheckCircle, Package, Navigation, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { collectorAssignmentService, CollectorAssignment } from "@/services/collectionRequest";

// ─── Local status flow (ON_THE_WAY / ARRIVED are client-only states) ──────────
type LocalStatus = "ASSIGNED" | "ON_THE_WAY" | "ARRIVED" | "COMPLETED";

const statusFlow: Record<LocalStatus, { label: string; next?: LocalStatus; nextLabel?: string }> = {
  ASSIGNED:    { label: "Đã phân công",   next: "ON_THE_WAY", nextLabel: "Bắt đầu đi" },
  ON_THE_WAY:  { label: "Đang di chuyển", next: "ARRIVED",    nextLabel: "Đã đến nơi" },
  ARRIVED:     { label: "Đã đến nơi",     next: "COMPLETED",  nextLabel: "Hoàn tất thu gom" },
  COMPLETED:   { label: "Hoàn thành" },
};

const statusColors: Record<LocalStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ASSIGNED:   "secondary",
  ON_THE_WAY: "outline",
  ARRIVED:    "default",
  COMPLETED:  "default",
};

const apiToLocal = (apiStatus: string): LocalStatus => {
  if (apiStatus === "Completed") return "COMPLETED";
  return "ASSIGNED";
};

const shortId = (uuid: string) => uuid.slice(0, 8).toUpperCase();

const CollectorDashboard = () => {
  const [online, setOnline] = useState(true);
  const [localProgress, setLocalProgress] = useState<Record<string, LocalStatus>>({});

  const { data: assignmentData, isLoading } = useQuery({
    queryKey: ["myAssignments"],
    queryFn: () => collectorAssignmentService.getMyAssignments({ PageSize: 50 }),
    refetchInterval: 30_000,
  });

  const assignments: CollectorAssignment[] = assignmentData?.items ?? [];

  const getStatus = (a: CollectorAssignment): LocalStatus =>
    localProgress[a.id] ?? apiToLocal(a.status);

  const handleAdvance = (id: string, current: LocalStatus) => {
    const next = statusFlow[current].next;
    if (!next) return;
    setLocalProgress(prev => ({ ...prev, [id]: next }));
    if (next === "COMPLETED") toast.success(`Đã hoàn tất thu gom ${shortId(id)}!`);
    else toast.info(`Cập nhật: ${statusFlow[next].label}`);
  };

  const activeTasks    = assignments.filter(a => getStatus(a) !== "COMPLETED");
  const completedTasks = assignments.filter(a => getStatus(a) === "COMPLETED");
  const totalCount     = assignmentData?.totalCount ?? 0;

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
          { icon: Package,       label: "Việc hôm nay",    value: isLoading ? "…" : activeTasks.length.toString(),    color: "bg-eco-light" },
          { icon: CheckCircle,   label: "Đã hoàn thành",   value: isLoading ? "…" : completedTasks.length.toString(), color: "bg-eco-medium" },
          { icon: Truck,         label: "Tổng cộng",       value: isLoading ? "…" : totalCount.toString(),            color: "bg-eco-teal" },
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
          <TabsTrigger value="active">Việc cần làm ({isLoading ? "…" : activeTasks.length})</TabsTrigger>
          <TabsTrigger value="history">Lịch sử ({isLoading ? "…" : completedTasks.length})</TabsTrigger>
        </TabsList>

        {/* ── Active tab ── */}
        <TabsContent value="active">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="shadow-card">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !online ? (
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
              {activeTasks.map((a, i) => {
                const status = getStatus(a);
                const flow = statusFlow[status];
                return (
                  <Card key={a.id} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {shortId(a.requestId)}
                            </span>
                            <Badge variant={statusColors[status]}>{flow.label}</Badge>
                          </div>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(a.createdTime).toLocaleString("vi-VN")}
                          </p>
                          {a.collectedNote && (
                            <p className="mt-1 text-xs text-muted-foreground">Ghi chú: {a.collectedNote}</p>
                          )}
                        </div>
                        {flow.next && (
                          <Button size="sm" onClick={() => handleAdvance(a.id, status)} className="shrink-0">
                            {flow.next === "ON_THE_WAY" && <Navigation className="mr-1 h-4 w-4" />}
                            {flow.next === "ARRIVED"    && <MapPin className="mr-1 h-4 w-4" />}
                            {flow.next === "COMPLETED"  && <CheckCircle className="mr-1 h-4 w-4" />}
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

        {/* ── History tab ── */}
        <TabsContent value="history">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Công việc đã hoàn thành</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : completedTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 opacity-40" />
                  <p className="text-sm">Chưa có công việc hoàn thành</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="font-mono text-sm font-medium text-foreground">{shortId(a.requestId)}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.collectedAt
                            ? new Date(a.collectedAt).toLocaleString("vi-VN")
                            : new Date(a.createdTime).toLocaleString("vi-VN")}
                        </p>
                        {a.collectedNote && (
                          <p className="text-xs text-muted-foreground">Ghi chú: {a.collectedNote}</p>
                        )}
                      </div>
                      <Badge variant="default">Hoàn thành</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default CollectorDashboard;
