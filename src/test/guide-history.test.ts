import { describe, it, expect } from "vitest";
import { defaultChatTitle, messageText } from "@/lib/guide-history";
describe("Guide history rules", () => {
  it("uses the starting date and the user's actual topic for the default title", () => {
    expect(
      defaultChatTitle(
        "2026-11-14T09:15:00Z",
        "My profit margins are low, what should I check?",
        "en",
      ),
    ).toBe("November 14, 2026 – Profit Margins");
  });
  it("keeps each conversation's text separate when restoring message parts", () => {
    expect(
      messageText({ id: "a", role: "user", parts: [{ type: "text", text: "Low Profit Margins" }] }),
    ).toBe("Low Profit Margins");
    expect(
      messageText({
        id: "b",
        role: "user",
        parts: [{ type: "text", text: "Organic Aphid Control" }],
      }),
    ).toBe("Organic Aphid Control");
  });
});
