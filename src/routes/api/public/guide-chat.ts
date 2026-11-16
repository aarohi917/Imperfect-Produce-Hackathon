import { createFileRoute } from "@tanstack/react-router";
import { handleGuideChat } from "@/lib/guide-chat.server";

export const Route = createFileRoute("/api/public/guide-chat")({
  server: { handlers: { POST: ({ request }) => handleGuideChat(request) } },
});
