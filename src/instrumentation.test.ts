import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { register } from "./instrumentation";

const prewarm = vi.hoisted(() => vi.fn<() => Promise<void>>());
vi.mock("./lib/a11y/audio-server", () => ({ prewarmAudioWorker: prewarm }));

beforeEach(() => {
  prewarm.mockReset().mockResolvedValue(undefined);
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("NEXT_PHASE", "phase-production-server");
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Audio startup instrumentation", () => {
  it("waits for preparation before completing server startup", async () => {
    let ready!: () => void;
    prewarm.mockImplementation(() => new Promise<void>((resolve) => { ready = resolve; }));
    let registered = false;
    const startup = register().then(() => { registered = true; });
    await vi.waitFor(() => expect(prewarm).toHaveBeenCalledOnce());
    expect(registered).toBe(false);
    ready(); await startup;
    expect(registered).toBe(true);
  });

  it("skips model initialization in build and Edge runtimes", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    await register();
    vi.stubEnv("NEXT_PHASE", "phase-production-server");
    vi.stubEnv("NEXT_RUNTIME", "edge");
    await register();
    expect(prewarm).not.toHaveBeenCalled();
  });

  it("allows server startup if preparation fails without logging error details", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    prewarm.mockRejectedValueOnce(new Error("private filesystem details"));
    await expect(register()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    expect(JSON.stringify(warn.mock.calls)).not.toContain("private filesystem details");
  });
});
