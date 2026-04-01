import { Link, useLocation } from "react-router-dom";
import { ArrowRight, MailCheck } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RegisterCheckEmailState = {
  email?: string;
  fullName?: string;
  role?: string;
  requireEmailVerification?: boolean;
  message?: string;
};

export default function RegisterCheckEmailPage() {
  const location = useLocation();
  const state = (location.state as RegisterCheckEmailState | null) ?? null;

  return (
    <AuthLayout>
      <Card className="w-full max-w-md border-border/70 shadow-card">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-light">
            <MailCheck className="h-6 w-6 text-eco-dark" />
          </div>

          <div className="space-y-1">
            <CardTitle className="font-display text-3xl">Kiểm tra email của bạn</CardTitle>
            <CardDescription className="text-sm leading-6">
              {state?.message ||
                "Tài khoản đã được tạo thành công. Chúng tôi đã gửi một liên kết xác thực đến email của bạn."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="rounded-xl border border-eco-medium/40 bg-eco-light/40 px-4 py-3 text-sm text-muted-foreground">
            <p>
              {state?.email
                ? `Email xác thực đã được gửi tới ${state.email}.`
                : "Vui lòng mở hộp thư đến và bấm vào liên kết xác thực để kích hoạt tài khoản."}
            </p>
            <p className="mt-2">
              Sau khi xác thực thành công, hệ thống sẽ hướng dẫn bước tiếp theo phù hợp với loại tài khoản của bạn.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/login">
                Đến trang đăng nhập
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link to="/register">Quay lại đăng ký</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
