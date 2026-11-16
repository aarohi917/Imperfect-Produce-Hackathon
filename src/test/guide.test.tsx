import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuideChat } from "@/components/GuideChat";
vi.mock("@/lib/auth", () => ({ useMe: () => ({data:{isManagement:false}}) }));
vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({ messages: [], sendMessage: vi.fn(), status: "ready" }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/components/ai-elements/conversation", () => ({
  Conversation: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ConversationContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ConversationScrollButton: () => null,
}));
vi.mock("@/components/ai-elements/message", () => ({
  Message: () => null,
  MessageContent: () => null,
  MessageResponse: () => null,
}));
vi.mock("@/components/ai-elements/prompt-input", () => ({
  PromptInput: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PromptInputTextarea: ({ ref }: { ref: React.Ref<HTMLTextAreaElement> }) => <textarea ref={ref} />,
  PromptInputFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PromptInputSubmit: () => null,
}));
vi.mock("@/components/ai-elements/shimmer", () => ({ Shimmer: () => null }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("Guide browser lifecycle", () => {
  it("does not register a browser focus wrapper return value as cleanup", () => {
    const focus = vi
      .spyOn(HTMLElement.prototype, "focus")
      .mockImplementation(() => ({ focused: true }) as unknown as void);
    const { unmount } = render(<GuideChat threadId="thread-one" initialMessages={[]} />);
    expect(focus).toHaveBeenCalled();
    expect(() => unmount()).not.toThrow();
  });
});
