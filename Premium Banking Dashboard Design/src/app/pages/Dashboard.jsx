import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Download,
  LoaderCircle,
  MapPinned,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { BrandLogo } from "../components/BrandLogo";
import { LLMPitchStream, PitchMarkdown } from "../components/LLMPitchStream";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import {
  fetchClientDetails,
  fetchClientInsights,
  fetchManagerClients,
  submitAdvisorFeedback,
} from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { useUIPreferences } from "../lib/ui-preferences.jsx";
import { exportClientPdf } from "../utils/exportPDF";

const CHART_COLORS = ["#E60028", "#111827", "#FB923C", "#38BDF8", "#94A3B8"];
const LOCAL_PITCH_ENABLED = import.meta.env.VITE_ENABLE_LOCAL_PITCH === "true";

function formatCurrencyDa(value, compact = false) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(Number(value || 0))} DA`;
}

function formatPercent(value, digits = 1) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString("fr-FR");
}

function getQualityBadgeClass(score) {
  const numericScore = Number(score || 0);

  if (numericScore <= 4) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (numericScore <= 6) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function getRiskBadgeClass(isCritical) {
  return isCritical
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function SummaryCard({ description, icon: Icon, title, value, accentClassName = "text-[#E60028]" }) {
  return (
    <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#6B7280]">{title}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-[#111827]">{value}</p>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">{description}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <Icon className={`size-5 ${accentClassName}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiCard({ label, supporting, value }) {
  return (
    <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-4">
        <p className="text-sm font-medium text-[#6B7280]">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">{value}</p>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">{supporting}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-xl bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-xl bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-xl bg-white shadow-sm" />
      </div>
      <div className="h-[26rem] animate-pulse rounded-xl bg-white shadow-sm" />
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const { animationsEnabled } = useUIPreferences();

  const searchInputRef = useRef(null);
  const searchSectionRef = useRef(null);
  const clientSectionRef = useRef(null);

  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [clientLoading, setClientLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [insights, setInsights] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [pitchContent, setPitchContent] = useState("");
  const [pitchSource, setPitchSource] = useState("insights");
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [lastFeedbackMeta, setLastFeedbackMeta] = useState(null);
  const deferredSearch = useDeferredValue(portfolioSearch);
  const selectedClientId = searchParams.get("client") || "";
  const clients = portfolio?.clients || [];
  const summary = portfolio?.summary || {};
  const normalizedSearch = portfolioSearch.trim().toLowerCase();
  const exactSearchMatch = normalizedSearch
    ? clients.find((clientItem) => clientItem.client_id.toLowerCase() === normalizedSearch)
    : null;
  const quickSearchMatches = normalizedSearch
    ? clients
        .filter((clientItem) => {
          const normalizedId = clientItem.client_id.toLowerCase();
          const normalizedSector = String(clientItem.sector || "").toLowerCase();
          return normalizedId.includes(normalizedSearch) || normalizedSector.includes(normalizedSearch);
        })
        .slice(0, 4)
    : clients.slice(0, 4);
  const recommendations = insights?.recommendations || [];
  const selectedRecommendation =
    recommendations.find((item) => item.product_signal === selectedProductId) ||
    recommendations[0];
  const fluxComparisonData = client
    ? [
        {
          label: "Flux actuel",
          value: Number(client.summary.flux_current_3m || 0),
        },
        {
          label: "Flux precedent",
          value: Number(client.summary.flux_previous_3m || 0),
        },
      ]
    : [];
  const relationshipRatioData = client
    ? [
        {
          label: "Flux confie",
          value: Number(client.summary.flux_confie_pct || 0),
        },
        {
          label: "Marge PNB",
          value: Number(client.summary.pnb_margin_pct || 0),
        },
        {
          label: "Digital",
          value: Number(client.summary.digital_score || 0),
        },
        {
          label: "Util. credit",
          value: Number(client.summary.credit_utilization_rate || 0),
        },
      ]
    : [];

  useEffect(() => {
    const focusValue = searchParams.get("focus");
    if (focusValue !== "search") {
      return;
    }

    searchSectionRef.current?.scrollIntoView({
      behavior: animationsEnabled ? "smooth" : "auto",
      block: "start",
    });
    searchInputRef.current?.focus();
    searchInputRef.current?.select();

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("focus");

    startTransition(() => {
      setSearchParams(nextParams, { replace: true });
    });
  }, [animationsEnabled, searchParams, setSearchParams]);

  useEffect(() => {
    let active = true;

    async function loadPortfolio() {
      setPortfolioLoading(true);

      try {
        const response = await fetchManagerClients({
          managerEmail: session?.email,
          managerName: session?.managerName,
          query: deferredSearch,
          sortBy: "churn",
        });

        if (!active) {
          return;
        }

        setPortfolio(response);
      } catch (error) {
        if (active) {
          toast.error(error.message || "Impossible de charger le portefeuille.");
        }
      } finally {
        if (active) {
          setPortfolioLoading(false);
        }
      }
    }

    loadPortfolio();

    return () => {
      active = false;
    };
  }, [deferredSearch, session?.email, session?.managerName]);

  useEffect(() => {
    let active = true;

    async function loadClientData() {
      if (!selectedClientId) {
        setClient(null);
        setInsights(null);
        setSelectedProductId("");
        setPitchContent("");
        return;
      }

      setClientLoading(true);

      try {
        const [clientPayload, insightsPayload] = await Promise.all([
          fetchClientDetails(selectedClientId, {
            managerEmail: session?.email,
            managerName: session?.managerName,
          }),
          fetchClientInsights(selectedClientId, {
            managerEmail: session?.email,
            managerName: session?.managerName,
          }),
        ]);

        if (!active) {
          return;
        }

        setClient(clientPayload);
        setInsights(insightsPayload);
        setSelectedProductId(insightsPayload?.recommendations?.[0]?.product_signal || "");
        setPitchContent(insightsPayload?.recommendations?.[0]?.argumentaire || "");
        setPitchSource("insights");
      } catch (error) {
        if (active) {
          toast.error(error.message || "Impossible de charger la fiche client.");
        }
      } finally {
        if (active) {
          setClientLoading(false);
        }
      }
    }

    loadClientData();

    return () => {
      active = false;
    };
  }, [selectedClientId, session?.email, session?.managerName]);

  useEffect(() => {
    if (!selectedRecommendation) {
      setPitchContent("");
      setPitchSource("insights");
      return;
    }

    setPitchContent(selectedRecommendation.argumentaire || "");
    setPitchSource("insights");
  }, [selectedRecommendation?.product_signal]);

  useEffect(() => {
    if (!selectedClientId || !client || !clientSectionRef.current) {
      return;
    }

    clientSectionRef.current.scrollIntoView({
      behavior: animationsEnabled ? "smooth" : "auto",
      block: "start",
    });
  }, [animationsEnabled, client, selectedClientId]);

  async function refreshClientData() {
    if (!selectedClientId) {
      return;
    }

    const [clientPayload, insightsPayload] = await Promise.all([
      fetchClientDetails(selectedClientId, {
        managerEmail: session?.email,
        managerName: session?.managerName,
      }),
      fetchClientInsights(selectedClientId, {
        managerEmail: session?.email,
        managerName: session?.managerName,
      }),
    ]);

    setClient(clientPayload);
    setInsights(insightsPayload);
    setSelectedProductId((current) => {
      if (insightsPayload?.recommendations?.some((item) => item.product_signal === current)) {
        return current;
      }

      return insightsPayload?.recommendations?.[0]?.product_signal || "";
    });
  }

  function openClient(clientId) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("client", clientId);
    nextParams.delete("focus");

    startTransition(() => {
      setSearchParams(nextParams);
    });
  }

  function closeClientView() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("client");

    startTransition(() => {
      setSearchParams(nextParams);
    });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    if (!portfolioSearch.trim()) {
      searchInputRef.current?.focus();
      return;
    }

    if (exactSearchMatch) {
      openClient(exactSearchMatch.client_id);
      return;
    }

    if (clients.length === 1) {
      openClient(clients[0].client_id);
      return;
    }

    if (clients.length > 1) {
      toast.message(`${clients.length} clients correspondent a la recherche.`);
      return;
    }

    toast.error("Aucun client trouve pour cette recherche.");
  }

  function handleSearchReset() {
    setPortfolioSearch("");
    searchInputRef.current?.focus();
  }

  async function handleExportPdf() {
    if (!client || !insights) {
      toast.error("Aucune fiche client prete a exporter.");
      return;
    }

    setIsExporting(true);

    try {
      await exportClientPdf({ client, insights });
      toast.success("PDF genere.");
    } catch (error) {
      toast.error(error.message || "La generation du PDF a echoue.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault();

    if (!selectedClientId || !selectedRecommendation) {
      toast.error("Selectionnez une recommandation avant l'envoi.");
      return;
    }

    setSubmittingFeedback(true);

    try {
      const response = await submitAdvisorFeedback({
        accepted,
        client_id: selectedClientId,
        comment: feedbackComment,
        product_id: selectedRecommendation.product_signal,
      });

      const submittedComment = feedbackComment;
      setFeedbackComment("");
      setAccepted(false);
      await refreshClientData();
      navigate("/feedback-confirmation", {
        state: {
          accepted,
          clientId: selectedClientId,
          clientName: client?.summary?.display_name || client?.summary?.client_id,
          comment: submittedComment,
          notification: response.notification || "Modele mis a jour.",
          productName: selectedRecommendation.product,
          reward: response.reward,
          sentiment: response.sentiment,
        },
      });
    } catch (error) {
      toast.error(error.message || "Le feedback n'a pas pu etre envoye.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE] overflow-y-auto">
      <div className="space-y-6">
        <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <BrandLogo className="shrink-0" imageClassName="h-14 w-auto max-w-[11rem] sm:h-16 sm:max-w-[13rem]" />
              <div>
              <p className="text-sm font-medium text-[#6B7280]">Vue gestionnaire commercial</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
                Portefeuille SynerG
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7280]">
                Une vue globale du portefeuille, une recherche client rapide et une fiche 360
                structuree en blocs clairs pour mobile et desktop.
              </p>
              </div>
            </div>

            <Badge className="w-fit border border-slate-200 bg-slate-50 text-slate-700" variant="outline">
              {session?.name || session?.managerName || "Gestionnaire SGA"}
            </Badge>
          </div>
        </section>

        {portfolioLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <section className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Section KPI portefeuille</p>
                <h2 className="mt-1 text-xl font-bold text-[#111827]">Indicateurs generaux</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <SummaryCard
                  description="Total des clients affectes au gestionnaire"
                  icon={Users}
                  title="Total Clients"
                  value={summary.total_clients || 0}
                />
                <SummaryCard
                  accentClassName="text-[#111827]"
                  description="Chiffre d'affaire consolide du portefeuille"
                  icon={CircleDollarSign}
                  title="CA Global"
                  value={formatCurrencyDa(summary.total_revenue, true)}
                />
                <SummaryCard
                  accentClassName="text-rose-600"
                  description="Clients a surveiller sur le risque de churn"
                  icon={ShieldAlert}
                  title="Clients a Risque"
                  value={summary.churn_alerts || 0}
                />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div ref={searchSectionRef}>
                <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-[#111827]">Recherche client</CardTitle>
                    <CardDescription className="text-sm text-[#6B7280]">
                      Recherchez par ID client ou par secteur, puis ouvrez la fiche 360 depuis les
                      resultats rapides ou la table.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <form className="space-y-3" onSubmit={handleSearchSubmit}>
                      <label className="block text-sm font-medium text-[#111827]" htmlFor="client-search">
                        Rechercher un client
                      </label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
                        <Input
                          ref={searchInputRef}
                          className="h-12 rounded-xl border-slate-200 bg-white pl-11 focus-visible:border-[#E60028] focus-visible:ring-[#E60028]"
                          id="client-search"
                          list="client-search-options"
                          onChange={(event) => setPortfolioSearch(event.target.value)}
                          placeholder="Ex: CLI999 ou Production"
                          value={portfolioSearch}
                        />
                        <datalist id="client-search-options">
                          {clients.slice(0, 50).map((clientItem) => (
                            <option key={clientItem.client_id} value={clientItem.client_id} />
                          ))}
                        </datalist>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button className="rounded-xl" type="submit">
                          <Search className="size-4" />
                          Rechercher
                        </Button>
                        <Button
                          className="rounded-xl border-slate-200 bg-white text-[#111827] hover:bg-slate-50"
                          onClick={handleSearchReset}
                          type="button"
                          variant="outline"
                        >
                          Reinitialiser
                        </Button>
                      </div>
                    </form>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-[#111827]">Etat de la recherche</p>
                      <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                        {portfolioSearch.trim()
                          ? `${clients.length} resultat(s) pour "${portfolioSearch.trim()}".`
                          : "Aucune recherche appliquee. Les premiers clients du portefeuille sont affiches ci-dessous."}
                      </p>

                      {exactSearchMatch ? (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                          Correspondance exacte detectee pour {exactSearchMatch.client_id}.
                        </div>
                      ) : null}

                      <div className="mt-4 space-y-3">
                        {quickSearchMatches.length ? (
                          quickSearchMatches.map((clientItem) => (
                            <button
                              key={clientItem.client_id}
                              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#E60028] hover:bg-[#FFF5F6]"
                              onClick={() => openClient(clientItem.client_id)}
                              type="button"
                            >
                              <div>
                                <p className="text-sm font-semibold text-[#111827]">{clientItem.client_id}</p>
                                <p className="mt-1 text-sm text-[#6B7280]">{clientItem.sector || "N/A"}</p>
                              </div>
                              <ArrowRight className="size-4 text-[#E60028]" />
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-[#6B7280]">Aucun client ne correspond a la recherche.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#6B7280]">Section portefeuille</p>
                    <h2 className="mt-1 text-xl font-bold text-[#111827]">Liste des clients</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Cliquez sur un client pour ouvrir la fiche 360.
                    </p>
                  </div>
                  <Badge className="border border-slate-200 bg-slate-50 text-slate-700" variant="outline">
                    {clients.length} resultat(s)
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm font-medium text-[#6B7280]">ID Client</TableHead>
                        <TableHead className="text-sm font-medium text-[#6B7280]">Qualite</TableHead>
                        <TableHead className="text-sm font-medium text-[#6B7280]">CA</TableHead>
                        <TableHead className="text-sm font-medium text-[#6B7280]">Flux confie</TableHead>
                        <TableHead className="text-sm font-medium text-[#6B7280]">Churn</TableHead>
                        <TableHead className="text-sm font-medium text-[#6B7280]">Secteur</TableHead>
                        <TableHead className="text-right text-sm font-medium text-[#6B7280]">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.length ? (
                        clients.map((clientItem) => (
                          <TableRow
                            key={clientItem.client_id}
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => openClient(clientItem.client_id)}
                          >
                            <TableCell className="font-semibold text-[#111827]">
                              {clientItem.client_id}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getQualityBadgeClass(clientItem.quality_client)}
                                variant="outline"
                              >
                                {Number(clientItem.quality_client || 0).toFixed(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[#111827]">
                              {formatCurrencyDa(clientItem.chiffre_affaire, true)}
                            </TableCell>
                            <TableCell className="text-[#111827]">
                              {formatPercent(clientItem.flux_confie_pct || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getRiskBadgeClass(clientItem.churn_alert_flag)}
                                variant="outline"
                              >
                                {clientItem.churn_alert_flag ? "A risque" : "Stable"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[#6B7280]">{clientItem.sector || "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                className="rounded-xl"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openClient(clientItem.client_id);
                                }}
                                type="button"
                              >
                                Voir Fiche 360
                                <ArrowRight className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="py-14 text-center text-sm text-[#6B7280]" colSpan={7}>
                            Aucun client trouve pour cette recherche.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </section>
          </>
        )}

        {selectedClientId ? (
          <section className="space-y-6" id="client-360" ref={clientSectionRef}>
            {clientLoading || !client || !insights ? (
              <DashboardSkeleton />
            ) : (
              <>
                <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#6B7280]">Section fiche client 360</p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
                          {client.summary.display_name || client.summary.client_id}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                          {client.summary.sector || "Secteur non renseigne"} · {client.summary.manager || "Gestionnaire non renseigne"}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge className={getQualityBadgeClass(client.summary.quality_client)} variant="outline">
                            Qualite {Number(client.summary.quality_client || 0).toFixed(1)}
                          </Badge>
                          <Badge className={getRiskBadgeClass(client.summary.churn_alert_flag)} variant="outline">
                            {client.summary.churn_alert_flag ? "Churn critique" : "Situation stable"}
                          </Badge>
                          <Badge className="border border-slate-200 bg-slate-50 text-slate-700" variant="outline">
                            {client.summary.segment || "N/A"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          className="rounded-xl border-slate-200 bg-white text-[#111827] hover:bg-slate-50"
                          onClick={closeClientView}
                          type="button"
                          variant="outline"
                        >
                          Retour portefeuille
                        </Button>
                        <Button
                          className="rounded-xl"
                          disabled={isExporting}
                          onClick={handleExportPdf}
                          type="button"
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
                    </div>
                  </CardContent>
                </Card>

                <section className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[#6B7280]">Section KPI client</p>
                    <h3 className="mt-1 text-xl font-bold text-[#111827]">KPIs financiers</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6 xl:grid-cols-5">
                    <KpiCard
                      label="Chiffre d'affaire"
                      supporting="Volume global du client"
                      value={formatCurrencyDa(client.summary.chiffre_affaire, true)}
                    />
                    <KpiCard
                      label="PNB net"
                      supporting="Contribution nette 15 mois"
                      value={formatCurrencyDa(client.summary.pnb_net, true)}
                    />
                    <KpiCard
                      label="Flux crediteurs"
                      supporting={`Variation ${formatPercent(Number(client.summary.flux_change_ratio || 0) * 100)}`}
                      value={formatCurrencyDa(client.summary.flux_current_3m, true)}
                    />
                    <KpiCard
                      label="Flux confie"
                      supporting="Flux crediteur / chiffre d'affaire"
                      value={formatPercent(client.summary.flux_confie_pct || 0)}
                    />
                    <KpiCard
                      label="Etat incidents"
                      supporting={client.summary.incident_status || "N/A"}
                      value={client.summary.churn_alert_flag ? "Alerte" : "Sain"}
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[#6B7280]">Section analyse client</p>
                    <h3 className="mt-1 text-xl font-bold text-[#111827]">Ratios et dynamique des flux</h3>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#111827]">
                          <BarChart3 className="size-5 text-[#E60028]" />
                          Flux 3M compares
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6B7280]">
                          Lecture directe des flux crediteurs actuels versus la periode precedente.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72">
                          <ResponsiveContainer height="100%" width="100%">
                            <BarChart data={fluxComparisonData}>
                              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                              <XAxis
                                axisLine={false}
                                dataKey="label"
                                tick={{ fill: "#6B7280", fontSize: 12 }}
                                tickLine={false}
                              />
                              <YAxis
                                axisLine={false}
                                tick={{ fill: "#6B7280", fontSize: 12 }}
                                tickFormatter={(value) => formatCompactNumber(value)}
                                tickLine={false}
                              />
                              <Tooltip formatter={(value) => formatCurrencyDa(value)} />
                              <Bar dataKey="value" fill="#E60028" radius={[10, 10, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#111827]">
                          <TrendingUp className="size-5 text-[#E60028]" />
                          Ratios relationnels
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6B7280]">
                          Intensite de la relation mesuree par le flux confie, la marge, le digital et l'utilisation du credit.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-72">
                          <ResponsiveContainer height="100%" width="100%">
                            <BarChart data={relationshipRatioData} layout="vertical" margin={{ left: 16 }}>
                              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" horizontal={false} />
                              <XAxis
                                axisLine={false}
                                tick={{ fill: "#6B7280", fontSize: 12 }}
                                tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                                tickLine={false}
                                type="number"
                              />
                              <YAxis
                                axisLine={false}
                                dataKey="label"
                                tick={{ fill: "#111827", fontSize: 12 }}
                                tickLine={false}
                                type="category"
                                width={92}
                              />
                              <Tooltip formatter={(value) => formatPercent(value, 1)} />
                              <Bar dataKey="value" fill="#111827" radius={[0, 10, 10, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <section className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-[#6B7280]">Section informations client</p>
                      <h3 className="mt-1 text-xl font-bold text-[#111827]">Informations specifiques</h3>
                    </div>

                    <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-[#111827]">
                          Profil entreprise
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6B7280]">
                          Vue relationnelle, administrative et contextuelle du client.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <UserRound className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Gestionnaire</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {client.summary.manager || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <Sparkles className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Persona</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {insights.persona || client.summary.persona || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <Building2 className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Secteur detaille</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {client.summary.sector_detail || client.summary.sector || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <MapPinned className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Wilaya</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {client.summary.wilaya || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <CalendarDays className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Date de creation</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {formatDate(client.summary.creation_date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <TrendingUp className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Capital simule</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {formatCurrencyDa(client.summary.capital_simulated)}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                          <p className="text-sm font-medium text-[#6B7280]">Actionnaires</p>
                          <p className="mt-1 text-sm font-semibold text-[#111827]">
                            {client.summary.shareholders_count || 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </section>

                  {LOCAL_PITCH_ENABLED ? (
                    <section className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-[#6B7280]">Section AI pitch</p>
                        <h3 className="mt-1 text-xl font-bold text-[#111827]">Shadow Pitch local</h3>
                      </div>

                      <Card className="overflow-hidden rounded-xl border border-[#E60028]/20 bg-slate-950 shadow-sm">
                        <CardHeader className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(230,0,40,0.18),transparent_38%)]">
                          <CardTitle className="text-xl font-bold text-white">Pitch IA</CardTitle>
                          <CardDescription className="text-sm text-slate-300">
                            Generation hors-ligne via Ollama sur le produit selectionne.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-400">Produit cible</p>
                              <p className="mt-1 text-xl font-bold text-white">
                                {selectedRecommendation?.product || "N/A"}
                              </p>
                            </div>

                            <LLMPitchStream
                              clientId={selectedClientId}
                              disabled={!selectedRecommendation}
                              onGenerated={(generatedPitch) => {
                                setPitchContent(generatedPitch || selectedRecommendation?.argumentaire || "");
                                setPitchSource("ollama-stream");
                              }}
                              productName={selectedRecommendation?.product || selectedRecommendation?.product_signal}
                            />
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <PitchMarkdown content={pitchContent || "Aucun argumentaire disponible."} muted />
                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                              Source {pitchSource}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </section>
                  ) : null}
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
                  <section className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-[#6B7280]">Section recommandations</p>
                      <h3 className="mt-1 text-xl font-bold text-[#111827]">Recommandations et RL</h3>
                    </div>

                    <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-[#111827]">
                          Produits recommandes
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6B7280]">
                          Selection du produit, priorisation commerciale et retour terrain.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {recommendations.length ? (
                            recommendations.slice(0, 3).map((recommendation) => (
                              <button
                                key={recommendation.product_signal}
                                className={`rounded-xl border p-4 text-left transition ${
                                  recommendation.product_signal === selectedProductId
                                    ? "border-[#E60028] bg-[#FFF5F6]"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                                onClick={() => setSelectedProductId(recommendation.product_signal)}
                                type="button"
                              >
                                <p className="text-sm font-semibold text-[#111827]">{recommendation.product}</p>
                                <p className="mt-2 text-sm text-[#6B7280]">
                                  Confiance {formatPercent(recommendation.confidence_pct)}
                                </p>
                                <p className="mt-2 text-sm text-[#6B7280]">{recommendation.family}</p>
                              </button>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-[#6B7280]">
                              Aucune recommandation disponible.
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-medium text-[#6B7280]">Produit selectionne</p>
                              <p className="mt-1 text-xl font-bold text-[#111827]">
                                {selectedRecommendation?.product || "N/A"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge className="border border-slate-200 bg-white text-slate-700" variant="outline">
                                {selectedRecommendation?.family || "Famille N/A"}
                              </Badge>
                              <Badge className="border border-[#E60028]/10 bg-[#FFF5F6] text-[#E60028]" variant="outline">
                                {formatPercent(selectedRecommendation?.confidence_pct)}
                              </Badge>
                            </div>
                          </div>

                          <Accordion className="mt-4" collapsible type="single">
                            <AccordionItem value="fiche-visite">
                              <AccordionTrigger className="text-left text-sm font-medium text-[#111827]">
                                Fiche visite
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="max-h-64 overflow-y-auto rounded-xl bg-white p-4 text-sm leading-7 text-[#6B7280]">
                                  <pre className="whitespace-pre-wrap font-sans">
                                    {insights.fiche_visite || "Aucune fiche visite disponible."}
                                  </pre>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>

                        <form className="space-y-4" onSubmit={handleFeedbackSubmit}>
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <label className="block text-sm font-medium text-[#111827]" htmlFor="feedback-comment">
                              Compte rendu d'entretien
                            </label>
                            <Textarea
                              className="mt-2 min-h-32 rounded-xl border-slate-200 focus-visible:border-[#E60028] focus-visible:ring-[#E60028]"
                              id="feedback-comment"
                              onChange={(event) => setFeedbackComment(event.target.value)}
                              placeholder="Resumer la reaction du client, les objections et l'interet observe."
                              value={feedbackComment}
                            />
                          </div>

                          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                            <div>
                              <p className="text-sm font-medium text-[#111827]">
                                Produit accepte par le client ?
                              </p>
                              <p className="mt-1 text-sm text-[#6B7280]">
                                Ce retour met a jour le modele de recommandation.
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-[#111827]">
                                {accepted ? "Oui" : "Non"}
                              </span>
                              <Switch checked={accepted} onCheckedChange={setAccepted} />
                            </div>
                          </div>

                          <Button className="h-12 w-full rounded-xl" disabled={submittingFeedback} type="submit">
                            {submittingFeedback ? (
                              <>
                                <LoaderCircle className="size-4 animate-spin" />
                                Apprentissage...
                              </>
                            ) : (
                              <>
                                <BrainCircuit className="size-4" />
                                Ouvrir la confirmation RL
                              </>
                            )}
                          </Button>
                        </form>

                        {lastFeedbackMeta ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-sm font-medium text-emerald-800">
                              {lastFeedbackMeta.notification}
                            </p>
                            <p className="mt-2 text-sm text-emerald-700">
                              Reward {Number(lastFeedbackMeta.reward || 0).toFixed(2)} · Sentiment{" "}
                              {lastFeedbackMeta.sentiment}
                            </p>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </section>

                  <section className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-[#6B7280]">Section usages produits</p>
                      <h3 className="mt-1 text-xl font-bold text-[#111827]">Usages et equipement</h3>
                    </div>

                    <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-[#111827]">Mix produits</CardTitle>
                        <CardDescription className="text-sm text-[#6B7280]">
                          Repartition des usages produits du client.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer height="100%" width="100%">
                            <PieChart>
                              <Pie
                                cx="50%"
                                cy="50%"
                                data={client.summary.product_distribution || []}
                                dataKey="value"
                                innerRadius={55}
                                outerRadius={84}
                                paddingAngle={3}
                              >
                                {(client.summary.product_distribution || []).map((entry, index) => (
                                  <Cell
                                    fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                                    key={`${entry.name}-${index}`}
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="mt-4 space-y-3">
                          {(client.summary.product_distribution || []).map((item, index) => (
                            <div className="flex items-center justify-between gap-3" key={item.name}>
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      item.color || CHART_COLORS[index % CHART_COLORS.length],
                                  }}
                                />
                                <span className="text-sm font-medium text-[#111827]">{item.name}</span>
                              </div>
                              <span className="text-sm text-[#6B7280]">{formatPercent(item.value)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </section>

                  <section className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-[#6B7280]">Section complementaire</p>
                      <h3 className="mt-1 text-xl font-bold text-[#111827]">Profil complementaire</h3>
                    </div>

                    <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-[#111827]">Informations client</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <UserRound className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Gestionnaire</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {client.summary.manager || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <Building2 className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Secteur detaille</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {client.summary.sector_detail || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <TrendingUp className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Capital simule</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {formatCurrencyDa(client.summary.capital_simulated)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                          <Sparkles className="mt-0.5 size-5 text-[#E60028]" />
                          <div>
                            <p className="text-sm font-medium text-[#6B7280]">Persona</p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {insights.persona || client.summary.persona || "N/A"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </section>
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
