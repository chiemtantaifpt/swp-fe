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
  ShieldAlert,
  XCircle,
} from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/auth";
import type { AuthApiError, ParsedVerifyEmailResult, VerifyEmailNextStep } from "@/services/auth.types";

type VerifyPageVariant = "loading" | "success" | "already-verified" | "invalid-token";

const NEXT_STEP_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    buttonLabel: string;
    href: string;
    icon: typeof MailCheck;
  }
> = {
  Login: {
    title: "Xác thực email thành công",
    description:
      "Tài khoản của bạn đã được xác thực. Bạn có thể đăng nhập để bắt đầu sử dụng hệ thống.",
    buttonLabel: "Đến đăng nhập",
    href: "/login",
    icon: CheckCircle2,
  },
  CompleteEnterpriseProfile: {
    title: "Email đã được xác thực",
    description:
      "Tài khoản doanh nghiệp đã sẵn sàng. Hãy đăng nhập để hoàn thiện hồ sơ doanh nghiệp.",
    buttonLabel: "Đăng nhập để tiếp tục",
    href: "/login",
    icon: Building2,
  },
  WaitForApproval: {
    title: "Email đã được xác thực",
    description:
      "Hồ sơ doanh nghiệp đang chờ phê duyệt. Hãy đăng nhập để theo dõi trạng thái mới nhất.",
    buttonLabel: "Đăng nhập để xem trạng thái",
    href: "/login",
    icon: Clock3,
  },
};

const getNextStepConfig = (nextStep?: VerifyEmailNextStep) =>
  NEXT_STEP_CONFIG[nextStep ?? "Login"] ?? NEXT_STEP_CONFIG.Login;

const getVerifyVariant = (
  hasValidParams: boolean,
  isLoading: boolean,
  error: AuthApiError | null
): VerifyPageVariant => {
  if (isLoading) return "loading";
  if (!hasValidParams) return "invalid-token";
  if (error?.code === "already_verified") return "already-verified";
  if (error) return "invalid-token";
  return "success";
};

const getVariantContent = (
  variant: VerifyPageVariant,
  data: ParsedVerifyEmailResult | undefined,
  error: AuthApiError | null
) => {
  if (variant === "loading") {
    return {
      title: "Đang xác thực email",
      description: "Hệ thống đang kiểm tra liên kết xác thực của bạn...",
      helper: "Vui lòng đợi trong giây lát...",
      icon: Loader2,
    };
  }

  if (variant === "already-verified") {
    return {
      title: "Email đã được xác thực trước đó",
      description:
        error?.message ||
        "Liên kết này không còn cần dùng nữa vì tài khoản đã được xác thực trước đó.",
      helper: "Bạn có thể đăng nhập ngay để tiếp tục sử dụng hệ thống.",
      icon: CheckCircle2,
    };
  }

  if (variant === "invalid-token") {
    return {
      title: "Không thể xác thực email",
      description:
        error?.message ||
        "Liên kết xác thực không hợp lệ, thiếu thông tin hoặc đã hết hạn.",
      helper: "Hãy quay lại trang đăng nhập hoặc đăng ký lại nếu cần.",
      icon: ShieldAlert,
    };
  }

  const nextStepConfig = getNextStepConfig(data?.nextStep);
  return {
    title: nextStepConfig.title,
    description: data?.message || nextStepConfig.description,
    helper: nextStepConfig.description,
    icon: nextStepConfig.icon,
  };
};

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const hasValidParams = Boolean(userId && token);

  const query = useQuery({
    queryKey: ["verifyEmail", userId, token],
    queryFn: () => authService.verifyEmail(userId, token),
    enabled: hasValidParams,
    retry: false,
  });

  const authError = (query.error as AuthApiError | null) ?? null;
  const variant = getVerifyVariant(hasValidParams, query.isLoading, authError);
  const content = useMemo(
    () => getVariantContent(variant, query.data, authError),
    [variant, query.data, authError]
  );

  const nextStepConfig = getNextStepConfig(query.data?.nextStep);
  const Icon = content.icon;

  return (
    <AuthLayout>
      <Card className="w-full max-w-md border-border/70 shadow-card">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-light">
            {variant === "loading" ? (
              <Loader2 className="h-6 w-6 animate-spin text-eco-dark" />
            ) : variant === "invalid-token" ? (
              <XCircle className="h-6 w-6 text-destructive" />
            ) : (
              <Icon className="h-6 w-6 text-eco-dark" />
            )}
          </div>

          <div className="space-y-1">
            <CardTitle className="font-display text-3xl">{content.title}</CardTitle>
            <CardDescription className="text-sm leading-6">
              {content.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {variant === "success" && (
              <>
                {query.data?.email && (
                  <p className="mb-1">
                    Email đã xác thực: <span className="font-medium text-foreground">{query.data.email}</span>
                  </p>
                )}
                <p>
                  {query.data?.nextStep === "CompleteEnterpriseProfile" &&
                    "Bước tiếp theo: đăng nhập và hoàn thiện hồ sơ doanh nghiệp."}
                  {query.data?.nextStep === "WaitForApproval" &&
                    "Bước tiếp theo: đăng nhập để theo dõi trạng thái xét duyệt hồ sơ doanh nghiệp."}
                  {(query.data?.nextStep == null || query.data?.nextStep === "Login") &&
                    "Bước tiếp theo: đăng nhập vào hệ thống."}
                </p>
              </>
            )}

            {variant !== "success" && <p>{content.helper}</p>}
          </div>

          <div className="flex flex-col gap-3">
            {variant === "success" && (
              <Button asChild>
                <Link to={nextStepConfig.href}>
                  {nextStepConfig.buttonLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}

            {variant === "already-verified" && (
              <Button asChild>
                <Link to="/login">
                  Đến đăng nhập
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}

            {variant === "invalid-token" && (
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
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
