import { useEffect, useMemo, useRef, useState } from "react";
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

function formatCurrency(value) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} DA`;
}

function getFluxTrendLabel(summary) {
  const ratio = Number(summary?.flux_change_ratio || 0);

  if (ratio >= 0.15) {
    return "une dynamique de flux créditeurs en forte hausse";
  }
  if (ratio >= 0.03) {
    return "une dynamique de flux créditeurs orientée à la hausse";
  }
  if (ratio <= -0.15) {
    return "une tendance marquée des flux créditeurs en baisse";
  }
  if (ratio <= -0.03) {
    return "une légère contraction des flux créditeurs";
  }
  return "des flux créditeurs globalement stables";
}

function getPrimaryObjection(summary, recommendation) {
  const confidence = Number(recommendation?.confidence_pct || 0);
  const churn = Boolean(summary?.churn_alert_flag);
  const fluxConfie = Number(summary?.flux_confie_pct || 0);

  if (churn) {
    return {
      objection:
        "Le client peut craindre d'engager une nouvelle solution alors que la relation doit d'abord être sécurisée.",
      rebuttal:
        "Justement, la proposition vise à restaurer de la valeur immédiate avec un bénéfice simple, visible et rapide à activer.",
    };
  }

  if (fluxConfie < 25) {
    return {
      objection:
        "Le client peut considérer que son niveau de flux confié à la banque est encore trop limité pour ouvrir un nouveau produit.",
      rebuttal:
        "C'est précisément un levier pour capter plus d'opérations et démontrer une valeur concrète avant un élargissement plus large de la relation.",
    };
  }

  if (confidence < 65) {
    return {
      objection:
        "Le client peut demander pourquoi ce produit est prioritaire maintenant plutôt qu'une autre solution.",
      rebuttal:
        "Nous pouvons le rattacher à des besoins très opérationnels du moment, avec une mise en œuvre simple et un impact mesurable sur sa trésorerie ou sa fluidité de gestion.",
    };
  }

  return {
    objection:
      "Le client peut penser qu'il dispose déjà d'une solution équivalente et qu'un nouveau produit n'est pas nécessaire.",
    rebuttal:
      "L'angle à défendre est la complémentarité: plus de souplesse, une exécution plus fluide et une meilleure adaptation au rythme réel de son activité.",
  };
}

function buildPrototypePitch({ clientId, clientSummary, productName, recommendation, persona, ficheVisite }) {
  const sector = clientSummary?.sector || clientSummary?.sector_detail || "son secteur";
  const pnbNet = formatCurrency(clientSummary?.pnb_net);
  const fluxTrend = getFluxTrendLabel(clientSummary);
  const objection = getPrimaryObjection(clientSummary, recommendation);
  const confidence = Number(recommendation?.confidence_pct || 0).toFixed(0);
  const relationshipAngle =
    Number(clientSummary?.flux_confie_pct || 0) >= 30
      ? "consolider une relation deja active"
      : "augmenter la part de flux et d'usage confiée à la banque";
  const visitSignal = ficheVisite
    ? `Le dernier signal terrain suggere deja un contexte exploitable autour de ${String(ficheVisite).slice(0, 110).trim()}.`
    : "Le contexte de visite reste compatible avec une approche simple, concrete et orientee resultat.";

  return [
    "### 1. L'Accroche Personnalisée",
    `Monsieur ${clientId}, en tant qu'acteur clé du secteur ${sector} avec un PNB net de ${pnbNet} et ${fluxTrend}, nous avons identifié une opportunité crédible pour positionner ${productName} au bon moment.`,
    "",
    "### 2. L'Argumentaire Produit",
    `${productName} peut être présenté comme un levier immédiat pour ${relationshipAngle}. Le score de recommandation du moteur interne se situe à ${confidence}%, ce qui renforce la pertinence commerciale du produit dans votre contexte actuel. ${visitSignal}`,
    "",
    "### 3. Anticipation d'Objection",
    `${objection.objection} La phrase de réponse conseillée est la suivante : "${objection.rebuttal}"`,
    "",
    persona ? `Persona observé : ${persona}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
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

export function LLMPitchStream({
  clientId,
  clientSummary,
  disabled = false,
  ficheVisite,
  managerEmail,
  managerName,
  onGenerated,
  persona,
  productName,
  recommendation,
}) {
  const intervalRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pitchText, setPitchText] = useState("");
  const [modelName, setModelName] = useState("prototype-local");

  const generatedPitch = useMemo(
    () =>
      buildPrototypePitch({
        clientId,
        clientSummary,
        ficheVisite,
        persona,
        productName,
        recommendation,
      }),
    [clientId, clientSummary, ficheVisite, persona, productName, recommendation],
  );

  useEffect(() => {
    return () => {
      window.clearInterval(intervalRef.current);
    };
  }, []);

  function closeModal() {
    window.clearInterval(intervalRef.current);
    setIsOpen(false);
    setIsStreaming(false);
  }

  async function startStreaming() {
    if (!clientId || !productName) {
      toast.error("Selectionnez un client et un produit avant de lancer le pitch.");
      return;
    }

    window.clearInterval(intervalRef.current);
    setIsOpen(true);
    setIsStreaming(true);
    setPitchText("");
    setModelName("prototype-local");

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-pitch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          manager_email: managerEmail,
          manager_name: managerName,
          product_name: productName,
        }),
      });

      if (!response.ok) {
        const errorPayload = response.headers.get("content-type")?.includes("application/json")
          ? await response.json()
          : await response.text();
        const message =
          (typeof errorPayload === "object" && errorPayload?.detail) ||
          (typeof errorPayload === "string" && errorPayload) ||
          "Le flux de pitch n'a pas pu demarrer.";
        throw new Error(message);
      }

      const resolvedModelName = response.headers.get("X-LLM-Model") || "fallback-rules";
      setModelName(resolvedModelName);

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
        throw new Error("Aucun contenu n'a ete retourne par le backend.");
      }

      onGenerated?.(finalPitch);
      toast.success(
        resolvedModelName === "fallback-rules"
          ? "Pitch IA genere via fallback backend."
          : "Pitch IA genere en local.",
      );
    } catch (error) {
      const fallbackPitch = generatedPitch;
      let index = 0;
      setModelName("prototype-local");
      intervalRef.current = window.setInterval(() => {
        index += 6;
        const nextValue = fallbackPitch.slice(0, index);
        setPitchText(nextValue);

        if (index >= fallbackPitch.length) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsStreaming(false);
          onGenerated?.(fallbackPitch);
          toast.success("Pitch IA genere via fallback frontend.");
        }
      }, 18);
      return;
    }

    setIsStreaming(false);
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
              ) : (
                <p className="text-sm text-slate-400">Aucun contenu genere.</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4 sm:px-8">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                stream backend · fallback backend · fallback frontend
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
