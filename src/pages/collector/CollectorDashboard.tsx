import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Truck, MapPin, Clock, CheckCircle, Package, Navigation, AlertCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collectorAssignmentService, collectorProofService, CollectorAssignment } from "@/services/collectionRequest";
import { imageService } from "@/services/image";

// ─── Step helpers ────────────────────────────────────────────────────
// Backend statuses: Assigned | OnTheWay | Collected
type Step = "ASSIGNED" | "ON_THE_WAY";

const STEP_LABEL: Record<Step | "COLLECTED", string> = {
  ASSIGNED:   "Đã phân công",
  ON_THE_WAY: "Đang di chuyển",
  COLLECTED:  "Đã thu gom",
};

const STEP_BADGE_VARIANT: Record<Step | "COLLECTED", "default" | "secondary" | "outline"> = {
  ASSIGNED:   "secondary",
  ON_THE_WAY: "outline",
  COLLECTED:  "default",
};

const getStep = (a: CollectorAssignment): Step => {
  if (a.status === "OnTheWay") return "ON_THE_WAY";
  return "ASSIGNED";
};

const shortId = (uuid: string) => uuid.slice(0, 8).toUpperCase();

const CollectorDashboard = () => {
  const [online, setOnline]                             = useState(true);
  const [loadingIds, setLoadingIds]                     = useState<Set<string>>(new Set());
  const [completingAssignment, setCompletingAssignment] = useState<CollectorAssignment | null>(null);
  const [proofNote, setProofNote]                       = useState("");
  const [proofFile, setProofFile]                       = useState<File | null>(null);
  const [proofSubmitting, setProofSubmitting]           = useState(false);
  const fileInputRef                                    = useRef<HTMLInputElement>(null);
  const qc                                              = useQueryClient();

  const { data: assignmentData, isLoading } = useQuery({
    queryKey: ["myAssignments"],
    queryFn: () => collectorAssignmentService.getMyAssignments({ PageSize: 100 }),
    refetchInterval: 30_000,
  });

  const allAssignments: CollectorAssignment[] = assignmentData?.items ?? [];
  const activeTasks  = allAssignments.filter(a => a.status !== "Collected");
  const historyTasks = allAssignments.filter(a => a.status === "Collected");
  const totalCount   = assignmentData?.totalCount ?? 0;

  const setCardLoading = (id: string, v: boolean) =>
    setLoadingIds(prev => { const s = new Set(prev); v ? s.add(id) : s.delete(id); return s; });

  const handleStartGo = async (a: CollectorAssignment) => {
    setCardLoading(a.id, true);
    try {
      await collectorAssignmentService.updateStatus(a.id, "OnTheWay");
      qc.invalidateQueries({ queryKey: ["myAssignments"] });
      toast.info("Đang di chuyển đến điểm thu gom");
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setCardLoading(a.id, false);
    }
  };

  const handleOpenComplete = (a: CollectorAssignment) => {
    setCompletingAssignment(a);
    setProofNote("");
    setProofFile(null);
  };

  const handleCompleteSubmit = async () => {
    if (!completingAssignment || !proofFile) return;
    setProofSubmitting(true);
    try {
      await collectorAssignmentService.updateStatus(
        completingAssignment.id, "Collected", proofNote.trim() || undefined,
      );
      const { url, publicId } = await imageService.uploadOne(proofFile);
      await collectorProofService.create({
        assignmentId: completingAssignment.id,
        imageUrl: url,
        publicId,
        note: proofNote.trim() || "Ảnh xác nhận hoàn tất thu gom",
      });
      toast.success("Hoàn tất thu gom thành công! 🎉");
      setCompletingAssignment(null);
      setProofFile(null);
      setProofNote("");
      qc.invalidateQueries({ queryKey: ["myAssignments"] });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as { message?: string })?.message ??
        "Hoàn tất thất bại";
      toast.error(msg);
    } finally {
      setProofSubmitting(false);
    }
  };

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
          { icon: CheckCircle,   label: "Đã hoàn thành",   value: isLoading ? "…" : historyTasks.length.toString(),  color: "bg-eco-medium" },
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
          <TabsTrigger value="history">Lịch sử ({isLoading ? "…" : historyTasks.length})</TabsTrigger>
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
                <p className="text-muted-foreground">Tất cả công việc đã hoàn thành! 🎉</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((a, i) => {
                const step = getStep(a);
                const isCardLoading = loadingIds.has(a.id);
                return (
                  <Card key={a.id} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                              {String(i + 1).padStart(2, "00")}
                            </span>
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {shortId(a.requestId)}
                            </span>
                            <Badge variant={STEP_BADGE_VARIANT[step]}>{STEP_LABEL[step]}</Badge>
                            {a.wasteTypeName && (
                              <Badge variant="secondary" className="text-xs">{a.wasteTypeName}</Badge>
                            )}
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {(a.latitude != null && a.longitude != null) && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                                {a.regionCode ? ` • ${a.regionCode}` : ""}
                              </p>
                            )}
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(a.createdTime).toLocaleString("vi-VN")}
                            </p>
                          </div>
                          {a.note && (
                            <p className="mt-1 text-xs text-muted-foreground">Ghi chú: {a.note}</p>
                          )}
                          {(a.imageUrls ?? []).length > 0 && (
                            <div className="mt-2 flex gap-2 overflow-x-auto">
                              {(a.imageUrls ?? []).map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noreferrer">
                                  <img
                                    src={url}
                                    alt={`Ảnh ${idx + 1}`}
                                    className="h-20 w-20 shrink-0 rounded-lg border object-cover transition-opacity hover:opacity-80"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0">
                          {step === "ASSIGNED" && (
                            <Button size="sm" disabled={isCardLoading} onClick={() => handleStartGo(a)}>
                              <Navigation className="mr-1 h-4 w-4" />
                              {isCardLoading ? "Đang xử lý…" : "Bắt đầu đi"}
                            </Button>
                          )}
                          {step === "ON_THE_WAY" && (
                            <Button size="sm" onClick={() => handleOpenComplete(a)}>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Hoàn tất thu gom
                            </Button>
                          )}
                        </div>
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
              ) : historyTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 opacity-40" />
                  <p className="text-sm">Chưa có công việc hoàn thành</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyTasks.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm font-medium text-foreground">{shortId(a.requestId)}</p>
                          {a.wasteTypeName && (
                            <Badge variant="secondary" className="text-xs">{a.wasteTypeName}</Badge>
                          )}
                        </div>
                        {a.regionCode && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />{a.regionCode}
                          </p>
                        )}
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
      {/* ══ Modal: Hoàn tất & Upload Proof ══ */}
      <Dialog
        open={!!completingAssignment}
        onOpenChange={(o) => { if (!o && !proofSubmitting) { setCompletingAssignment(null); setProofFile(null); setProofNote(""); } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Hoàn tất thu gom — {completingAssignment && shortId(completingAssignment.requestId)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image upload */}
            <div className="space-y-1.5">
              <Label>Ảnh xác nhận <span className="text-destructive">*</span></Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
              {proofFile ? (
                <div className="flex items-center gap-3 rounded-lg border p-2">
                  <img
                    src={URL.createObjectURL(proofFile)}
                    alt="preview"
                    className="h-16 w-16 rounded-md border object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-foreground">{proofFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(proofFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setProofFile(null)}
                  >
                    Xóa
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Chọn ảnh xác nhận
                </Button>
              )}
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="proofNote">Ghi chú (tuỳ chọn)</Label>
              <textarea
                id="proofNote"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Mô tả quá trình thu gom…"
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={proofSubmitting}
              onClick={() => { setCompletingAssignment(null); setProofFile(null); setProofNote(""); }}
            >
              Huỷ
            </Button>
            <Button disabled={!proofFile || proofSubmitting} onClick={handleCompleteSubmit}>
              {proofSubmitting ? "Đang xử lý…" : "Xác nhận hoàn tất"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CollectorDashboard;
