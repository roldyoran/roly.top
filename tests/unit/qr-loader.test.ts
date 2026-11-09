import { describe, it, expect } from "vitest";
import { QrLoadError, loadQrCtor } from "@/lib/qr-loader";

class FakeQr {
  constructor(public options: unknown) {}
}

describe("loadQrCtor", () => {
  it("returns the module when the default export is a constructor", async () => {
    const mod = await loadQrCtor(async () => ({ default: FakeQr }));
    expect(mod.default).toBe(FakeQr);
    expect(new mod.default({ data: "x" })).toBeInstanceOf(FakeQr);
  });

  it("throws QrLoadError when the dynamic import fails", async () => {
    await expect(
      loadQrCtor(async () => {
        throw new TypeError("Failed to fetch dynamically imported module");
      }),
    ).rejects.toBeInstanceOf(QrLoadError);
  });

  it("throws QrLoadError when the module is malformed", async () => {
    await expect(loadQrCtor(async () => null)).rejects.toBeInstanceOf(
      QrLoadError,
    );
    await expect(loadQrCtor(async () => ({}))).rejects.toBeInstanceOf(
      QrLoadError,
    );
    await expect(
      loadQrCtor(async () => ({ default: 42 })),
    ).rejects.toBeInstanceOf(QrLoadError);
  });
});
