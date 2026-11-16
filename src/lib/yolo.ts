import * as ort from "onnxruntime-web/webgpu";
ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";

export const NAMES = ["apple","banana","orange","lemon","lime","grapefruit","pear","peach","plum","apricot","cherry","strawberry","blueberry","raspberry","grape","watermelon","cantaloupe","pineapple","mango","papaya","kiwi","pomegranate","avocado","coconut","fig","tomato","potato","sweet potato","onion","garlic","carrot","beet","radish","turnip","cucumber","zucchini","squash","pumpkin","eggplant","bell pepper","chili pepper","broccoli","cauliflower","cabbage","lettuce","spinach","kale","celery","asparagus","corn","green beans","peas","mushroom","ginger","leek","brussels sprouts","artichoke","okra"];

export type Detection = { class: string; score: number; bbox: [number, number, number, number] };
export type YoloDetector = ort.InferenceSession;

const SIZE = 640;
let off: HTMLCanvasElement | null = null;

export async function loadYolo(url: string) {
  return ort.InferenceSession.create(url, { executionProviders: ["webgpu", "wasm"] });
}

const iou = (a: number[], b: number[]) => {
  const x1 = Math.max(a[0]!, b[0]!), y1 = Math.max(a[1]!, b[1]!);
  const x2 = Math.min(a[0]! + a[2]!, b[0]! + b[2]!), y2 = Math.min(a[1]! + a[3]!, b[1]! + b[3]!);
  const i = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return i / (a[2]! * a[3]! + b[2]! * b[3]! - i || 1);
};

export async function detectYolo(
  session: ort.InferenceSession, video: HTMLVideoElement, conf = 0.3, iouT = 0.5
): Promise<Detection[]> {
  if (!off) { off = document.createElement("canvas"); off.width = off.height = SIZE; }
  const vw = video.videoWidth, vh = video.videoHeight;
  const s = Math.min(SIZE / vw, SIZE / vh), nw = Math.round(vw * s), nh = Math.round(vh * s);
  const dx = (SIZE - nw) / 2, dy = (SIZE - nh) / 2;
  const ctx = off.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#727272"; ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(video, dx, dy, nw, nh);
  const px = ctx.getImageData(0, 0, SIZE, SIZE).data, A = SIZE * SIZE;
  const inp = new Float32Array(3 * A);
  for (let i = 0; i < A; i++) { inp[i] = px[i * 4]! / 255; inp[A + i] = px[i * 4 + 1]! / 255; inp[2 * A + i] = px[i * 4 + 2]! / 255; }
  const inputName = session.inputNames[0]!, outputName = session.outputNames[0]!;
  const out = await session.run({ [inputName]: new ort.Tensor("float32", inp, [1, 3, SIZE, SIZE]) });
  const t = out[outputName]!, d = t.data as Float32Array, n = t.dims[2]!, nc = t.dims[1]! - 4;

  const cands: Detection[] = [];
  for (let i = 0; i < n; i++) {
    let best = 0, id = -1;
    for (let k = 0; k < nc; k++) { const sc = d[(4 + k) * n + i]!; if (sc > best) { best = sc; id = k; } }
    if (best < conf) continue;
    const cx = d[i]!, cy = d[n + i]!, w = d[2 * n + i]!, h = d[3 * n + i]!;
    cands.push({ class: NAMES[id] ?? `class ${id}`, score: best, bbox: [(cx - w / 2 - dx) / s, (cy - h / 2 - dy) / s, w / s, h / s] });
  }
  cands.sort((a, b) => b.score - a.score);
  const keep: Detection[] = [];
  for (const c of cands) if (!keep.some((k) => k.class === c.class && iou(k.bbox as number[], c.bbox as number[]) > iouT)) keep.push(c);
  return keep;
}
