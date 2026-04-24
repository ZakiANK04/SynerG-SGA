import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { API_BASE_URL } from "../lib/api";
import { Button } from "./ui/button";

function parseMarkdown(content) {
  const lines = String(content || "").split(/\r?\n/);
  const blocks = [];
  let paragraphLines = [];

  function flushParagraph() {
    if (!paragraphLines.length) {
      return;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphLines.join(" "),
    });
    paragraphLines = [];
  }

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushParagraph();
      return;
    }

    if (trimmedLine.startsWith("### ")) {
      flushParagraph();
      blocks.push({
        type: "heading",
        content: trimmedLine.slice(4),
      });
      return;
    }

    paragraphLines.push(trimmedLine);
  });

  flushParagraph();
  return blocks;
}

export function PitchMarkdown({ content, muted = false }) {
  const blocks = parseMarkdown(content);

  if (!blocks.length) {
    return (
      <p className={muted ? "text-slate-400" : "text-[#6B7280]"}>
        Aucun argumentaire disponible.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) =>
        block.type === "heading" ? (
          <h3
            className={muted ? "text-lg font-bold text-[#E60028]" : "text-base font-bold text-[#E60028]"}
            key={`${block.type}-${index}`}
          >
            {block.content}
          </h3>
        ) : (
          <p
            className={muted ? "leading-7 text-slate-100/88" : "leading-7 text-[#374151]"}
            key={`${block.type}-${index}`}
          >
            {block.content}
          </p>
        ),
      )}
    </div>
  );
}

export function LLMPitchStream({ clientId, disabled = false, onGenerated, productName }) {
  const abortRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pitchText, setPitchText] = useState("");
  const [modelName, setModelName] = useState("mistral");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function closeModal() {
    abortRef.current?.abort();
    setIsOpen(false);
    setIsStreaming(false);
  }

  async function startStreaming() {
    if (!clientId || !productName) {
      toast.error("Selectionnez un client et un produit avant de lancer le pitch.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsOpen(true);
    setIsStreaming(true);
    setPitchText("");
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-pitch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          product_name: productName,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorPayload = response.headers.get("content-type")?.includes("application/json")
          ? await response.json()
          : await response.text();
        const message =
          (typeof errorPayload === "object" && errorPayload?.detail) ||
          (typeof errorPayload === "string" && errorPayload) ||
          "Le flux Ollama n'a pas pu demarrer.";
        throw new Error(message);
      }

      setModelName(response.headers.get("X-LLM-Model") || "mistral");

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Le navigateur n'a pas recu de flux lisible.");
      }

      const decoder = new TextDecoder("utf-8");
      let aggregatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) {
          continue;
        }

        aggregatedText += chunk;
        setPitchText((current) => current + chunk);
      }

      const finalPitch = aggregatedText.trim();
      if (!finalPitch) {
        throw new Error("Ollama n'a retourne aucun contenu exploitable.");
      }

      onGenerated?.(finalPitch);
      toast.success("Pitch IA genere en local.");
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      const message = error?.message || "Impossible de generer le pitch IA.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <>
      <Button className="rounded-xl" disabled={disabled || isStreaming} onClick={startStreaming} type="button">
        {isStreaming ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generer Pitch IA
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-sm">
          <div className="relative max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#E60028]/30 bg-slate-900/80 shadow-[0_24px_80px_rgba(2,6,23,0.65)] backdrop-blur-md">
            <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(230,0,40,0.18),transparent_36%)] px-6 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Shadow Pitch
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Argumentaire IA local</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Produit {productName} · Modele {modelName}
                  </p>
                </div>

                <button
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                  onClick={closeModal}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(88vh-148px)] overflow-y-auto px-6 py-6 sm:px-8">
              {pitchText ? (
                <PitchMarkdown content={pitchText} muted />
              ) : isStreaming ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <LoaderCircle className="size-4 animate-spin text-[#E60028]" />
                    Generation du pitch en cours...
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
                    <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/10" />
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {errorMessage}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Aucun contenu genere.</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4 sm:px-8">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                100% local · Ollama · Mistral
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={closeModal}
                  type="button"
                  variant="outline"
                >
                  Fermer
                </Button>
                <Button className="rounded-xl" disabled={isStreaming} onClick={startStreaming} type="button">
                  {isStreaming ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Relancer
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
