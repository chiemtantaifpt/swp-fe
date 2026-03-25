import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save, User, Building2, Truck } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { districtService, wardService } from "@/services/enterpriseConfig";
import { useCollectorProfileMe } from "@/hooks/useCollectorProfile";
import { useEnterpriseProfile } from "@/hooks/useEnterpriseProfile";
import { useUpdateUserProfile, useUserProfile } from "@/hooks/useUserProfile";

const roleLabels: Record<string, string> = {
  Citizen: "Công dân",
  Enterprise: "Doanh nghiệp",
  Collector: "Thu gom",
  Admin: "Quản trị",
};

const enterpriseApprovalStatusLabels: Record<string, string> = {
  PendingApproval: "Ch? duy?t",
  Approved: "?? duy?t",
  Rejected: "T? ch?i",
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile(!!user);
  const updateProfile = useUpdateUserProfile();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [districtId, setDistrictId] = useState<string>("none");
  const [wardId, setWardId] = useState<string>("none");

  const { data: districtList = [] } = useQuery({
    queryKey: ["profileDistricts"],
    queryFn: async () => {
      const res = await districtService.getAll({ PageNumber: 1, PageSize: 100 });
      return res.items;
    },
  });

  const { data: wardList = [] } = useQuery({
    queryKey: ["profileWards", districtId],
    queryFn: async () => {
      if (!districtId || districtId === "none") return [];
      const res = await wardService.getAll({ DistrictId: districtId, PageNumber: 1, PageSize: 100 });
      return res.items;
    },
    enabled: districtId !== "none",
  });

  const { data: enterpriseProfile } = useEnterpriseProfile(user?.role === "Enterprise");
  const { data: collectorProfile } = useCollectorProfileMe(user?.role === "Collector");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhoneNumber(profile.phoneNumber ?? "");
    setDistrictId(profile.districtId ?? "none");
    setWardId(profile.wardId ?? "none");
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        districtId: districtId === "none" ? null : districtId,
        wardId: wardId === "none" ? null : wardId,
      });
      toast.success("Cập nhật hồ sơ thành công");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Cập nhật hồ sơ thất bại";
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Hồ sơ</h1>
          <p className="text-sm text-muted-foreground">Quản lý thông tin tài khoản và hồ sơ nghiệp vụ của bạn.</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <User className="h-5 w-5 text-primary" />
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải hồ sơ...
              </div>
            ) : profile ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={profile.email} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vai trò</Label>
                    <div className="pt-2">
                      <Badge variant="outline">{roleLabels[profile.role] ?? profile.role}</Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Họ và tên</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phoneNumber">Số điện thoại</Label>
                    <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quận / Huyện</Label>
                    <Select
                      value={districtId}
                      onValueChange={(value) => {
                        setDistrictId(value);
                        setWardId("none");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quận / huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không chọn</SelectItem>
                        {districtList.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phường / Xã</Label>
                    <Select
                      value={wardId}
                      onValueChange={setWardId}
                      disabled={districtId === "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phường / xã" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không chọn</SelectItem>
                        {wardList.map((ward) => (
                          <SelectItem key={ward.id} value={ward.id}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Không tải được hồ sơ người dùng.</p>
            )}
          </CardContent>
        </Card>

        {user?.role === "Enterprise" && enterpriseProfile && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Hồ sơ doanh nghiệp
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Tên doanh nghiệp</p>
                <p className="font-medium text-foreground">{enterpriseProfile.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mã số thuế</p>
                <p className="font-medium text-foreground">{enterpriseProfile.taxCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Địa chỉ</p>
                <p className="font-medium text-foreground">{enterpriseProfile.address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trạng thái duyệt</p>
                <p className="font-medium text-foreground">{enterpriseApprovalStatusLabels[enterpriseProfile.approvalStatus] ?? enterpriseProfile.approvalStatus}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === "Collector" && collectorProfile && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Truck className="h-5 w-5 text-primary" />
                Hồ sơ thu gom
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Tên collector</p>
                <p className="font-medium text-foreground">{collectorProfile.collectorName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{collectorProfile.collectorEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trạng thái</p>
                <p className="font-medium text-foreground">{collectorProfile.isActive ? "Hoạt động" : "Tạm khóa"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hoàn thiện hồ sơ</p>
                <p className="font-medium text-foreground">{collectorProfile.isProfileCompleted ? "Đã hoàn tất" : "Chưa hoàn tất"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
