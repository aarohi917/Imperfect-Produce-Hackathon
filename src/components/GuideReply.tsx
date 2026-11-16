import { MessageResponse } from "@/components/ai-elements/message";

/** Markdown is rendered without raw HTML; plain older replies remain readable. */
export function GuideReply({ content }: { content: string }) {
  return (
    <div className="min-w-0 space-y-3 break-words leading-relaxed [overflow-wrap:anywhere]">
      <MessageResponse
        components={{
          h1: ({ children }) => (
            <h3 className="pt-2 text-lg font-bold leading-snug first:pt-0">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="pt-2 text-lg font-bold leading-snug first:pt-0">{children}</h3>
          ),
          h3: ({ children }) => (
            <h3 className="pt-2 text-lg font-bold leading-snug first:pt-0">{children}</h3>
          ),
          h4: ({ children }) => <h4 className="pt-2 text-base font-bold first:pt-0">{children}</h4>,
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc space-y-2 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-2 pl-5">{children}</ol>,
          table: ({ children }) => <div className="my-4 max-w-full overflow-x-auto border-y border-border"><table className="w-full text-left text-sm tabular-nums">{children}</table></div>,
          th: ({ children }) => <th className="border-b border-border bg-muted px-3 py-3 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-border px-3 py-3 align-top">{children}</td>,
        }}
      >
        {content}
      </MessageResponse>
    </div>
  );
}
