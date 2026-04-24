import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  LoaderCircle,
  Search,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Sidebar } from "../components/Sidebar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { fetchManagerClients } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const SEGMENT_OPTIONS = [
  { value: "all", label: "Tous segments" },
  { value: "PME", label: "PME" },
  { value: "GE", label: "GE" },
];

const CHURN_OPTIONS = [
  { value: "all", label: "Tous statuts churn" },
  { value: "critical", label: "Churn critique" },
  { value: "stable", label: "Stables" },
];

const SORT_OPTIONS = [
  { value: "churn", label: "Priorité churn" },
  { value: "revenue", label: "CA décroissant" },
  { value: "quality", label: "Qualité client" },
];

function formatCurrencyDa(value, options = {}) {
  const numericValue = Number(value || 0);
  const formatter = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    notation: options.compact ? "compact" : "standard",
  });

  return `${formatter.format(numericValue)} DA`;
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

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-[30px] bg-white shadow-sm" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-[28px] bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-[28px] bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-[28px] bg-white shadow-sm" />
      </div>
      <div className="h-[32rem] animate-pulse rounded-[30px] bg-white shadow-sm" />
    </div>
  );
}

export function ClientList() {
  const navigate = useNavigate();
  const { logout, session } = useAuth();

  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [churnFilter, setChurnFilter] = useState("all");
  const [sortBy, setSortBy] = useState("churn");
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let active = true;

    async function loadPortfolio() {
      setIsLoading(true);

      try {
        const response = await fetchManagerClients({
          churnStatus: churnFilter,
          managerEmail: session?.email,
          query: deferredSearch,
          segment: segmentFilter,
          sortBy,
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
          setIsLoading(false);
        }
      }
    }

    loadPortfolio();

    return () => {
      active = false;
    };
  }, [churnFilter, deferredSearch, segmentFilter, session?.email, sortBy]);

  const clients = portfolio?.clients || [];
  const summary = portfolio?.summary || {};

  const churnRate = useMemo(() => {
    if (!summary.total_clients) {
      return 0;
    }

    return (Number(summary.churn_alerts || 0) / Number(summary.total_clients || 1)) * 100;
  }, [summary]);

  function handleLogout() {
    logout();
    toast.success("Session fermée.");
    navigate("/login", { replace: true });
  }

  function handleNavigate(routeKey) {
    if (routeKey === "portfolio") {
      return;
    }

    if (routeKey === "client" && clients[0]?.client_id) {
      navigate(`/clients/${clients[0].client_id}`, {
        state: { managerName: portfolio?.manager },
      });
    }
  }

  function openClientDashboard(clientId) {
    navigate(`/clients/${clientId}`, {
      state: { managerName: portfolio?.manager },
    });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7fe_0%,#eef3ff_100%)]">
      <Sidebar
        activeRoute="portfolio"
        currentClientId={null}
        managerName={portfolio?.manager}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
      />

      <div className="lg:pl-[21rem]">
        <main className="min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:px-10 lg:pt-10">
          {isLoading ? (
            <PortfolioSkeleton />
          ) : (
            <div className="space-y-8">
              <section className="rounded-[34px] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.26)] backdrop-blur-md sm:p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#6B7280]">
                      Mon portefeuille
                    </p>
                    <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#111827] sm:text-5xl">
                      {portfolio?.manager || "Gestionnaire"} - vue globale
                    </h1>
                    <p className="mt-4 text-base font-medium leading-8 text-[#6B7280]">
                      Tous les clients affectés au gestionnaire connecté sont centralisés ici avec
                      un tri prioritaire sur le churn, les revenus et la qualité client.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Badge
                      className="border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                      variant="outline"
                    >
                      {summary.total_clients || 0} clients suivis
                    </Badge>
                    <Badge
                      className="border border-[#E60028]/10 bg-[#FFF4F6] px-4 py-2 text-sm text-[#E60028]"
                      variant="outline"
                    >
                      {summary.churn_alerts || 0} alertes churn
                    </Badge>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <Card className="rounded-[26px] border-slate-200/80 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[#6B7280]">Clients gérés</p>
                          <p className="font-display mt-4 text-4xl font-extrabold text-[#111827]">
                            {summary.total_clients || 0}
                          </p>
                          <p className="mt-2 text-sm font-medium text-[#6B7280]">
                            Portefeuille actif du gestionnaire connecté
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <Users className="size-5 text-[#111827]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[26px] border-slate-200/80 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[#6B7280]">Churn critique</p>
                          <p className="font-display mt-4 text-4xl font-extrabold text-[#E60028]">
                            {summary.churn_alerts || 0}
                          </p>
                          <p className="mt-2 text-sm font-medium text-[#6B7280]">
                            {churnRate.toFixed(1)}% du portefeuille à surveiller
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#FFF4F6] p-3">
                          <TriangleAlert className="size-5 text-[#E60028]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[26px] border-slate-200/80 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[#6B7280]">CA cumulé</p>
                          <p className="font-display mt-4 text-4xl font-extrabold text-[#111827]">
                            {formatCurrencyDa(summary.total_revenue, { compact: true })}
                          </p>
                          <p className="mt-2 text-sm font-medium text-[#6B7280]">
                            Moyenne qualité {Number(summary.average_quality || 0).toFixed(1)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <CircleDollarSign className="size-5 text-[#111827]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section className="rounded-[34px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.18)] sm:p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7280]">
                      DataTable portefeuille
                    </p>
                    <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-[#111827]">
                      Liste clients gérés
                    </h2>
                    <p className="mt-3 text-sm font-medium leading-7 text-[#6B7280]">
                      Utilisez les filtres déroulants pour réduire la vue aux dossiers prioritaires
                      avant d'ouvrir la fiche 360.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 xl:w-[min(48rem,100%)] xl:flex-row xl:items-center">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-base shadow-sm focus-visible:border-[#E60028] focus-visible:ring-[#E60028]/15"
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Rechercher un ID client ou un secteur"
                        value={search}
                      />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="h-12 rounded-2xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50" variant="outline">
                          {SEGMENT_OPTIONS.find((item) => item.value === segmentFilter)?.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 p-2">
                        <DropdownMenuLabel>Segment</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup onValueChange={setSegmentFilter} value={segmentFilter}>
                          {SEGMENT_OPTIONS.map((option) => (
                            <DropdownMenuRadioItem key={option.value} value={option.value}>
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="h-12 rounded-2xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50" variant="outline">
                          {CHURN_OPTIONS.find((item) => item.value === churnFilter)?.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 p-2">
                        <DropdownMenuLabel>Statut churn</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup onValueChange={setChurnFilter} value={churnFilter}>
                          {CHURN_OPTIONS.map((option) => (
                            <DropdownMenuRadioItem key={option.value} value={option.value}>
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="h-12 rounded-2xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50" variant="outline">
                          {SORT_OPTIONS.find((item) => item.value === sortBy)?.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 p-2">
                        <DropdownMenuLabel>Tri</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup onValueChange={setSortBy} value={sortBy}>
                          {SORT_OPTIONS.map((option) => (
                            <DropdownMenuRadioItem key={option.value} value={option.value}>
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200">
                  <Table>
                    <TableHeader className="bg-slate-50/90">
                      <TableRow className="hover:bg-slate-50/90">
                        <TableHead className="px-4 py-4 font-semibold text-[#6B7280]">ID Client</TableHead>
                        <TableHead className="px-4 py-4 font-semibold text-[#6B7280]">Qualité</TableHead>
                        <TableHead className="px-4 py-4 font-semibold text-[#6B7280]">Chiffre d'affaire</TableHead>
                        <TableHead className="px-4 py-4 font-semibold text-[#6B7280]">Statut churn</TableHead>
                        <TableHead className="px-4 py-4 font-semibold text-[#6B7280]">Secteur</TableHead>
                        <TableHead className="px-4 py-4 text-right font-semibold text-[#6B7280]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.length ? (
                        clients.map((client) => (
                          <TableRow
                            key={client.client_id}
                            className="cursor-pointer border-slate-100 bg-white hover:bg-[#FFF9FA]"
                            onClick={() => openClientDashboard(client.client_id)}
                          >
                            <TableCell className="px-4 py-4">
                              <div>
                                <p className="font-display text-lg font-extrabold text-[#111827]">
                                  {client.client_id}
                                </p>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                                  {client.segment || "N/A"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <Badge
                                className={getQualityBadgeClass(client.quality_client)}
                                variant="outline"
                              >
                                {Number(client.quality_client || 0).toFixed(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-sm font-bold text-[#111827]">
                              {formatCurrencyDa(client.chiffre_affaire, { compact: true })}
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <Badge
                                className={
                                  client.churn_alert_flag
                                    ? "border-rose-200 bg-rose-50 text-rose-700"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                }
                                variant="outline"
                              >
                                {client.churn_alert_flag ? "Churn critique" : "Stable"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div>
                                <p className="text-sm font-semibold text-[#111827]">{client.sector || "N/A"}</p>
                                <p className="mt-1 text-sm font-medium text-[#6B7280]">
                                  {client.manager}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-right">
                              <Button
                                className="h-10 rounded-2xl"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openClientDashboard(client.client_id);
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
                        <TableRow className="hover:bg-white">
                          <TableCell className="px-4 py-16 text-center" colSpan={6}>
                            <div className="mx-auto max-w-md">
                              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-50">
                                <Sparkles className="size-6 text-[#E60028]" />
                              </div>
                              <p className="mt-5 font-display text-2xl font-extrabold text-[#111827]">
                                Aucun client trouvé
                              </p>
                              <p className="mt-3 text-sm font-medium leading-7 text-[#6B7280]">
                                Ajustez les filtres ou la recherche pour afficher un autre segment du portefeuille.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
