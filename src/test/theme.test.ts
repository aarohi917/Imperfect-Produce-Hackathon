import { describe, it, expect, beforeEach } from "vitest";
import { applyTheme, initializeTheme } from "@/lib/theme";

describe("appearance preferences", () => {
  beforeEach(() => { localStorage.removeItem("imperfect-produce-theme"); document.documentElement.classList.remove("dark"); });
  it("defaults to the light theme without a saved preference", () => {
    initializeTheme();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
  it("restores a selected dark theme", () => {
    applyTheme("dark");
    document.documentElement.classList.remove("dark");
    initializeTheme();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});