"use client";

import { useState, useRef, useCallback } from "react";

const SUGGESTED_TOPICS = [
  "Scaling laws and their implications for AGI",
  "The alignment problem: current approaches and open questions",
  "Consciousness and machine sentience debates",
  "Transformer architecture limitations for general reasoning",
  "Neurosymbolic approaches to AGI",
  "Recursive self-improvement and intelligence explosion",
  "Embodied cognition: does AGI need a body?",
  "World models and causal reasoning in AI",
];

type ResearchEntry = {
  id: string;
  topic: string;
  content: string;
  depth: string;
  timestamp: Date;
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"brief" | "standard" | "deep">(
    "standard"
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentContent, setCurrentContent] = useState("");
  const [history, setHistory] = useState<ResearchEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<ResearchEntry | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const research = useCallback(
    async (researchTopic: string) => {
      if (!researchTopic.trim() || isStreaming) return;

      setIsStreaming(true);
      setCurrentContent("");
      setActiveEntry(null);

      abortRef.current = new AbortController();

      try {
        const response = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: researchTopic.trim(), depth }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Research request failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                fullContent += parsed.text;
                setCurrentContent(fullContent);
              } catch {
                // skip malformed chunks
              }
            }
          }
        }

        const entry: ResearchEntry = {
          id: crypto.randomUUID(),
          topic: researchTopic.trim(),
          content: fullContent,
          depth,
          timestamp: new Date(),
        };
        setHistory((prev) => [entry, ...prev]);
        setActiveEntry(entry);
        setCurrentContent("");
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setCurrentContent(`**Error:** ${err.message}`);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [depth, isStreaming]
  );

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const displayContent = currentContent || activeEntry?.content || "";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-surface border-r border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-accent-light">AGI</span> Research Lab
          </h1>
          <p className="text-xs text-muted mt-1">
            AI-powered intelligence research
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-muted uppercase tracking-wider px-2 mb-2">
            Research History
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-muted/60 px-2 py-4">
              No research yet. Start exploring AGI topics.
            </p>
          ) : (
            <div className="space-y-1">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setActiveEntry(entry);
                    setCurrentContent("");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeEntry?.id === entry.id
                      ? "bg-accent/20 text-accent-light"
                      : "hover:bg-surface-light text-foreground/80"
                  }`}
                >
                  <div className="font-medium truncate">{entry.topic}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {entry.depth} &middot;{" "}
                    {entry.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Input area */}
        <div className="border-b border-border p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && research(topic)}
                placeholder="Enter an AGI research topic..."
                className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 placeholder:text-muted/50 transition-colors"
                disabled={isStreaming}
              />
              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="px-5 py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => research(topic)}
                  disabled={!topic.trim()}
                  className="px-5 py-3 bg-accent hover:bg-accent-light text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  Research
                </button>
              )}
            </div>

            {/* Depth selector */}
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-muted">Depth:</span>
              {(["brief", "standard", "deep"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    depth === d
                      ? "bg-accent/20 text-accent-light border border-accent/40"
                      : "text-muted hover:text-foreground border border-transparent"
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {displayContent ? (
              <div className="animate-fade-in">
                {isStreaming && (
                  <div className="flex items-center gap-2 mb-4 text-accent-light text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent-light animate-pulse-glow" />
                    Researching...
                  </div>
                )}
                <article
                  className="prose"
                  dangerouslySetInnerHTML={{
                    __html: markdownToHtml(displayContent),
                  }}
                />
              </div>
            ) : (
              /* Suggested topics */
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  Explore AGI Research
                </h2>
                <p className="text-sm text-muted mb-6">
                  Select a topic below or enter your own research question.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED_TOPICS.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTopic(t);
                        research(t);
                      }}
                      className="text-left p-4 rounded-xl border border-border bg-surface hover:bg-surface-light hover:border-accent/30 transition-all text-sm group"
                    >
                      <span className="text-foreground/90 group-hover:text-accent-light transition-colors">
                        {t}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Simple markdown-to-HTML converter for streaming content */
function markdownToHtml(md: string): string {
  let html = md
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Blockquotes
    .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    // Horizontal rules
    .replace(/^---$/gm, "<hr>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Paragraphs: wrap remaining lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (
        !trimmed ||
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<hr")
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}
