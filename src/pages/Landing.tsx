import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Recycle, MapPin, Award, Truck, Users, BarChart3, Shield, ArrowRight, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-illustration.jpg";

const features = [
  { icon: MapPin, title: "Báo cáo GPS", desc: "Chụp ảnh, định vị và gửi báo cáo rác chỉ trong vài giây" },
  { icon: Truck, title: "Thu gom thông minh", desc: "Điều phối theo lô, tối ưu lộ trình và chi phí vận chuyển" },
  { icon: Recycle, title: "Phân loại tại nguồn", desc: "Hỗ trợ phân loại rác đúng quy định từ năm 2025" },
  { icon: Award, title: "Điểm thưởng", desc: "Tích điểm cho hành vi phân loại đúng, xếp hạng khu vực" },
  { icon: BarChart3, title: "Báo cáo realtime", desc: "Dữ liệu vận hành theo thời gian thực cho doanh nghiệp" },
  { icon: Shield, title: "Giám sát toàn diện", desc: "Quản trị viên theo dõi và giải quyết tranh chấp" },
];

const steps = [
  { step: "01", title: "Báo cáo rác", desc: "Công dân chụp ảnh, chọn loại rác và gửi báo cáo qua ứng dụng" },
  { step: "02", title: "Điều phối", desc: "Doanh nghiệp tái chế tiếp nhận và gán cho người thu gom phù hợp" },
  { step: "03", title: "Thu gom", desc: "Người thu gom đến địa điểm, xác nhận và hoàn tất thu gom" },
  { step: "04", title: "Tích điểm", desc: "Công dân nhận điểm thưởng, theo dõi lịch sử và bảng xếp hạng" },
];

const accounts = [
  { role: "Công dân", email: "citizen@test.com", password: "123456" },
  { role: "Doanh nghiệp", email: "enterprise@test.com", password: "123456" },
  { role: "Thu gom", email: "collector@test.com", password: "123456" },
  { role: "Quản trị", email: "admin@test.com", password: "123456" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">EcoCollect</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Tính năng</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Cách hoạt động</a>
            <a href="#accounts" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Demo</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Đăng ký <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div {...fadeUp}>
              <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                🌱 Nền tảng thu gom rác thải cộng đồng
              </span>
              <h1 className="mb-6 font-display text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">
                Kết nối vì một <br />
                <span className="text-gradient">đô thị xanh hơn</span>
              </h1>
              <p className="mb-8 max-w-lg text-lg text-muted-foreground">
                EcoCollect kết nối người dân, doanh nghiệp tái chế và dịch vụ thu gom rác, 
                tạo nên hệ sinh thái kinh tế tuần hoàn minh bạch và hiệu quả.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register">
                  <Button size="lg" className="font-semibold">
                    Bắt đầu ngay <ChevronRight className="ml-1 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg">Tìm hiểu thêm</Button>
                </a>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img
                src={heroImage}
                alt="EcoCollect - Thu gom rác thải thông minh"
                className="w-full rounded-2xl shadow-elevated"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card py-12">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {[
            { value: "10K+", label: "Người dùng" },
            { value: "50K+", label: "Đơn thu gom" },
            { value: "200T", label: "Rác tái chế" },
            { value: "15", label: "Quận/Huyện" },
          ].map((s, i) => (
            <motion.div key={i} className="text-center" {...fadeUp} transition={{ delay: i * 0.1 }}>
              <div className="font-display text-3xl font-extrabold text-primary md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div className="mb-14 text-center" {...fadeUp}>
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">Tính năng nổi bật</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Giải pháp toàn diện cho quản lý rác thải đô thị, từ báo cáo đến thu gom và tái chế
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated"
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-eco-light transition-colors group-hover:bg-eco-medium">
                  <f.icon className="h-6 w-6 text-eco-dark" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-eco-lightest py-20">
        <div className="container mx-auto px-4">
          <motion.div className="mb-14 text-center" {...fadeUp}>
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">Cách hoạt động</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">Quy trình đơn giản, minh bạch từ báo cáo đến hoàn tất thu gom</p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={i} className="relative text-center" {...fadeUp} transition={{ delay: i * 0.15 }}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
                  {s.step}
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                {i < 3 && (
                  <div className="absolute right-0 top-8 hidden -translate-x-1/2 md:block">
                    <ArrowRight className="h-6 w-6 text-eco-teal" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Actors */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div className="mb-14 text-center" {...fadeUp}>
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">4 vai trò trong hệ thống</h2>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, role: "Công dân", desc: "Báo cáo rác, phân loại tại nguồn, tích điểm thưởng", color: "bg-eco-light" },
              { icon: Recycle, role: "Doanh nghiệp", desc: "Quản lý năng lực tái chế, điều phối thu gom", color: "bg-eco-medium" },
              { icon: Truck, role: "Thu gom", desc: "Nhận việc, cập nhật trạng thái, xác nhận thu gom", color: "bg-eco-teal" },
              { icon: Shield, role: "Quản trị", desc: "Giám sát hệ thống, quản lý tài khoản, giải quyết tranh chấp", color: "bg-primary" },
            ].map((a, i) => (
              <motion.div key={i} className="rounded-xl border border-border bg-card p-6 text-center shadow-card" {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${a.color}`}>
                  <a.icon className={`h-7 w-7 ${a.color === "bg-primary" ? "text-primary-foreground" : "text-eco-dark"}`} />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{a.role}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Accounts */}
      <section id="accounts" className="bg-eco-lightest py-20">
        <div className="container mx-auto px-4">
          <motion.div className="mb-10 text-center" {...fadeUp}>
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground">Tài khoản Demo</h2>
            <p className="text-muted-foreground">Sử dụng các tài khoản sau để trải nghiệm từng vai trò</p>
          </motion.div>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {accounts.map((a, i) => (
              <motion.div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card" {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="mb-2 text-sm font-semibold text-primary">{a.role}</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Email: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{a.email}</code></div>
                  <div>Mật khẩu: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{a.password}</code></div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/login">
              <Button size="lg">Đăng nhập ngay <ArrowRight className="ml-1 h-5 w-5" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Recycle className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">EcoCollect</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Nền tảng thu gom rác thải cộng đồng — Project Ideas SP26
          </p>
          <p className="mt-2 text-xs text-muted-foreground">© 2025 EcoCollect. Crowdsourced Waste Collection & Recycling Platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
