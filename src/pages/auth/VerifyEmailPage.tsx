import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  MailCheck,
  XCircle,
} from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService, type VerifyEmailNextStep } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";

const NEXT_STEP_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    buttonLabel: string;
    icon: typeof MailCheck;
  }
> = {
  Login: {
    title: "Xác thực email thành công",
    description: "Tài khoản của bạn đã được xác thực. Bạn có thể đăng nhập để bắt đầu sử dụng hệ thống.",
    buttonLabel: "Đến đăng nhập",
    icon: MailCheck,
  },
  CompleteEnterpriseProfile: {
    title: "Email đã được xác thực",
    description: "Tài khoản doanh nghiệp đã sẵn sàng. Đăng nhập để hoàn thiện hồ sơ doanh nghiệp.",
    buttonLabel: "Đăng nhập để tiếp tục",
    icon: Building2,
  },
  WaitForApproval: {
    title: "Email đã được xác thực",
    description: "Hồ sơ doanh nghiệp đang chờ duyệt. Đăng nhập để theo dõi trạng thái xét duyệt mới nhất.",
    buttonLabel: "Đăng nhập để xem trạng thái",
    icon: Clock3,
  },
};

const getNextStepConfig = (nextStep?: VerifyEmailNextStep) =>
  NEXT_STEP_CONFIG[nextStep ?? "Login"] ?? NEXT_STEP_CONFIG.Login;

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const userId = searchParams.get("userId")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const hasValidParams = Boolean(userId && token);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["verifyEmail", userId, token],
    queryFn: () => authService.verifyEmail(userId, token),
    enabled: hasValidParams,
    retry: false,
  });

  const nextStepConfig = useMemo(
    () => getNextStepConfig(data?.nextStep),
    [data?.nextStep]
  );

  const primaryHref =
    user?.role === "Enterprise" &&
    (data?.nextStep === "CompleteEnterpriseProfile" ||
      data?.nextStep === "WaitForApproval")
      ? "/enterprise"
      : "/login";

  const Icon = nextStepConfig.icon;

  return (
    <AuthLayout>
      <Card className="w-full max-w-md border-border/70 shadow-card">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-light">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-eco-dark" />
            ) : isError || !hasValidParams ? (
              <XCircle className="h-6 w-6 text-destructive" />
            ) : (
              <Icon className="h-6 w-6 text-eco-dark" />
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="font-display text-3xl">
              {isLoading
                ? "Đang xác thực email"
                : isError || !hasValidParams
                  ? "Không thể xác thực email"
                  : nextStepConfig.title}
            </CardTitle>
            <CardDescription className="text-sm leading-6">
              {isLoading
                ? "Hệ thống đang kiểm tra liên kết xác thực của bạn..."
                : !hasValidParams
                  ? "Liên kết xác thực không hợp lệ hoặc đang thiếu thông tin cần thiết."
                  : isError
                    ? (error as Error)?.message || "Liên kết xác thực đã hết hạn hoặc không còn hợp lệ."
                    : data?.message || nextStepConfig.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {isLoading ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Vui lòng đợi trong giây lát...
            </div>
          ) : (
            <>
              {!isError && hasValidParams && (
                <div className="rounded-xl border border-eco-medium/40 bg-eco-light/40 px-4 py-3 text-sm text-muted-foreground">
                  {data?.nextStep === "CompleteEnterpriseProfile" &&
                    "Bước tiếp theo: đăng nhập và hoàn thiện hồ sơ doanh nghiệp."}
                  {data?.nextStep === "WaitForApproval" &&
                    "Bước tiếp theo: đăng nhập để theo dõi trạng thái chờ phê duyệt hồ sơ."}
                  {(data?.nextStep == null || data?.nextStep === "Login") &&
                    "Bước tiếp theo: đăng nhập vào hệ thống."}
                </div>
              )}

              <div className="flex flex-col gap-3">
                {!isError && hasValidParams ? (
                  <Button asChild>
                    <Link to={primaryHref}>
                      {nextStepConfig.buttonLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/login">
                      Quay về đăng nhập
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}

                <Button asChild variant="outline">
                  <Link to="/">Về trang chủ</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
