import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BellRing,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Landmark,
  LoaderCircle,
  MapPinned,
  MessageSquareText,
  Minus,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  UserRound,
  Users,
  WandSparkles,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

import { Sidebar } from "../components/Sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import {
  fetchClientDetails,
  fetchClientInsights,
  generatePitch,
  submitAdvisorFeedback,
} from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { exportClientPdf } from "../utils/exportPDF";

const DONUT_COLORS = ["#E60028", "#111827", "#FB923C", "#38BDF8", "#94A3B8", "#FDBA74"];

const PERSONA_LIBRARY = {
  Standard: {
    summary:
      "Persona rationnel, attentif au cash-flow et à la simplicité d'exécution. La meilleure entrée reste un bénéfice direct et mesurable.",
    posture: "Posture consultative, concrète et rapide à démontrer.",
  },
  VIP: {
    summary:
      "Persona exigeant et sensible à la qualité d'accompagnement. L'argumentaire doit rester premium, structuré et sans approximation.",
    posture: "Posture premium, experte et personnalisée.",
  },
  Strategic: {
    summary:
      "Persona de développement, à adresser avec une logique portefeuille et des perspectives de croissance multi-produits.",
    posture: "Posture de pilotage, projection et conquête.",
  },
  default: {
    summary:
      "Persona à consolider. Il faut démarrer par un usage simple et une proposition de valeur immédiatement crédible.",
    posture: "Posture pédagogique, progressive et très claire.",
  },
};

function formatCurrencyDa(value, options = {}) {
  const numericValue = Number(value || 0);
  const formatter = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    notation: options.compact ? "compact" : "standard",
  });

  return `${formatter.format(numericValue)} DA`;
}

function formatPercent(value, fractionDigits = 1) {
  return `${Number(value || 0).toFixed(fractionDigits)}%`;
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString("fr-FR");
}

function formatSigned(value, suffix = "") {
  const numericValue = Number(value || 0);
  const sign = numericValue > 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(2)}${suffix}`;
}

function getQualityMeta(score) {
  const numericScore = Number(score || 0);

  if (numericScore <= 4) {
    return {
      label: `Qualité ${numericScore.toFixed(1)}`,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (numericScore <= 6) {
    return {
      label: `Qualité ${numericScore.toFixed(1)}`,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: `Qualité ${numericScore.toFixed(1)}`,
    className: "border-rose-200 bg-rose-50 text-rose-700",
  };
}

function getFluxMeta(summary) {
  const changeValue = Number(summary?.flux_change_value || 0);
  const changeRatio = Number(summary?.flux_change_ratio || 0) * 100;

  if (changeValue > 0) {
    return {
      icon: TrendingUp,
      accentClassName: "text-emerald-600",
      label: "Flux en hausse",
      detail: `${formatSigned(changeRatio, "%")} sur 3 mois`,
    };
  }

  if (changeValue < 0) {
    return {
      icon: TrendingDown,
      accentClassName: "text-rose-600",
      label: "Flux en baisse",
      detail: `${formatSigned(changeRatio, "%")} sur 3 mois`,
    };
  }

  return {
    icon: Minus,
    accentClassName: "text-slate-500",
    label: "Flux stable",
    detail: "Aucune variation marquante",
  };
}

function getRiskMeta(summary) {
  if (summary?.incident_status === "À risque") {
    return {
      label: "À risque",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  return {
    label: "Sain",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getPersonaProfile(summary) {
  const personaName = summary?.persona || "default";
  const baseProfile = PERSONA_LIBRARY[personaName] || PERSONA_LIBRARY.default;

  return {
    name: personaName,
    summary: baseProfile.summary,
    posture: baseProfile.posture,
  };
}

function ClientDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 animate-pulse rounded-[30px] bg-white shadow-sm" />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="h-32 animate-pulse rounded-[24px] bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-[24px] bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-[24px] bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-[24px] bg-white shadow-sm" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[28rem] animate-pulse rounded-[30px] bg-white shadow-sm" />
        <div className="h-[28rem] animate-pulse rounded-[30px] bg-white shadow-sm" />
      </div>
    </div>
  );
}

function KpiCard({ title, value, meta, icon: Icon, accent = "text-[#E60028]" }) {
  return (
    <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#6B7280]">{title}</p>
            <p className="font-display mt-4 text-3xl font-extrabold tracking-tight text-[#111827]">
              {value}
            </p>
            <p className="mt-3 text-sm font-medium text-[#6B7280]">{meta}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <Icon className={`size-5 ${accent}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId } = useParams();
  const { logout, session } = useAuth();

  const [client, setClient] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastFeedbackMeta, setLastFeedbackMeta] = useState(null);
  const [pitchContent, setPitchContent] = useState("");
  const [pitchSource, setPitchSource] = useState("insights");
  const [isPitchExpanded, setIsPitchExpanded] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadClientData() {
      setLoadingClient(true);

      try {
        const [clientPayload, insightsPayload] = await Promise.all([
          fetchClientDetails(clientId),
          fetchClientInsights(clientId),
        ]);

        if (!active) {
          return;
        }

        setClient(clientPayload);
        setInsights(insightsPayload);
        setSelectedProductId(
          insightsPayload?.recommendations?.[0]?.product_signal || "",
        );
      } catch (error) {
        if (active) {
          toast.error(error.message || "Impossible de charger la fiche client.");
        }
      } finally {
        if (active) {
          setLoadingClient(false);
        }
      }
    }

    loadClientData();

    return () => {
      active = false;
    };
  }, [clientId]);

  const summary = client?.summary;
  const recommendations = insights?.recommendations || [];
  const selectedRecommendation =
    recommendations.find((item) => item.product_signal === selectedProductId) ||
    recommendations[0];

  useEffect(() => {
    if (!selectedRecommendation) {
      setPitchContent("");
      setPitchSource("insights");
      return;
    }

    setPitchContent(selectedRecommendation.argumentaire || "");
    setPitchSource("insights");
    setIsPitchExpanded(false);
  }, [selectedRecommendation?.product_signal]);

  const qualityMeta = getQualityMeta(summary?.quality_client);
  const riskMeta = getRiskMeta(summary);
  const fluxMeta = getFluxMeta(summary);
  const personaProfile = getPersonaProfile(summary);
  const managerName = location.state?.managerName || summary?.manager || "Gestionnaire";
  const pitchPreview =
    !isPitchExpanded && pitchContent.length > 260
      ? `${pitchContent.slice(0, 260)}...`
      : pitchContent;

  function handleLogout() {
    logout();
    toast.success("Session fermée.");
    navigate("/login", { replace: true });
  }

  function handleSidebarNavigation(routeKey) {
    if (routeKey === "portfolio") {
      navigate("/portfolio");
      return;
    }

    if (routeKey === "client" && clientId) {
      navigate(`/clients/${clientId}`, {
        replace: true,
        state: { managerName },
      });
    }
  }

  async function refreshInsights() {
    const refreshedInsights = await fetchClientInsights(clientId);
    setInsights(refreshedInsights);
    setSelectedProductId((current) => {
      if (
        current &&
        refreshedInsights?.recommendations?.some((item) => item.product_signal === current)
      ) {
        return current;
      }

      return refreshedInsights?.recommendations?.[0]?.product_signal || "";
    });
  }

  async function handleGeneratePitch() {
    if (!selectedRecommendation?.product_signal) {
      toast.error("Aucune recommandation sélectionnée.");
      return;
    }

    setIsGeneratingPitch(true);

    try {
      const response = await generatePitch({
        client_id: clientId,
        manager_email: session?.email,
        manager_name: managerName,
        product_id: selectedRecommendation.product_signal,
      });

      setPitchContent(response.pitch || selectedRecommendation.argumentaire || "");
      setPitchSource(response.source || "fallback");
      toast.success(
        response.source === "ollama"
          ? "Argumentaire généré via Ollama."
          : "Ollama indisponible, argumentaire de secours utilisé.",
      );
    } catch (error) {
      toast.error(error.message || "Impossible de générer l'argumentaire.");
    } finally {
      setIsGeneratingPitch(false);
    }
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault();

    if (!selectedRecommendation?.product_signal) {
      toast.error("Sélectionnez une recommandation avant d'envoyer le feedback.");
      return;
    }

    setSubmittingFeedback(true);

    try {
      const response = await submitAdvisorFeedback({
        accepted,
        client_id: clientId,
        comment: feedbackComment,
        product_id: selectedRecommendation.product_signal,
      });

      setLastFeedbackMeta(response);
      toast.success(response.notification || "Le modèle RL a été mis à jour.");
      setFeedbackComment("");
      setAccepted(false);
      await refreshInsights();
    } catch (error) {
      toast.error(error.message || "Le feedback n'a pas pu être soumis.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  async function handleExportPdf() {
    if (!client || !insights) {
      toast.error("Aucune fiche client prête à exporter.");
      return;
    }

    setIsExporting(true);

    try {
      await exportClientPdf({ client, insights });
      toast.success("La fiche client PDF a été générée.");
    } catch (error) {
      toast.error(error.message || "La génération PDF a échoué.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7fe_0%,#eef3ff_100%)]">
      <Sidebar
        activeRoute="client"
        currentClientId={clientId}
        managerName={managerName}
        onLogout={handleLogout}
        onNavigate={handleSidebarNavigation}
      />

      <div className="lg:pl-[21rem]">
        <main className="min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:px-10 lg:pt-10">
          {loadingClient ? (
            <ClientDashboardSkeleton />
          ) : (
            <div className="space-y-8">
              <div className="space-y-8">
                <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.4fr)_minmax(24rem,0.78fr)]">
                  <Card className="overflow-hidden rounded-[34px] border-white/70 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.28)]">
                    <CardContent className="p-0">
                      <div className="bg-[radial-gradient(circle_at_top_left,rgba(230,0,40,0.12),transparent_45%),linear-gradient(180deg,#ffffff_0%,#fff6f8_100%)] p-7 sm:p-8">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                          <div className="max-w-3xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className="border border-[#E60028]/10 bg-[#FFF4F6] text-[#E60028]"
                                variant="outline"
                              >
                                Recommandation prioritaire
                              </Badge>
                              <Badge className={qualityMeta.className} variant="outline">
                                {qualityMeta.label}
                              </Badge>
                              <Badge
                                className="border border-slate-200 bg-white text-slate-700"
                                variant="outline"
                              >
                                {summary?.segment || "N/A"}
                              </Badge>
                            </div>

                            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#6B7280]">
                              Client {summary?.client_id}
                            </p>
                            <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#111827] sm:text-5xl">
                              {selectedRecommendation?.product || "Aucune recommandation"}
                            </h1>
                            <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-[#4B5563]">
                              {selectedRecommendation?.argumentaire ||
                                "Le moteur n'a pas encore renvoyé de recommandation exploitable."}
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3" data-pdf-ignore="true">
                              <Button
                                className="h-12 rounded-2xl"
                                onClick={() => navigate("/portfolio")}
                                type="button"
                              >
                                <ArrowLeft className="size-4" />
                                Retour au portefeuille
                              </Button>
                              <Button
                                className="h-12 rounded-2xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                                disabled={isExporting}
                                onClick={handleExportPdf}
                                type="button"
                                variant="outline"
                              >
                                {isExporting ? (
                                  <>
                                    <LoaderCircle className="size-4 animate-spin" />
                                    Export...
                                  </>
                                ) : (
                                  <>
                                    <Download className="size-4" />
                                    Export PDF
                                  </>
                                )}
                              </Button>
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                              {recommendations.slice(0, 3).map((recommendation, index) => (
                                <button
                                  key={recommendation.product_signal}
                                  className={`rounded-[22px] border px-4 py-4 text-left transition ${
                                    recommendation.product_signal === selectedProductId
                                      ? "border-[#E60028]/20 bg-[#FFF4F6]"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                  }`}
                                  onClick={() => setSelectedProductId(recommendation.product_signal)}
                                  type="button"
                                >
                                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                                    Top {index + 1}
                                  </span>
                                  <p className="font-display mt-3 text-xl font-extrabold text-[#111827]">
                                    {recommendation.product}
                                  </p>
                                  <p className="mt-2 text-sm font-medium text-[#6B7280]">
                                    {formatPercent(recommendation.confidence_pct || 0)} de confiance
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-[21rem] xl:grid-cols-1">
                            <div className="rounded-[22px] border border-white/80 bg-white/85 p-4 shadow-sm">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                                Confiance
                              </p>
                              <p className="font-display mt-2 text-3xl font-extrabold text-[#E60028]">
                                {formatPercent(selectedRecommendation?.confidence_pct || 0)}
                              </p>
                            </div>
                            <div className="rounded-[22px] border border-white/80 bg-white/85 p-4 shadow-sm">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                                Persona
                              </p>
                              <p className="font-display mt-2 text-3xl font-extrabold text-[#111827]">
                                {summary?.persona || "N/A"}
                              </p>
                            </div>
                            <div className="rounded-[22px] border border-white/80 bg-white/85 p-4 shadow-sm">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                                Gestionnaire
                              </p>
                              <p className="mt-2 text-base font-bold text-[#111827]">{managerName}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden rounded-[34px] border-0 bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)] text-white shadow-[0_25px_60px_-30px_rgba(15,23,42,0.7)]">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/50">
                            Persona card
                          </p>
                          <h2 className="font-display mt-4 text-4xl font-extrabold tracking-tight">
                            {personaProfile.name}
                          </h2>
                        </div>
                        <div className="rounded-2xl bg-white/8 p-3">
                          <Sparkles className="size-5 text-[#FF8AA0]" />
                        </div>
                      </div>

                      <p className="mt-6 text-sm font-medium leading-7 text-white/72">
                        {personaProfile.summary}
                      </p>

                      <div className="mt-8 rounded-[22px] border border-white/10 bg-white/6 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                          Posture de vente
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">{personaProfile.posture}</p>
                      </div>

                      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                            Client
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {summary?.display_name || `Client ${summary?.client_id}`}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                            Secteur
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">{summary?.sector || "N/A"}</p>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap gap-2">
                        <Badge className="border border-white/12 bg-white/8 text-white" variant="outline">
                          {riskMeta.label}
                        </Badge>
                        <Badge className="border border-white/12 bg-white/8 text-white" variant="outline">
                          {fluxMeta.label}
                        </Badge>
                        <Badge className="border border-white/12 bg-white/8 text-white" variant="outline">
                          {summary?.wilaya || "N/A"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    accent="text-[#E60028]"
                    icon={CircleDollarSign}
                    meta="Chiffre d'affaire consolidé"
                    title="Chiffre d'affaire"
                    value={formatCurrencyDa(summary?.chiffre_affaire, { compact: true })}
                  />
                  <KpiCard
                    accent="text-[#111827]"
                    icon={Landmark}
                    meta="PNB NET observé sur 15 mois"
                    title="PNB NET"
                    value={formatCurrencyDa(summary?.pnb_net)}
                  />
                  <KpiCard
                    accent={fluxMeta.accentClassName}
                    icon={fluxMeta.icon}
                    meta={fluxMeta.detail}
                    title="Tendance flux"
                    value={fluxMeta.label}
                  />
                  <KpiCard
                    accent={summary?.churn_alert_flag ? "text-rose-600" : "text-emerald-600"}
                    icon={summary?.churn_alert_flag ? TriangleAlert : ShieldCheck}
                    meta={
                      summary?.churn_alert_flag
                        ? "Flux créditeurs à surveiller"
                        : "Aucune alerte critique"
                    }
                    title="Alerte churn"
                    value={summary?.churn_alert_flag ? "Alerte forte" : "Sous contrôle"}
                  />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <div className="space-y-6">
                    <Card className="rounded-[30px] border-slate-200/80 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-display text-2xl font-extrabold text-[#111827]">
                          Utilisation produits et santé
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-[#6B7280]">
                          Une lecture synthétique du portefeuille produit et des signaux relationnels.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-6 lg:grid-cols-[minmax(14rem,0.8fr)_minmax(0,1fr)]">
                        <div className="h-64">
                          <ResponsiveContainer height="100%" width="100%">
                            <PieChart>
                              <Pie
                                data={summary?.product_distribution || []}
                                dataKey="value"
                                innerRadius={60}
                                outerRadius={96}
                                paddingAngle={4}
                              >
                                {(summary?.product_distribution || []).map((entry, index) => (
                                  <Cell
                                    key={`${entry.name}-${index}`}
                                    fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => `${Number(value).toFixed(1)}%`}
                                contentStyle={{
                                  border: "1px solid rgba(17,24,39,0.08)",
                                  borderRadius: "16px",
                                  boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                          {(summary?.product_distribution || []).map((entry, index) => (
                            <div
                              key={entry.name}
                              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                                />
                                <span className="text-sm font-semibold text-[#111827]">{entry.name}</span>
                              </div>
                              <span className="text-sm font-bold text-[#111827]">
                                {formatPercent(entry.value)}
                              </span>
                            </div>
                          ))}

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 px-4 py-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                                Impayés
                              </p>
                              <p className="mt-3 text-lg font-extrabold text-[#111827]">
                                {riskMeta.label}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                                Digital
                              </p>
                              <p className="mt-3 text-lg font-extrabold text-[#111827]">
                                {Number(summary?.digital_score || 0).toFixed(0)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                                Produits détenus
                              </p>
                              <p className="mt-3 text-lg font-extrabold text-[#111827]">
                                {summary?.nb_products_held || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[30px] border-slate-200/80 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-display text-2xl font-extrabold text-[#111827]">
                          Feedback conseiller
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-[#6B7280]">
                          Le retour terrain met à jour le reward model et le bandit contextuel.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-white p-3 shadow-sm">
                              <Bot className="size-5 text-[#E60028]" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#111827]">Produit ciblé</p>
                              <p className="mt-2 font-display text-2xl font-extrabold text-[#111827]">
                                {selectedRecommendation?.product || "Sélectionnez une recommandation"}
                              </p>
                              <p className="mt-2 text-sm font-medium leading-6 text-[#6B7280]">
                                Utilisez ce formulaire pour réinjecter le résultat de l'entretien.
                              </p>
                            </div>
                          </div>
                        </div>

                        <form className="space-y-5" onSubmit={handleFeedbackSubmit}>
                          <label className="block space-y-2">
                            <span className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                              <MessageSquareText className="size-4 text-[#E60028]" />
                              Compte rendu d'entretien
                            </span>
                            <Textarea
                              className="min-h-36 rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:border-[#E60028] focus-visible:ring-[#E60028]/15"
                              onChange={(event) => setFeedbackComment(event.target.value)}
                              placeholder="Exemple: client intéressé, attend un chiffrage et une démonstration avant décision..."
                              value={feedbackComment}
                            />
                          </label>

                          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <div>
                              <p className="text-sm font-semibold text-[#111827]">
                                Produit accepté par le client ?
                              </p>
                              <p className="mt-1 text-sm font-medium text-[#6B7280]">
                                Ce signal entre directement dans le calcul du reward.
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-[#6B7280]">
                                {accepted ? "Oui" : "Non"}
                              </span>
                              <Switch checked={accepted} onCheckedChange={setAccepted} />
                            </div>
                          </div>

                          <Button
                            className="h-12 w-full rounded-2xl text-base font-semibold shadow-[0_18px_40px_-22px_rgba(230,0,40,0.75)]"
                            disabled={submittingFeedback || !selectedRecommendation}
                            type="submit"
                          >
                            {submittingFeedback ? (
                              <>
                                <LoaderCircle className="size-4 animate-spin" />
                                Apprentissage en cours...
                              </>
                            ) : (
                              <>
                                <BrainCircuit className="size-4" />
                                Soumettre et entraîner l'IA
                              </>
                            )}
                          </Button>
                        </form>

                        {lastFeedbackMeta ? (
                          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
                            <div className="flex items-start gap-3">
                              <div className="rounded-2xl bg-white p-3 shadow-sm">
                                <CheckCircle2 className="size-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-emerald-800">
                                  {lastFeedbackMeta.notification}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-emerald-800/90">
                                  <span>Reward {formatSigned(lastFeedbackMeta.reward)}</span>
                                  <span>Sentiment {lastFeedbackMeta.sentiment}</span>
                                  <span>Persona {lastFeedbackMeta.persona}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="rounded-[30px] border-slate-200/80 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-display text-2xl font-extrabold text-[#111827]">
                          Contenu contextuel
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-[#6B7280]">
                          Les zones longues sont rangées dans des accordéons pour alléger l'écran.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Accordion className="w-full" defaultValue={["pitch"]} type="multiple">
                          <AccordionItem value="pitch">
                            <AccordionTrigger className="py-5 hover:no-underline">
                              <div>
                                <p className="text-base font-bold text-[#111827]">Argumentaire IA</p>
                                <p className="mt-1 text-sm font-medium text-[#6B7280]">
                                  Génération locale via Ollama ou fallback enrichi.
                                </p>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="rounded-[22px] bg-slate-50 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <Badge
                                    className="border border-slate-200 bg-white text-slate-700"
                                    variant="outline"
                                  >
                                    Source {pitchSource}
                                  </Badge>
                                  <Button
                                    className="rounded-2xl"
                                    data-pdf-ignore="true"
                                    disabled={isGeneratingPitch || !selectedRecommendation}
                                    onClick={handleGeneratePitch}
                                    type="button"
                                  >
                                    {isGeneratingPitch ? (
                                      <>
                                        <LoaderCircle className="size-4 animate-spin" />
                                        Génération...
                                      </>
                                    ) : (
                                      <>
                                        <WandSparkles className="size-4" />
                                        Générer le pitch
                                      </>
                                    )}
                                  </Button>
                                </div>

                                <p className="mt-4 text-sm font-medium leading-7 text-[#374151]">
                                  {pitchPreview || "Aucun argumentaire disponible."}
                                </p>

                                {pitchContent.length > 260 ? (
                                  <button
                                    className="mt-4 text-sm font-semibold text-[#E60028]"
                                    data-pdf-ignore="true"
                                    onClick={() => setIsPitchExpanded((current) => !current)}
                                    type="button"
                                  >
                                    {isPitchExpanded ? "Réduire" : "Lire la suite"}
                                  </button>
                                ) : null}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="visit">
                            <AccordionTrigger className="py-5 hover:no-underline">
                              <div>
                                <p className="text-base font-bold text-[#111827]">Fiche visite</p>
                                <p className="mt-1 text-sm font-medium text-[#6B7280]">
                                  Restitution complète des insights générés.
                                </p>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="rounded-[22px] bg-slate-50 p-5">
                                <pre className="whitespace-pre-wrap break-words text-sm font-medium leading-7 text-[#374151]">
                                  {insights?.fiche_visite || "Aucune fiche visite disponible."}
                                </pre>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="company">
                            <AccordionTrigger className="py-5 hover:no-underline">
                              <div>
                                <p className="text-base font-bold text-[#111827]">Détails entreprise</p>
                                <p className="mt-1 text-sm font-medium text-[#6B7280]">
                                  Capital, actionnariat et informations administratives.
                                </p>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[22px] bg-slate-50 p-4">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                                    <UserRound className="size-4 text-[#E60028]" />
                                    Gestionnaire
                                  </div>
                                  <p className="mt-3 text-base font-bold text-[#111827]">
                                    {summary?.manager || "N/A"}
                                  </p>
                                </div>
                                <div className="rounded-[22px] bg-slate-50 p-4">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                                    <Building2 className="size-4 text-[#E60028]" />
                                    Secteur détaillé
                                  </div>
                                  <p className="mt-3 text-base font-bold text-[#111827]">
                                    {summary?.sector_detail || "N/A"}
                                  </p>
                                </div>
                                <div className="rounded-[22px] bg-slate-50 p-4">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                                    <MapPinned className="size-4 text-[#E60028]" />
                                    Wilaya / Marché
                                  </div>
                                  <p className="mt-3 text-base font-bold text-[#111827]">
                                    {summary?.wilaya || "N/A"}
                                  </p>
                                  <p className="mt-1 text-sm font-medium text-[#6B7280]">
                                    {summary?.market || "N/A"}
                                  </p>
                                </div>
                                <div className="rounded-[22px] bg-slate-50 p-4">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                                    <Users className="size-4 text-[#E60028]" />
                                    Actionnaires
                                  </div>
                                  <p className="mt-3 text-base font-bold text-[#111827]">
                                    {summary?.shareholders_count || 0}
                                  </p>
                                </div>
                                <div className="rounded-[22px] bg-slate-50 p-4">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                                    <CircleDollarSign className="size-4 text-[#E60028]" />
                                    Capital simulé
                                  </div>
                                  <p className="mt-3 text-base font-bold text-[#111827]">
                                    {formatCurrencyDa(summary?.capital_simulated)}
                                  </p>
                                </div>
                                <div className="rounded-[22px] bg-slate-50 p-4">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                                    <BellRing className="size-4 text-[#E60028]" />
                                    Date de création
                                  </div>
                                  <p className="mt-3 text-base font-bold text-[#111827]">
                                    {formatDate(summary?.creation_date)}
                                  </p>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[30px] border-slate-200/80 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-display text-2xl font-extrabold text-[#111827]">
                          État du bandit
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-[#6B7280]">
                          Les compteurs sont mis à jour à chaque soumission terrain.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                        <div className="rounded-[22px] bg-slate-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                            Feedback count
                          </p>
                          <p className="font-display mt-3 text-3xl font-extrabold text-[#111827]">
                            {selectedRecommendation?.rl_state?.count || 0}
                          </p>
                        </div>
                        <div className="rounded-[22px] bg-slate-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                            Reward moyen
                          </p>
                          <p className="font-display mt-3 text-3xl font-extrabold text-[#111827]">
                            {formatSigned(selectedRecommendation?.rl_state?.value || 0)}
                          </p>
                        </div>
                        <div className="rounded-[22px] bg-slate-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                            Score UCB
                          </p>
                          <p className="font-display mt-3 text-3xl font-extrabold text-[#111827]">
                            {Number(selectedRecommendation?.rl_state?.ucb_score || 0).toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
