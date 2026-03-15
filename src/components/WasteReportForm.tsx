import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Search, ChevronDown, ChevronLeft, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { wasteTypeService, WasteType } from "@/services/wasteType";
import { CreateWasteReportRequest, WasteItem } from "@/services/wasteReport";

export type WasteReportFormValues = {
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  wastes: WasteItem[];
  imageFiles?: File[];
  imageUrls?: string[]; // existing uploaded urls (for edit)
};

export type WasteReportFormProps = {
  initialValues?: WasteReportFormValues;
  onSubmit: (data: CreateWasteReportRequest & { images?: string[] }) => void;
  onCancel?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  onReset?: () => void;
};

export default function WasteReportForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Gửi báo cáo",
  submitDisabled,
  isSubmitting,
  onReset,
}: WasteReportFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>(initialValues?.imageFiles ?? []);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>(initialValues?.imageUrls ?? []);

  const [wtDropdownOpen, setWtDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [wtSearch, setWtSearch] = useState("");

  const [selectedWasteTypeIds, setSelectedWasteTypeIds] = useState<string[]>(
    initialValues?.wastes.map((w) => w.wasteTypeId) ?? []
  );

  const [form, setForm] = useState({
    description: initialValues?.description ?? "",
    address: initialValues?.address ?? "",
    latitude: initialValues?.latitude,
    longitude: initialValues?.longitude,
  });

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => {
      // keep existing urls from initialValues if no new files
      if (imageFiles.length === 0 && initialValues?.imageUrls) return initialValues.imageUrls;
      return urls;
    });
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles, initialValues?.imageUrls]);

  useEffect(() => {
    if (!initialValues) return;
    setForm({
      description: initialValues.description ?? "",
      address: initialValues.address ?? "",
      latitude: initialValues.latitude,
      longitude: initialValues.longitude,
    });
    setSelectedWasteTypeIds(initialValues.wastes.map((w) => w.wasteTypeId));
    setImagePreviewUrls(initialValues.imageUrls ?? []);
    setImageFiles(initialValues.imageFiles ?? []);
  }, [initialValues]);

  const { data: allWasteTypes = [] } = useQuery({
    queryKey: ["wasteTypes"],
    queryFn: () => wasteTypeService.getAll(),
  });
  const wasteTypes = allWasteTypes.filter((w) => w.isActive !== false);

  const groupedWasteTypes = useMemo(() => {
    const groups: Record<number, WasteType[]> = {};
    wasteTypes.forEach((w) => {
      const cat = w.category ?? 0;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(w);
    });
    return groups;
  }, [wasteTypes]);

  const selectedWasteTypes = useMemo(() => {
    return selectedWasteTypeIds
      .map((id) => wasteTypes.find((w) => w.id === id))
      .filter(Boolean) as WasteType[];
  }, [selectedWasteTypeIds, wasteTypes]);

  const hasHazardous = selectedWasteTypes.some((w) => w.isHazardous);

  const toggleWasteType = (id: string) => {
    setSelectedWasteTypeIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const filteredWasteTypes = useMemo(() => {
    const search = wtSearch.trim().toLowerCase();
    const list = selectedCategory == null ? wasteTypes : groupedWasteTypes[selectedCategory] ?? [];
    if (!search) return list;
    return list.filter((wt) => wt.name.toLowerCase().includes(search));
  }, [wtSearch, selectedCategory, wasteTypes, groupedWasteTypes]);

  const selectedWastes: WasteItem[] = useMemo(() => {
    const map: Record<string, WasteItem> = {};
    (initialValues?.wastes ?? []).forEach((w) => {
      map[w.wasteTypeId] = { ...w };
    });

    selectedWasteTypeIds.forEach((wtId) => {
      if (!map[wtId]) {
        map[wtId] = { wasteTypeId: wtId, quantity: 1, note: "", images: [] };
      }
    });

    // Keep order consistent with selection
    return selectedWasteTypeIds.map((id) => map[id]);
  }, [initialValues?.wastes, selectedWasteTypeIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateWasteReportRequest & { images?: string[] } = {
      description: form.description,
      latitude: form.latitude,
      longitude: form.longitude,
      wastes: selectedWastes,
    };

    // If we have uploaded files, they will be handled in the backend (assume images field)
    if (imagePreviewUrls.length > 0) {
      payload.images = imagePreviewUrls;
    }

    onSubmit(payload);
  };

  const isSubmitDisabled =
    submitDisabled ||
    isSubmitting ||
    selectedWasteTypeIds.length === 0 ||
    imagePreviewUrls.length === 0 ||
    !form.latitude ||
    !form.address;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-2">
      <div>
        <Label>Loại rác *</Label>
        <div className="relative mt-1">
          <div
            className="min-h-10 cursor-pointer rounded-md border border-input bg-background px-3 py-2 pr-16 text-sm ring-offset-background transition-colors hover:border-primary focus-within:ring-2 focus-within:ring-ring"
            onClick={() => setWtDropdownOpen((v) => !v)}
          >
            {selectedWasteTypeIds.length === 0 ? (
              <span className="text-muted-foreground">Chọn tối đa 5 loại rác</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedWasteTypeIds.map((id) => {
                  const wt = wasteTypes.find((w) => w.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {wt?.name ?? id}
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleWasteType(id); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
              {selectedWasteTypeIds.length > 0 && (
                <span className="text-[11px] font-medium text-muted-foreground">{selectedWasteTypeIds.length}/5</span>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {wtDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setWtDropdownOpen(false); setWtSearch(""); setSelectedCategory(null); }} />
              <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                {selectedCategory === null ? (
                  <div className="p-2">
                    <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Chọn danh mục
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 0, label: "Hữu cơ" },
                        { value: 1, label: "Tái chế" },
                        { value: 2, label: "Nguy hại" },
                        { value: 3, label: "Khác" },
                      ].map((cat) => {
                        const count = (groupedWasteTypes[cat.value] ?? []).length;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat.value); setWtSearch(""); }}
                            className="flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-colors border-border hover:bg-muted"
                          >
                            <span className="text-xs font-semibold">{cat.label}</span>
                            <span className="text-[10px] text-muted-foreground">{count} loại</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); setSelectedCategory(null); setWtSearch(""); }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Quay lại danh mục</span>
                    </button>
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        autoFocus
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Tìm loại rác..."
                        value={wtSearch}
                        onChange={(e) => setWtSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {filteredWasteTypes.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs text-muted-foreground">Không tìm thấy loại rác</p>
                      ) : (
                        filteredWasteTypes.map((wt) => {
                          const selected = selectedWasteTypeIds.includes(wt.id);
                          return (
                            <div
                              key={wt.id}
                              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted ${
                                selected ? "bg-primary/5 font-medium text-primary" : ""
                              }`}
                              onClick={(e) => { e.stopPropagation(); toggleWasteType(wt.id); }}
                            >
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                selected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                              }`}>
                                {selected && <span className="text-[10px] leading-none">✓</span>}
                              </span>
                              <span className="truncate">{wt.name}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <p className="mt-1 text-xs text-muted-foreground">Bạn có thể chọn tối đa 5 loại rác trong một báo cáo.</p>
        {hasHazardous && (
          <div className="mt-1.5 flex items-start gap-2 rounded-md border-l-4 border-orange-400 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span>Loại rác nguy hại cần chú ý khi đóng gói và vận chuyển.</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label>Mô tả</Label>
          <textarea
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label>Địa chỉ chi tiết *</Label>
          <Input
            className="mt-1"
            placeholder="Số nhà, đường, phường..."
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Latitude *</Label>
            <Input
              className="mt-1"
              type="number"
              step="any"
              value={form.latitude ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div>
            <Label>Longitude *</Label>
            <Input
              className="mt-1"
              type="number"
              step="any"
              value={form.longitude ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
        </div>

        <div>
          <Label>Ảnh (tối đa 5)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setImageFiles((prev) => [...prev, ...files]);
              e.target.value = "";
            }}
          />
          <div
            className="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted p-3 transition-colors hover:border-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreviewUrls.length === 0 ? (
              <div className="text-center">
                <Plus className="mx-auto h-6 w-6 text-muted-foreground" />
                <span className="mt-1 block text-xs text-muted-foreground">Chụp / tải ảnh lên</span>
              </div>
            ) : (
              <div className="flex w-full flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {imagePreviewUrls.map((url, i) => (
                  <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                    <img src={url} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                      onClick={() => {
                        setImageFiles((prev) => prev.filter((_, j) => j !== i));
                        setImagePreviewUrls((prev) => prev.filter((_, j) => j !== i));
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                <div
                  className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-background hover:border-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Chụp rõ toàn bộ đống rác để xác nhận nhanh hơn.</p>
        </div>

        <div>
          <Label>Vị trí GPS *</Label>
          <div className="mt-1 flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1 gap-2" onClick={() => {
              if (!navigator.geolocation) {
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const lat = pos.coords.latitude;
                  const lng = pos.coords.longitude;
                  setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
                },
                () => {},
              );
            }}>
              {form.latitude ? `${form.latitude.toFixed(5)}, ${form.longitude?.toFixed(5)}` : "GPS tự động"}
            </Button>
          </div>
        </div>

        <div>
          <Label>Địa chỉ chi tiết *</Label>
          <Input
            className="mt-1"
            placeholder="Số nhà, đường, phường..."
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div className="space-y-0.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {selectedWasteTypeIds.length === 0 && <li>• Chọn ít nhất 1 loại rác</li>}
          {imagePreviewUrls.length === 0 && <li>• Thêm ít nhất 1 ảnh</li>}
          {!form.latitude && <li>• Xác định vị trí GPS</li>}
          {!form.address && <li>• Nhập địa chỉ chi tiết</li>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitDisabled}>
            {isSubmitting ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang gửi...</>
            ) : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
