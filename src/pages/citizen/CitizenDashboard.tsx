import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
import { Plus, MapPin, Clock, Award, Trophy, Star, Camera, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const wasteTypes = ["Nhựa", "Giấy/Carton", "Kim loại", "Thủy tinh", "Hữu cơ", "Nguy hại", "Khác"];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ xử lý", variant: "secondary" },
  PROCESSING: { label: "Đã tiếp nhận", variant: "outline" },
  ASSIGNED: { label: "Đã điều phối", variant: "default" },
  COMPLETED: { label: "Hoàn thành", variant: "default" },
  REJECTED: { label: "Từ chối", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

const mockReports = [
  { id: "WR-001", wasteType: "Nhựa", status: "COMPLETED", date: "2025-02-25", address: "123 Nguyễn Huệ, Q.1", points: 15 },
  { id: "WR-002", wasteType: "Giấy/Carton", status: "ASSIGNED", date: "2025-02-26", address: "45 Lê Lợi, Q.1", points: 0 },
  { id: "WR-003", wasteType: "Kim loại", status: "PENDING", date: "2025-02-27", address: "78 Trần Hưng Đạo, Q.1", points: 0 },
];

const mockLeaderboard = [
  { rank: 1, name: "Trần Thị B", points: 520, district: "Quận 1" },
  { rank: 2, name: "Nguyễn Văn An", points: 320, district: "Quận 1" },
  { rank: 3, name: "Lê Văn C", points: 280, district: "Quận 1" },
  { rank: 4, name: "Phạm Thị D", points: 210, district: "Quận 1" },
  { rank: 5, name: "Hoàng Văn E", points: 180, district: "Quận 1" },
];

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Báo cáo đã được gửi thành công!");
    setOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Xin chào, {user?.name} 👋</h1>
        <p className="text-sm text-muted-foreground">Quản lý báo cáo rác và theo dõi điểm thưởng</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: MapPin, label: "Báo cáo", value: "12", color: "bg-eco-light" },
          { icon: Clock, label: "Đang chờ", value: "2", color: "bg-eco-medium" },
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
                    <Select required>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn loại rác" /></SelectTrigger>
                      <SelectContent>
                        {wasteTypes.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mô tả</Label>
                    <Textarea className="mt-1" placeholder="Mô tả ngắn về rác cần thu gom..." />
                  </div>
                  <div>
                    <Label>Hình ảnh *</Label>
                    <div className="mt-1 flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted transition-colors hover:border-primary">
                      <div className="text-center">
                        <Camera className="mx-auto h-6 w-6 text-muted-foreground" />
                        <span className="mt-1 text-xs text-muted-foreground">Chụp / tải ảnh lên</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Vị trí</Label>
                    <div className="mt-1 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> Đang lấy tọa độ GPS...
                    </div>
                  </div>
                  <div>
                    <Label>Địa chỉ chi tiết</Label>
                    <Input className="mt-1" placeholder="Số nhà, đường, phường..." />
                  </div>
                  <Button type="submit" className="w-full">Gửi báo cáo</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {mockReports.map(r => {
              const st = statusMap[r.status];
              return (
                <Card key={r.id} className="shadow-card">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-eco-light text-sm font-bold text-eco-dark">
                        {r.wasteType.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.id} — {r.wasteType}</p>
                        <p className="text-xs text-muted-foreground">{r.address}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.points > 0 && (
                        <span className="flex items-center gap-1 text-sm font-medium text-primary">
                          <Star className="h-4 w-4" /> +{r.points} điểm
                        </span>
                      )}
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
    </DashboardLayout>
  );
};

export default CitizenDashboard;
