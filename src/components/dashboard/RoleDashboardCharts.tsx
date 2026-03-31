import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  dashboardService,
  type DashboardCountPoint,
  type DashboardValuePoint,
  type EnterpriseDashboardData,
} from "@/services/dashboard";

type TopFilter = "3" | "5" | "10" | "all";
type SortFilter = "desc" | "asc";
type MonthFilter = "3" | "6" | "12" | "all";

const PIE_COLORS = ["#3f8c7a", "#6fcf97", "#b8f28c", "#6eb7bf", "#a7f3d0", "#86efac"];

const roleLabelMap: Record<string, string> = {
  Admin: "Quản trị",
  Citizen: "Công dân",
  Enterprise: "Doanh nghiệp",
  Collector: "Thu gom",
};

const requestStatusLabelMap: Record<string, string> = {
  Offered: "Chờ phản hồi",
  Accepted: "Đã tiếp nhận",
  Assigned: "Đã phân công",
  OnTheWay: "Đang di chuyển",
  Collected: "Đã thu gom",
  Completed: "Hoàn thành",
  Rejected: "Từ chối",
  Pending: "Chờ xử lý",
  Verified: "Đã xác nhận",
};

const proofStatusLabelMap: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
};

const enterpriseStatusLabelMap: Record<string, string> = {
  Approved: "Đã duyệt",
  PendingApproval: "Chờ duyệt",
  Rejected: "Từ chối",
};

const mapLabel = (label: string, dictionary?: Record<string, string>) =>
  dictionary?.[label] ?? label;

const toTopLimit = (value: TopFilter) => (value === "all" ? Infinity : Number(value));
const toMonthLimit = (value: MonthFilter) => (value === "all" ? Infinity : Number(value));

const filterCountData = (data: DashboardCountPoint[], top: TopFilter, sort: SortFilter) => {
  const sorted = [...data].sort((a, b) =>
    sort === "desc" ? b.count - a.count : a.count - b.count
  );
  return sorted.slice(0, toTopLimit(top));
};

const filterValueData = (data: DashboardValuePoint[], top: TopFilter, sort: SortFilter) => {
  const sorted = [...data].sort((a, b) =>
    sort === "desc" ? b.value - a.value : a.value - b.value
  );
  return sorted.slice(0, toTopLimit(top));
};

const filterLatestMonthsCount = (data: DashboardCountPoint[], months: MonthFilter) =>
  [...data].slice(-toMonthLimit(months));

const filterLatestMonthsValue = (data: DashboardValuePoint[], months: MonthFilter) =>
  [...data].slice(-toMonthLimit(months));

const baseCountChartConfig = {
  count: { label: "Số lượng", color: "#3f8c7a" },
} satisfies ChartConfig;

const baseValueChartConfig = {
  value: { label: "Giá trị", color: "#3f8c7a" },
} satisfies ChartConfig;

const capacityChartConfig = {
  dailyCapacity: { label: "Công suất ngày", color: "#3f8c7a" },
  assignedToday: { label: "Đã gán hôm nay", color: "#6fcf97" },
  remaining: { label: "Còn lại", color: "#b8f28c" },
} satisfies ChartConfig;

const FilterBar = ({
  top,
  sort,
  months,
  onTopChange,
  onSortChange,
  onMonthChange,
}: {
  top: TopFilter;
  sort: SortFilter;
  months: MonthFilter;
  onTopChange: (value: TopFilter) => void;
  onSortChange: (value: SortFilter) => void;
  onMonthChange: (value: MonthFilter) => void;
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-sm font-medium text-foreground">Bộ lọc biểu đồ</p>
      <p className="text-xs text-muted-foreground">
        Lọc dữ liệu hiển thị theo số lượng mục, thứ tự và phạm vi tháng.
      </p>
    </div>

    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={top} onValueChange={(value) => onTopChange(value as TopFilter)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mục</SelectItem>
            <SelectItem value="10">Top 10</SelectItem>
            <SelectItem value="5">Top 5</SelectItem>
            <SelectItem value="3">Top 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Select value={sort} onValueChange={(value) => onSortChange(value as SortFilter)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Giảm dần</SelectItem>
          <SelectItem value="asc">Tăng dần</SelectItem>
        </SelectContent>
      </Select>

      <Select value={months} onValueChange={(value) => onMonthChange(value as MonthFilter)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả tháng</SelectItem>
          <SelectItem value="12">12 tháng</SelectItem>
          <SelectItem value="6">6 tháng</SelectItem>
          <SelectItem value="3">3 tháng</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border bg-card/50">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Đang tải dữ liệu biểu đồ...
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 text-center">
    <AlertCircle className="h-8 w-8 text-destructive" />
    <p className="text-sm font-medium text-destructive">{message}</p>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-card/30 text-sm text-muted-foreground">
    {message}
  </div>
);

const ChartCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <Card className="shadow-card">
    <CardHeader className="pb-2">
      <CardTitle className="font-display text-base">{title}</CardTitle>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const CountSummaryList = ({
  data,
  colors,
}: {
  data: DashboardCountPoint[];
  colors?: string[];
}) => (
  <div className="mt-4 grid gap-2 sm:grid-cols-2">
    {data.map((item, index) => (
      <div
        key={`${item.label}-${index}`}
        className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm"
      >
        <div className="flex min-w-0 items-center gap-2">
          {colors ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
          ) : null}
          <span className="truncate text-foreground">{item.label}</span>
        </div>
        <span className="shrink-0 font-semibold text-foreground">{item.count}</span>
      </div>
    ))}
  </div>
);

const ValueSummaryList = ({
  data,
}: {
  data: DashboardValuePoint[];
}) => (
  <div className="mt-4 grid gap-2 sm:grid-cols-2">
    {data.map((item, index) => (
      <div
        key={`${item.label}-${index}`}
        className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm"
      >
        <span className="truncate text-foreground">{item.label}</span>
        <span className="shrink-0 font-semibold text-foreground">{item.value.toLocaleString("vi-VN")}</span>
      </div>
    ))}
  </div>
);

const CapacitySummaryList = ({
  data,
}: {
  data: EnterpriseDashboardData["capacityByWasteType"];
}) => (
  <div className="mt-4 space-y-2">
    {data.map((item) => (
      <div
        key={item.wasteTypeName}
        className="rounded-lg border border-border/70 bg-muted/30 px-3 py-3"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="font-medium text-foreground">{item.wasteTypeName}</span>
          <span className="text-xs text-muted-foreground">
            Tổng {item.dailyCapacity.toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-md bg-background/80 px-2 py-1.5">
            <span className="text-muted-foreground">Công suất ngày</span>
            <span className="font-semibold text-foreground">
              {item.dailyCapacity.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-background/80 px-2 py-1.5">
            <span className="text-muted-foreground">Đã gán hôm nay</span>
            <span className="font-semibold text-foreground">
              {item.assignedToday.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-background/80 px-2 py-1.5">
            <span className="text-muted-foreground">Còn lại</span>
            <span className="font-semibold text-foreground">
              {item.remaining.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const CountBarChartCard = ({
  title,
  data,
  subtitle,
}: {
  title: string;
  data: DashboardCountPoint[];
  subtitle?: string;
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    {data.length === 0 ? (
      <EmptyState message="Chưa có dữ liệu để hiển thị." />
    ) : (
      <>
        <ChartContainer config={baseCountChartConfig} className="h-[280px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} height={50} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={8} />
          </BarChart>
        </ChartContainer>
        <CountSummaryList data={data} />
      </>
    )}
  </ChartCard>
);

const ValueBarChartCard = ({
  title,
  data,
  subtitle,
}: {
  title: string;
  data: DashboardValuePoint[];
  subtitle?: string;
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    {data.length === 0 ? (
      <EmptyState message="Chưa có dữ liệu để hiển thị." />
    ) : (
      <>
        <ChartContainer config={baseValueChartConfig} className="h-[280px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} height={50} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={8} />
          </BarChart>
        </ChartContainer>
        <ValueSummaryList data={data} />
      </>
    )}
  </ChartCard>
);

const CountLineChartCard = ({
  title,
  data,
  subtitle,
}: {
  title: string;
  data: DashboardCountPoint[];
  subtitle?: string;
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    {data.length === 0 ? (
      <EmptyState message="Chưa có dữ liệu theo thời gian." />
    ) : (
      <>
        <ChartContainer config={baseCountChartConfig} className="h-[280px] w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--color-count)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-count)" }}
            />
          </LineChart>
        </ChartContainer>
        <CountSummaryList data={data} />
      </>
    )}
  </ChartCard>
);

const ValueLineChartCard = ({
  title,
  data,
  subtitle,
}: {
  title: string;
  data: DashboardValuePoint[];
  subtitle?: string;
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    {data.length === 0 ? (
      <EmptyState message="Chưa có dữ liệu theo thời gian." />
    ) : (
      <>
        <ChartContainer config={baseValueChartConfig} className="h-[280px] w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-value)" }}
            />
          </LineChart>
        </ChartContainer>
        <ValueSummaryList data={data} />
      </>
    )}
  </ChartCard>
);

const CountPieChartCard = ({
  title,
  data,
  subtitle,
}: {
  title: string;
  data: DashboardCountPoint[];
  subtitle?: string;
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    {data.length === 0 ? (
      <EmptyState message="Chưa có dữ liệu để phân bổ." />
    ) : (
      <>
        <ChartContainer config={baseCountChartConfig} className="h-[280px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
            <Pie data={data} dataKey="count" nameKey="label" innerRadius={55} outerRadius={90}>
              {data.map((entry, index) => (
                <Cell key={`${entry.label}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <CountSummaryList data={data} colors={PIE_COLORS} />
      </>
    )}
  </ChartCard>
);

const EnterpriseCapacityChartCard = ({
  data,
}: {
  data: EnterpriseDashboardData["capacityByWasteType"];
}) => (
  <ChartCard
    title="Công suất theo loại rác"
    subtitle="So sánh công suất ngày, đã gán và còn lại theo từng loại rác"
  >
    {data.length === 0 ? (
      <EmptyState message="Chưa có dữ liệu công suất." />
    ) : (
      <>
        <ChartContainer config={capacityChartConfig} className="h-[320px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="wasteTypeName" tickLine={false} axisLine={false} interval={0} height={60} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="dailyCapacity" fill="var(--color-dailyCapacity)" radius={8} />
            <Bar dataKey="assignedToday" fill="var(--color-assignedToday)" radius={8} />
            <Bar dataKey="remaining" fill="var(--color-remaining)" radius={8} />
          </BarChart>
        </ChartContainer>
        <CapacitySummaryList data={data} />
      </>
    )}
  </ChartCard>
);

export const AdminDashboardCharts = () => {
  const [top, setTop] = useState<TopFilter>("all");
  const [sort, setSort] = useState<SortFilter>("desc");
  const [months, setMonths] = useState<MonthFilter>("all");

  const query = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => dashboardService.getAdmin(),
  });

  const usersByRole = useMemo(
    () =>
      filterCountData(
        query.data?.usersByRole.map((item) => ({
          ...item,
          label: mapLabel(item.label, roleLabelMap),
        })) ?? [],
        top,
        sort
      ),
    [query.data?.usersByRole, top, sort]
  );

  const reportsByMonth = useMemo(
    () => filterLatestMonthsCount(query.data?.reportsByMonth ?? [], months),
    [query.data?.reportsByMonth, months]
  );

  const requestsByStatus = useMemo(
    () =>
      filterCountData(
        query.data?.requestsByStatus.map((item) => ({
          ...item,
          label: mapLabel(item.label, requestStatusLabelMap),
        })) ?? [],
        top,
        sort
      ),
    [query.data?.requestsByStatus, top, sort]
  );

  const enterprisesByStatus = useMemo(
    () =>
      filterCountData(
        query.data?.enterprisesByStatus.map((item) => ({
          ...item,
          label: mapLabel(item.label, enterpriseStatusLabelMap),
        })) ?? [],
        top,
        sort
      ),
    [query.data?.enterprisesByStatus, top, sort]
  );

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Không thể tải biểu đồ quản trị." />;

  return (
    <div className="space-y-4">
      <FilterBar
        top={top}
        sort={sort}
        months={months}
        onTopChange={setTop}
        onSortChange={setSort}
        onMonthChange={setMonths}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <CountPieChartCard title="Người dùng theo vai trò" data={usersByRole} />
        <CountBarChartCard title="Yêu cầu theo trạng thái" data={requestsByStatus} />
        <CountLineChartCard title="Báo cáo theo tháng" data={reportsByMonth} />
        <CountPieChartCard title="Doanh nghiệp theo trạng thái" data={enterprisesByStatus} />
      </div>
    </div>
  );
};

export const CitizenDashboardCharts = () => {
  const [top, setTop] = useState<TopFilter>("all");
  const [sort, setSort] = useState<SortFilter>("desc");
  const [months, setMonths] = useState<MonthFilter>("all");

  const query = useQuery({
    queryKey: ["citizenDashboard"],
    queryFn: () => dashboardService.getCitizen(),
  });

  const reportsByMonth = useMemo(
    () => filterLatestMonthsCount(query.data?.reportsByMonth ?? [], months),
    [query.data?.reportsByMonth, months]
  );

  const reportsByStatus = useMemo(
    () =>
      filterCountData(
        query.data?.reportsByStatus.map((item) => ({
          ...item,
          label: mapLabel(item.label, requestStatusLabelMap),
        })) ?? [],
        top,
        sort
      ),
    [query.data?.reportsByStatus, top, sort]
  );

  const pointsByMonth = useMemo(
    () => filterLatestMonthsValue(query.data?.pointsByMonth ?? [], months),
    [query.data?.pointsByMonth, months]
  );

  const reportsByWasteType = useMemo(
    () => filterCountData(query.data?.reportsByWasteType ?? [], top, sort),
    [query.data?.reportsByWasteType, top, sort]
  );

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Không thể tải biểu đồ công dân." />;

  return (
    <div className="space-y-4">
      <FilterBar
        top={top}
        sort={sort}
        months={months}
        onTopChange={setTop}
        onSortChange={setSort}
        onMonthChange={setMonths}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <CountLineChartCard title="Báo cáo theo tháng" data={reportsByMonth} />
        <CountPieChartCard title="Báo cáo theo trạng thái" data={reportsByStatus} />
        <ValueLineChartCard title="Điểm thưởng theo tháng" data={pointsByMonth} />
        <CountBarChartCard title="Báo cáo theo loại rác" data={reportsByWasteType} />
      </div>
    </div>
  );
};

export const EnterpriseDashboardCharts = () => {
  const [top, setTop] = useState<TopFilter>("all");
  const [sort, setSort] = useState<SortFilter>("desc");
  const [months, setMonths] = useState<MonthFilter>("all");

  const query = useQuery({
    queryKey: ["enterpriseDashboard"],
    queryFn: () => dashboardService.getEnterprise(),
  });

  const requestsByMonth = useMemo(
    () => filterLatestMonthsCount(query.data?.requestsByMonth ?? [], months),
    [query.data?.requestsByMonth, months]
  );

  const requestsByStatus = useMemo(
    () =>
      filterCountData(
        query.data?.requestsByStatus.map((item) => ({
          ...item,
          label: mapLabel(item.label, requestStatusLabelMap),
        })) ?? [],
        top,
        sort
      ),
    [query.data?.requestsByStatus, top, sort]
  );

  const proofsByReviewStatus = useMemo(
    () =>
      filterCountData(
        query.data?.proofsByReviewStatus.map((item) => ({
          ...item,
          label: mapLabel(item.label, proofStatusLabelMap),
        })) ?? [],
        top,
        sort
      ),
    [query.data?.proofsByReviewStatus, top, sort]
  );

  const requestsByWasteType = useMemo(
    () => filterCountData(query.data?.requestsByWasteType ?? [], top, sort),
    [query.data?.requestsByWasteType, top, sort]
  );

  const capacityByWasteType = useMemo(() => {
    const sorted = [...(query.data?.capacityByWasteType ?? [])].sort((a, b) =>
      sort === "desc" ? b.dailyCapacity - a.dailyCapacity : a.dailyCapacity - b.dailyCapacity
    );
    return sorted.slice(0, toTopLimit(top));
  }, [query.data?.capacityByWasteType, top, sort]);

  const collectedQuantityByMonth = useMemo(
    () => filterLatestMonthsValue(query.data?.collectedQuantityByMonth ?? [], months),
    [query.data?.collectedQuantityByMonth, months]
  );

  const collectedQuantityByWasteType = useMemo(
    () => filterValueData(query.data?.collectedQuantityByWasteType ?? [], top, sort),
    [query.data?.collectedQuantityByWasteType, top, sort]
  );

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Không thể tải biểu đồ doanh nghiệp." />;

  return (
    <div className="space-y-4">
      <FilterBar
        top={top}
        sort={sort}
        months={months}
        onTopChange={setTop}
        onSortChange={setSort}
        onMonthChange={setMonths}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <CountLineChartCard title="Yêu cầu theo tháng" data={requestsByMonth} />
        <CountBarChartCard title="Yêu cầu theo trạng thái" data={requestsByStatus} />
        <CountPieChartCard title="Bằng chứng theo trạng thái duyệt" data={proofsByReviewStatus} />
        <CountBarChartCard title="Yêu cầu theo loại rác" data={requestsByWasteType} />
        <EnterpriseCapacityChartCard data={capacityByWasteType} />
        <ValueLineChartCard title="Khối lượng thu gom theo tháng" data={collectedQuantityByMonth} />
        <ValueBarChartCard title="Khối lượng thu gom theo loại rác" data={collectedQuantityByWasteType} />
      </div>
    </div>
  );
};

export const CollectorDashboardCharts = () => {
  const [top, setTop] = useState<TopFilter>("all");
  const [sort, setSort] = useState<SortFilter>("desc");
  const [months, setMonths] = useState<MonthFilter>("all");

  const query = useQuery({
    queryKey: ["collectorDashboard"],
    queryFn: () => dashboardService.getCollector(),
  });

  const assignmentsByMonth = useMemo(
    () => filterLatestMonthsCount(query.data?.assignmentsByMonth ?? [], months),
    [query.data?.assignmentsByMonth, months]
  );

  const assignmentsByStatus = useMemo(
    () =>
      filterCountData(
        query.data?.assignmentsByStatus.map((item) => ({
          ...item,
          label: mapLabel(item.label, requestStatusLabelMap),
        })) ?? [],
        top,
        sort
      ),
    [query.data?.assignmentsByStatus, top, sort]
  );

  const proofsByReviewStatus = useMemo(
    () =>
      filterCountData(
        query.data?.proofsByReviewStatus.map((item) => ({
          ...item,
          label: mapLabel(item.label, proofStatusLabelMap),
        })) ?? [],
        top,
        sort
      ),
    [query.data?.proofsByReviewStatus, top, sort]
  );

  const assignmentsByRegion = useMemo(
    () => filterCountData(query.data?.assignmentsByRegion ?? [], top, sort),
    [query.data?.assignmentsByRegion, top, sort]
  );

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Không thể tải biểu đồ thu gom." />;

  return (
    <div className="space-y-4">
      <FilterBar
        top={top}
        sort={sort}
        months={months}
        onTopChange={setTop}
        onSortChange={setSort}
        onMonthChange={setMonths}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <CountLineChartCard title="Đơn thu gom theo tháng" data={assignmentsByMonth} />
        <CountPieChartCard title="Đơn theo trạng thái" data={assignmentsByStatus} />
        <CountPieChartCard title="Bằng chứng theo trạng thái duyệt" data={proofsByReviewStatus} />
        <CountBarChartCard title="Đơn theo khu vực" data={assignmentsByRegion} />
      </div>
    </div>
  );
};
