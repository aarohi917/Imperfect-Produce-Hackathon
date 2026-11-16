import { useEffect, useRef, useState } from "react";
import { loadYolo, detectYolo, Detection } from "@/lib/yolo";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { submitVisualReport } from "@/lib/visual-report.functions";
import { summarizeVisualItems } from "@/lib/visual-report";

const MODEL_URL = "https://lajnfcitcrpswybgjfwm.supabase.co/storage/v1/object/public/Models/yolov8s-worldv2.onnx";
const MAX_MISSED = 6;

type Quality = { score: number; grade: "Good" | "Fair" | "Poor"; blemishPct: number };
type Track = { id: number; label: string; score: number; box: [number, number, number, number]; missed: number; hits: number; quality?: Quality };

function rgb2hsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, max ? d / max : 0, max];
}
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };

function analyzeQuality(video: HTMLVideoElement, box: Track["box"], scratch: HTMLCanvasElement): Quality {
  const N = 48; scratch.width = N; scratch.height = N;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(video, box[0], box[1], box[2], box[3], 0, 0, N, N);
  const px = ctx.getImageData(0, 0, N, N).data;
  const pts: [number, number, number][] = [], hs: number[] = [], vs: number[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (x - N / 2) / (N / 2), dy = (y - N / 2) / (N / 2);
    if (dx * dx + dy * dy > 0.7) continue;
    const i = (y * N + x) * 4, [h, s, v] = rgb2hsv(px[i] ?? 0, px[i + 1] ?? 0, px[i + 2] ?? 0);
    pts.push([h, s, v]); hs.push(h); vs.push(v);
  }
  const mh = median(hs), mv = median(vs); let bad = 0;
  for (const [h, s, v] of pts) {
    const hd = Math.min(Math.abs(h - mh), 360 - Math.abs(h - mh));
    if (v < mv * 0.55 || (hd > 30 && s > 0.25 && v < mv * 0.85)) bad++;
  }
  const blemishPct = (bad / Math.max(pts.length, 1)) * 100;
  const score = Math.max(0, Math.round(100 - blemishPct * 2.5));
  return { score, grade: score >= 80 ? "Good" : score >= 55 ? "Fair" : "Poor", blemishPct: Math.round(blemishPct) };
}

const iou = (a: Track["box"], b: Track["box"]) => {
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[0] + a[2], b[0] + b[2]), y2 = Math.min(a[1] + a[3], b[1] + b[3]);
  const i = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return i / (a[2] * a[3] + b[2] * b[3] - i || 1);
};

function updateTracks(tracks: Track[], dets: Detection[], nextId: { n: number }): Track[] {
  const used = new Set<number>();
  for (const t of tracks) {
    let best = -1, bi = 0.3;
    dets.forEach((d, i) => { if (used.has(i) || d.class !== t.label) return; const v = iou(t.box, d.bbox); if (v > bi) { bi = v; best = i; } });
    if (best >= 0) {
      const d = dets[best];
      if (!d) continue;
      used.add(best);
      t.box = t.box.map((v, k) => 0.6 * (d.bbox[k] ?? v) + 0.4 * v) as Track["box"];
      t.score = d.score; t.missed = 0; t.hits++;
    } else t.missed++;
  }
  dets.forEach((d, i) => { if (!used.has(i)) tracks.push({ id: nextId.n++, label: d.class, score: d.score, box: d.bbox, missed: 0, hits: 1 }); });
  return tracks.filter((t) => t.missed <= MAX_MISSED);
}

export default function VisualIntelligence() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratch = useRef<HTMLCanvasElement | null>(null);
  const tracks = useRef<Track[]>([]);
  const nextId = useRef({ n: 1 });
  const ppcRef = useRef<number | null>(null);
  const [status, setStatus] = useState("Loading model…");
  const [view, setView] = useState<Track[]>([]);
  const [refCm, setRefCm] = useState(8);
  const [ppc, setPpc] = useState<number | null>(null);
  const [ms, setMs] = useState(0);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const submitReport = useServerFn(submitVisualReport);
  const qc = useQueryClient();
  const t = useT();

  async function sendReport() {
    if (sendingRef.current) return;
    const snapshot = tracks.current.filter(item => item.hits >= 2).map(item => ({
      id: item.id, type: item.label, confidence: item.score,
      sizeCm: ppcRef.current && Number.isFinite(ppcRef.current) && ppcRef.current > 0 ? Math.max(item.box[2], item.box[3]) / ppcRef.current : null,
      qualityScore: item.quality?.score ?? null, grade: item.quality?.grade ?? null, blemishPct: item.quality?.blemishPct ?? null,
    }));
    if (!snapshot.length) { toast.error(t("未检测到物品", "Nothing detected", "कुछ नहीं मिला", "काही आढळले नाही")); return; }
    const video = videoRef.current, overlay = canvasRef.current;
    if (!video || !overlay || video.readyState < 2) { toast.error(t("摄像头未就绪", "Camera not ready", "कैमरा तैयार नहीं", "कॅमेरा तयार नाही")); return; }
    sendingRef.current = true; setSending(true);
    let uploadedPath: string | null = null;
    try {
      const report = summarizeVisualItems(snapshot);
      const capture = document.createElement("canvas");
      capture.width = video.videoWidth; capture.height = video.videoHeight;
      const ctx = capture.getContext("2d");
      if (!ctx) throw new Error("Could not capture frame");
      ctx.drawImage(video, 0, 0); ctx.drawImage(overlay, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => capture.toBlob(b => b ? resolve(b) : reject(new Error("Could not capture frame")), "image/jpeg", 0.85));
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) throw new Error(t("请先登录以发送真实报告。", "Sign in to send a real report.", "वास्तविक रिपोर्ट भेजने के लिए साइन इन करें।", "खरा अहवाल पाठवण्यासाठी साइन इन करा."));
      const path = `${data.user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("harvest-photos").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw new Error("Could not upload report image");
      uploadedPath = path;
      await submitReport({ data: { photo_path: path, items: report.items } });
      uploadedPath = null;
      toast.success(t("报告已发送，核对员和CEO已收到通知。", "Report sent; Checkers and CEO notified.", "रिपोर्ट भेजी; जाँचकर्ता और CEO को सूचित किया।", "अहवाल पाठवला; पडताळणीकर्ते आणि CEO ला कळवले."));
      void qc.invalidateQueries({ queryKey: ["approvals"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["my-harvests"] });
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("harvest-photos").remove([uploadedPath]);
      toast.error(error instanceof Error ? error.message : "Could not send report");
    } finally { sendingRef.current = false; setSending(false); }
  }

  useEffect(() => {
    let stopped = false, stream: MediaStream | undefined;
    (async () => {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      const v = videoRef.current;
      if (!v) { stream.getTracks().forEach((t) => t.stop()); return; }
      scratch.current = document.createElement("canvas");
      v.srcObject = stream; await v.play();
      const session = await loadYolo(MODEL_URL);
      setStatus("Live");
      let lastQ = 0;
      while (!stopped) {
        const t0 = performance.now();
        if (v.readyState >= 2) {
          const dets = await detectYolo(session, v, 0.3);
          tracks.current = updateTracks(tracks.current, dets, nextId.current);
          const now = performance.now();
          if (now - lastQ > 400) {
            lastQ = now;
            const qualityCanvas = scratch.current;
            if (qualityCanvas) tracks.current.forEach((t) => { if (t.missed === 0) t.quality = analyzeQuality(v, clampBox(t.box, v), qualityCanvas); });
          }
          const shown = tracks.current.filter((t) => t.hits >= 2);
          draw(v, shown); setView([...shown]); setMs(Math.round(performance.now() - t0));
        }
        await new Promise((r) => setTimeout(r, 0));
      }
    })().catch((e) => setStatus("Error: " + e.message));
    return () => { stopped = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  function clampBox(b: Track["box"], v: HTMLVideoElement): Track["box"] {
    const x = Math.max(0, b[0]), y = Math.max(0, b[1]);
    return [x, y, Math.max(2, Math.min(b[2], v.videoWidth - x)), Math.max(2, Math.min(b[3], v.videoHeight - y))];
  }

  function draw(v: HTMLVideoElement, list: Track[]) {
    const c = canvasRef.current;
    if (!c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const g = c.getContext("2d");
    if (!g) return;
    g.lineWidth = 3; g.font = "bold 16px sans-serif";
    list.forEach((t) => {
      const [x, y, w, h] = t.box;
      const color = t.quality?.grade === "Poor" ? "#ef4444" : t.quality?.grade === "Fair" ? "#f59e0b" : "#22c55e";
      g.globalAlpha = t.missed > 0 ? 0.5 : 1;
      g.strokeStyle = color; g.strokeRect(x, y, w, h);
      const size = ppcRef.current ? ` ${(Math.max(w, h) / ppcRef.current).toFixed(1)}cm` : "";
      const txt = `#${t.id} ${t.label} ${Math.round(t.score * 100)}%${size}${t.quality ? ` · ${t.quality.grade}` : ""}`;
      g.fillStyle = color; g.fillRect(x, Math.max(0, y - 24), g.measureText(txt).width + 10, 24);
      g.fillStyle = "#000"; g.fillText(txt, x + 5, Math.max(17, y - 7));
    });
    g.globalAlpha = 1;
  }

  function calibrate() {
    const t = tracks.current.filter((t) => t.hits >= 2).sort((a, b) => b.score - a.score)[0];
    if (!t) return;
    const p = Math.max(t.box[2], t.box[3]) / refCm; ppcRef.current = p; setPpc(p);
  }

  const counts = view.reduce<Record<string, number>>((a, t) => ((a[t.label] = (a[t.label] || 0) + 1), a), {});

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr] p-4">
      <div className="min-w-0 space-y-3"><div className="relative w-full overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} className="w-full block" muted playsInline />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute top-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">{status} · {ms} ms/frame</div>
      </div><Button onClick={() => void sendReport()} disabled={sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? t("发送中…", "Sending…", "भेज रहे हैं…", "पाठवत आहे…") : t("发送报告", "Send Report", "रिपोर्ट भेजें", "अहवाल पाठवा")}</Button></div>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Visual Intelligence</h2>
          <p className="text-sm text-muted-foreground">Total items: <b>{view.length}</b></p>
          <ul className="text-sm">{Object.entries(counts).map(([k, n]) => <li key={k}>{k}: {n}</li>)}</ul>
        </div>
        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-sm font-medium">Size calibration</p>
          <p className="text-xs text-muted-foreground">Hold one item at scanning distance, enter its real width, then calibrate.</p>
          <div className="flex gap-2">
            <input type="number" value={refCm} onChange={(e) => setRefCm(+e.target.value)} className="w-20 rounded border px-2 py-1" />
            <span className="self-center text-sm">cm</span>
            <button onClick={calibrate} className="rounded bg-primary px-3 py-1 text-primary-foreground">Calibrate</button>
          </div>
          <p className="text-xs">{ppc ? `Calibrated: ${ppc.toFixed(1)} px/cm` : "Not calibrated, sizes hidden"}</p>
        </div>
        <div className="space-y-2">
          {view.map((t) => (
            <div key={t.id} className="rounded-lg border p-2 text-sm">
              <b>#{t.id} {t.label}</b> · {Math.round(t.score * 100)}% conf
              {ppc && <div>Size: ~{(Math.max(t.box[2], t.box[3]) / ppc).toFixed(1)} cm</div>}
              {t.quality && <div>Quality: {t.quality.grade} ({t.quality.score}/100) · blemish area {t.quality.blemishPct}%</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}