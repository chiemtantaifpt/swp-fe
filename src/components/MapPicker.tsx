import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Check } from "lucide-react";

// Fix Leaflet default icon bị vỡ khi bundle với Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Icon "vị trí của bạn" màu xanh dương
const myLocationIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#3b82f6;border:3px solid white;
    box-shadow:0 0 0 3px rgba(59,130,246,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface LatLng {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

// Tự định vị khi map mở (chỉ khi chưa có tọa độ sẵn)
function AutoLocate({
  onLocated,
  skip,
}: {
  onLocated: (ll: LatLng) => void;
  skip: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (skip) return;
    map.locate({ setView: true, maxZoom: 16 });
    map.once("locationfound", (e) => {
      onLocated({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
  }, []);
  return null;
}

// Nút "về vị trí của tôi" góc trên phải bản đồ
function LocateMeButton({ onLocated }: { onLocated: (ll: LatLng) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  const locate = () => {
    setLoading(true);
    map.locate({ setView: true, maxZoom: 16 });
    map.once("locationfound", (e) => {
      onLocated({ lat: e.latlng.lat, lng: e.latlng.lng });
      setLoading(false);
    });
    map.once("locationerror", () => setLoading(false));
  };
  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: "auto" }}>
      <div className="leaflet-control leaflet-bar">
        <button
          title="Về vị trí của tôi"
          onClick={locate}
          style={{
            width: 30, height: 30, display: "flex", alignItems: "center",
            justifyContent: "center", background: "white", cursor: "pointer",
            border: "none", fontSize: 16,
          }}
        >
          {loading ? "⏳" : "📍"}
        </button>
      </div>
    </div>
  );
}

// Component nội bộ: lắng nghe click trên map
function ClickHandler({ onPick }: { onPick: (ll: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({ open, onClose, onConfirm, initialLat, initialLng }: MapPickerProps) {
  // Mặc định: TP.HCM
  const defaultCenter: [number, number] = [initialLat ?? 10.7769, initialLng ?? 106.7009];
  const [selected, setSelected] = useState<LatLng | null>(
    initialLat != null ? { lat: initialLat, lng: initialLng! } : null
  );
  const [myLocation, setMyLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loadingAddr, setLoadingAddr] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddr(true);
    setAddress("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`,
        { headers: { "Accept-Language": "vi" } }
      );
      const data = await res.json();
      if (data.display_name) setAddress(data.display_name);
    } catch {
      // bỏ qua nếu không lấy được địa chỉ
    } finally {
      setLoadingAddr(false);
    }
  };

  const handlePick = (ll: LatLng) => {
    setSelected(ll);
    reverseGeocode(ll.lat, ll.lng);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected.lat, selected.lng, address || undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="font-display flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Chọn vị trí trên bản đồ
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Click vào bất kỳ vị trí nào để chọn tọa độ</p>
        </DialogHeader>

        {/* Map */}
        <div className="relative h-[400px] w-full">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {/* Tự định vị khi mở, chỉ chạy nếu chưa có tọa độ ban đầu */}
            <AutoLocate
              skip={initialLat != null}
              onLocated={(ll) => {
                setMyLocation(ll);
                if (!selected) {
                  setSelected(ll);
                  reverseGeocode(ll.lat, ll.lng);
                }
              }}
            />
            {/* Nút 📍 góc trên phải */}
            <LocateMeButton
              onLocated={(ll) => {
                setMyLocation(ll);
                setSelected(ll);
                reverseGeocode(ll.lat, ll.lng);
              }}
            />
            <ClickHandler onPick={handlePick} />
            {/* Chấm xanh = vị trí thật của thiết bị */}
            {myLocation && (
              <Marker position={[myLocation.lat, myLocation.lng]} icon={myLocationIcon} />
            )}
            {/* Ghim đỏ = vị trí người dùng chọn */}
            {selected && !(selected.lat === myLocation?.lat && selected.lng === myLocation?.lng) && (
              <Marker position={[selected.lat, selected.lng]} />
            )}
          </MapContainer>

          {/* Overlay hint khi chưa chọn */}
          {!selected && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[999]">
              <div className="rounded-lg bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm">
                Click vào bản đồ để đặt ghim 📍
              </div>
            </div>
          )}
          {/* Chú giải */}
          {myLocation && (
            <div className="absolute bottom-2 left-2 z-[999] flex flex-col gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs shadow backdrop-blur-sm">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-500 ring-2 ring-blue-200" />
                Vị trí của bạn
              </span>
              <span className="flex items-center gap-1.5">
                <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" className="h-4" />
                Vị trí đã chọn
              </span>
            </div>
          )}
        </div>

        {/* Footer: địa chỉ + buttons */}
        <div className="flex flex-col gap-3 px-4 py-3">
          {selected && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
              </div>
              {loadingAddr ? (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang tìm địa chỉ...
                </div>
              ) : address ? (
                <p className="mt-1 text-xs text-foreground leading-snug">{address}</p>
              ) : null}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Hủy</Button>
            <Button
              size="sm"
              disabled={!selected}
              onClick={handleConfirm}
              className="gap-1.5"
            >
              <Check className="h-4 w-4" />
              Xác nhận vị trí
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
