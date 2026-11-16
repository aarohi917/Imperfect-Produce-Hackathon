import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InferenceSession } from "onnxruntime-web/webgpu";
import { detectYolo, loadYolo, NAMES } from "@/lib/yolo";

const ortMock = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("onnxruntime-web/webgpu", () => ({
  env: { wasm: {} },
  InferenceSession: { create: ortMock.create },
  Tensor: class Tensor {
    constructor(readonly type: string, readonly data: Float32Array, readonly dims: number[]) {}
  },
}));

function mockCanvas() {
  const context = {
    fillStyle: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(640 * 640 * 4) })),
  };
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn(() => context),
  });
  return context;
}

function mockVideo(width: number, height: number) {
  const video = document.createElement("video");
  Object.defineProperties(video, {
    videoWidth: { configurable: true, value: width },
    videoHeight: { configurable: true, value: height },
  });
  return video;
}

describe("YOLO detection", () => {
  beforeEach(() => {
    ortMock.create.mockReset();
    mockCanvas();
  });

  it("loads the supplied model with WebGPU and WASM fallback", async () => {
    const session = { inputNames: ["images"], outputNames: ["output0"] };
    ortMock.create.mockResolvedValue(session);
    await expect(loadYolo("https://example.com/produce.onnx")).resolves.toBe(session);
    expect(ortMock.create).toHaveBeenCalledWith("https://example.com/produce.onnx", {
      executionProviders: ["webgpu", "wasm"],
    });
  });

  it("restores letterboxed coordinates and suppresses same-class duplicates", async () => {
    const data = new Float32Array(5 * 2);
    for (let i = 0; i < 2; i++) {
      data[i] = 320;
      data[2 + i] = 320;
      data[4 + i] = 160;
      data[6 + i] = 80;
      data[8 + i] = i ? 0.8 : 0.9;
    }
    const run = vi.fn(async () => ({ output0: { data, dims: [1, 5, 2] } }));
    const session = { inputNames: ["images"], outputNames: ["output0"], run } as unknown as InferenceSession;

    const result = await detectYolo(session, mockVideo(1280, 720));

    expect(result).toHaveLength(1);
    expect(result[0]?.class).toBe(NAMES[0]);
    expect(result[0]?.bbox).toEqual([480, 280, 320, 160]);
    expect(run).toHaveBeenCalledOnce();
  });
});
