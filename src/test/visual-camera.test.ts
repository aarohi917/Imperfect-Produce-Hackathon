import { describe, expect, it, vi } from "vitest";
import { openVisualCamera } from "@/lib/visual-camera";

describe("visual camera recovery", () => {
  it("retries with any camera when preferred constraints fail", async () => {
    const stream = {} as MediaStream;
    const getUserMedia = vi.fn().mockRejectedValueOnce(new DOMException("Unsupported", "OverconstrainedError")).mockResolvedValueOnce(stream);
    expect(await openVisualCamera({ getUserMedia })).toBe(stream);
    expect(getUserMedia).toHaveBeenLastCalledWith({ video: true, audio: false });
  });
  it("does not repeatedly request denied camera permission", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    await expect(openVisualCamera({ getUserMedia })).rejects.toMatchObject({ name: "NotAllowedError" });
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });
});