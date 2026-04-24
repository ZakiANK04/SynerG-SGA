import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  LoaderCircle,
  Map,
  MapPin,
  Radar,
  Search,
  Sparkles,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { fetchCartographyClient, fetchClientIds, fetchSimilarClients } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const WILAYA_GEO_POINTS = {
  ALGER: { label: "Alger", lon: 3.0588, lat: 36.7538 },
  ALGER1: { label: "Alger", lon: 3.0488, lat: 36.7638 },
  ALGER2: { label: "Alger", lon: 3.0888, lat: 36.7438 },
  ALGER3: { label: "Alger", lon: 3.0188, lat: 36.7338 },
  ANNABA: { label: "Annaba", lon: 7.7667, lat: 36.9000 },
  BEJAIA: { label: "Bejaia", lon: 5.0667, lat: 36.7500 },
  BLIDA: { label: "Blida", lon: 2.8300, lat: 36.4700 },
  CONSTANTINE: { label: "Constantine", lon: 6.6147, lat: 36.3650 },
  DGE: { label: "Alger", lon: 3.0588, lat: 36.7538 },
  ORAN: { label: "Oran", lon: -0.6417, lat: 35.6969 },
  SETIF: { label: "Setif", lon: 5.4000, lat: 36.1900 },
  "SIDI BELABESS": { label: "Sidi Bel Abbes", lon: -0.6300, lat: 35.1900 },
  "SIDI BEL ABBES": { label: "Sidi Bel Abbes", lon: -0.6300, lat: 35.1900 },
  "TIZI OUZOU": { label: "Tizi Ouzou", lon: 4.0500, lat: 36.7100 },
  "0": { label: "Wilaya non renseignee", lon: 2.5, lat: 31.5 },
};
const MAP_LABELS = [
  { key: "ORAN", dx: -28, dy: -10 },
  { key: "SIDI BELABESS", dx: -44, dy: 18 },
  { key: "ALGER", dx: -18, dy: -26 },
  { key: "BLIDA", dx: -34, dy: 24 },
  { key: "BEJAIA", dx: 18, dy: -16 },
  { key: "TIZI OUZOU", dx: -18, dy: -30 },
  { key: "SETIF", dx: -16, dy: 28 },
  { key: "CONSTANTINE", dx: -16, dy: 24 },
  { key: "ANNABA", dx: 12, dy: -12 },
];

function normalizeWilayaKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\d+/g, (match) => match)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function formatCurrencyDa(value) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} DA`;
}

function buildGeoJsonProjection(geoJson) {
  const feature = geoJson?.features?.[0];
  const geometry = feature?.geometry;
  if (!geometry?.coordinates?.length) {
    return null;
  }

  const polygons = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
  const allPoints = polygons.flat(2);
  const longitudes = allPoints.map((point) => point[0]);
  const latitudes = allPoints.map((point) => point[1]);

  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const width = 900;
  const height = 720;
  const padding = 26;
  const scaleX = (width - padding * 2) / (maxLon - minLon || 1);
  const scaleY = (height - padding * 2) / (maxLat - minLat || 1);
  const scale = Math.min(scaleX, scaleY);
  const projectedWidth = (maxLon - minLon) * scale;
  const projectedHeight = (maxLat - minLat) * scale;
  const offsetX = (width - projectedWidth) / 2;
  const offsetY = (height - projectedHeight) / 2;

  function projectPoint([lon, lat]) {
    const x = offsetX + (lon - minLon) * scale;
    const y = height - (offsetY + (lat - minLat) * scale);
    return [x, y];
  }

  const path = polygons
    .map((polygon) =>
      polygon
        .map((ring) =>
          ring
            .map((point, pointIndex) => {
              const [x, y] = projectPoint(point);
              return `${pointIndex === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(" ")
            .concat(" Z"),
        )
        .join(" "),
    )
    .join(" ");

  return {
    path,
    projectPoint,
  };
}

function AlgeriaOfflineMap({ clientData, similarClients = [] }) {
  const [projection, setProjection] = useState(null);

  useEffect(() => {
    let active = true;

    fetch("/dza.geojson")
      .then((response) => response.json())
      .then((geoJson) => {
        if (!active) {
          return;
        }

        setProjection(buildGeoJsonProjection(geoJson));
      })
      .catch(() => {
        if (active) {
          setProjection(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const activeWilaya = useMemo(() => {
    const geoPoint = WILAYA_GEO_POINTS[normalizeWilayaKey(clientData?.wilaya)] || null;
    if (!geoPoint || !projection?.projectPoint) {
      return geoPoint ? { ...geoPoint, x: 450, y: 240 } : null;
    }

    const [x, y] = projection.projectPoint([geoPoint.lon, geoPoint.lat]);
    return { ...geoPoint, x, y };
  }, [clientData?.wilaya, projection]);

  const similarMarkers = useMemo(
    () =>
      similarClients
        .map((clientItem) => {
          const geoPoint = WILAYA_GEO_POINTS[normalizeWilayaKey(clientItem.wilaya)] || null;
          if (!geoPoint) {
            return null;
          }

          const [x, y] = projection?.projectPoint
            ? projection.projectPoint([geoPoint.lon, geoPoint.lat])
            : [450, 240];

          return {
            ...clientItem,
            marker: { ...geoPoint, x, y },
          };
        })
        .filter(Boolean),
    [projection, similarClients],
  );

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(230,0,40,0.1),transparent_24%),linear-gradient(180deg,#fff_0%,#f8fbff_100%)] p-4 sm:p-6">
      <svg className="h-[24rem] w-full sm:h-[30rem]" preserveAspectRatio="xMidYMid meet" viewBox="0 0 900 720">
        <defs>
          <filter id="glow">
            <feGaussianBlur result="blur" stdDeviation="5" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern
            height="48"
            id="map-grid"
            patternUnits="userSpaceOnUse"
            width="48"
          >
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect fill="url(#map-grid)" height="720" rx="24" width="900" x="0" y="0" />

        {projection?.path ? (
          <>
            <path
              d={projection.path}
              fill="#EEF3FB"
              stroke="#94A3B8"
              strokeWidth="8"
            />
            <path
              d={projection.path}
              fill="transparent"
              stroke="rgba(17,24,39,0.08)"
              strokeWidth="24"
            />
          </>
        ) : (
          <rect
            fill="#EEF3FB"
            height="520"
            rx="36"
            stroke="#94A3B8"
            strokeWidth="6"
            width="720"
            x="90"
            y="100"
          />
        )}

        {MAP_LABELS.map((item) => (
          (() => {
            const geoPoint = WILAYA_GEO_POINTS[item.key];
            if (!geoPoint) {
              return null;
            }

            const [x, y] = projection?.projectPoint
              ? projection.projectPoint([geoPoint.lon, geoPoint.lat])
              : [450, 240];

            return (
              <text
                key={item.key}
                fill="#64748B"
                fontSize="18"
                fontWeight="700"
                x={x + item.dx}
                y={y + item.dy}
              >
                {geoPoint.label}
              </text>
            );
          })()
        ))}

        {Object.entries(WILAYA_GEO_POINTS).map(([key, marker]) => {
          const isActive = activeWilaya && key === normalizeWilayaKey(clientData?.wilaya);
          const [x, y] = projection?.projectPoint
            ? projection.projectPoint([marker.lon, marker.lat])
            : [450, 240];

          return (
            <g key={key} opacity={isActive ? 1 : 0.72}>
              <circle
                cx={x}
                cy={y}
                fill={isActive ? clientData.color : "#94A3B8"}
                filter={isActive ? "url(#glow)" : undefined}
                r={isActive ? 18 : 7}
                stroke="#FFFFFF"
                strokeWidth={isActive ? 5 : 2}
              />
              {isActive ? (
                <text
                  fill="#111827"
                  fontSize="22"
                  fontWeight="800"
                  textAnchor="middle"
                  x={x}
                  y={y - 28}
                >
                  {marker.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {similarMarkers.map((clientItem, index) => (
          <g key={`${clientItem.client_id}-${index}`}>
            <circle
              cx={clientItem.marker.x}
              cy={clientItem.marker.y}
              fill="rgba(17,24,39,0.82)"
              r="10"
              stroke="#FFFFFF"
              strokeWidth="3"
            />
            <circle
              cx={clientItem.marker.x}
              cy={clientItem.marker.y}
              fill="transparent"
              r="18"
              stroke="rgba(230,0,40,0.28)"
              strokeWidth="2"
            />
            <text
              fill="#111827"
              fontSize="12"
              fontWeight="700"
              textAnchor="middle"
              x={clientItem.marker.x}
              y={clientItem.marker.y - 18}
            >
              {Number(clientItem.similarity_pct || 0).toFixed(0)}%
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Wilaya cible</p>
          <p className="mt-2 text-lg font-bold text-[#111827]">
            {activeWilaya?.label || clientData?.wilaya || "Non localisee"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: clientData?.color || "#6B7280" }}
            />
            <span className="text-sm text-[#6B7280]">{clientData?.segment || "Autre"}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Jumeaux regionaux</p>
          <p className="mt-2 text-lg font-bold text-[#111827]">{similarClients.length} clients similaires</p>
          <p className="mt-2 text-sm text-[#6B7280]">
            Les cercles sombres pointent les 5 meilleurs matchs hors Wilaya et hors gestionnaire.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CartographyPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();

  const [clientSearch, setClientSearch] = useState(searchParams.get("client") || "");
  const [clientIds, setClientIds] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [similarClients, setSimilarClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    fetchClientIds()
      .then((payload) => {
        if (!active) {
          return;
        }

        const ids = Array.isArray(payload?.clients) ? payload.clients : Array.isArray(payload) ? payload : [];
        setClientIds(ids.slice(0, 200));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  async function runSearch(clientId) {
    const normalizedClientId = clientId.trim().toUpperCase();
    if (!normalizedClientId) {
      setErrorMessage("Saisissez un code client.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const [clientPayload, similarPayload] = await Promise.all([
        fetchCartographyClient(normalizedClientId, {
          managerEmail: session?.email,
          managerName: session?.managerName,
        }),
        fetchSimilarClients(normalizedClientId, {
          managerEmail: session?.email,
          managerName: session?.managerName,
          limit: 5,
        }),
      ]);

      setClientData(clientPayload);
      setSimilarClients(similarPayload.matches || []);

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("client", normalizedClientId);
      setSearchParams(nextParams, { replace: true });
    } catch (error) {
      setClientData(null);
      setSimilarClients([]);
      setErrorMessage(error.message || "Client introuvable.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    runSearch(clientSearch);
  }

  useEffect(() => {
    const queryClient = searchParams.get("client");
    if (queryClient) {
      runSearch(queryClient);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageTitle = useMemo(
    () => clientData?.display_name || "Recherche cartographique client",
    [clientData],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-[#6B7280]">Section cartographie</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
              Cartographie & clients jumeaux
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B7280]">
              Localisez un client sur une carte offline de l&apos;Algerie, colorez sa Wilaya par
              categorie, puis identifiez cinq comptes similaires dans d&apos;autres regions.
            </p>
          </div>

          <Badge className="w-fit border border-slate-200 bg-slate-50 text-slate-700" variant="outline">
            {pageTitle}
          </Badge>
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
        <form className="flex flex-col gap-3 lg:flex-row" onSubmit={handleSubmit}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              className="h-12 rounded-xl border-slate-200 pl-11 focus-visible:border-[#E60028] focus-visible:ring-[#E60028]"
              list="cartography-client-options"
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="Entrez le code client (ex: CLI999)"
              value={clientSearch}
            />
            <datalist id="cartography-client-options">
              {clientIds.map((clientId) => (
                <option key={clientId} value={clientId} />
              ))}
            </datalist>
          </div>

          <Button className="h-12 rounded-xl" disabled={loading} type="submit">
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <Map className="size-4" />
                Lancer la cartographie
              </>
            )}
          </Button>
        </form>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage || "Client introuvable"}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#111827]">
              <MapPin className="size-5 text-[#E60028]" />
              Carte offline de l&apos;Algerie
            </CardTitle>
            <CardDescription className="text-sm text-[#6B7280]">
              La Wilaya du client est illuminee selon sa segmentation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlgeriaOfflineMap clientData={clientData} similarClients={similarClients} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#111827]">Client recherche</CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Wilaya, categorie et gestionnaire rattaches au compte cible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientData ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-[#111827]">{clientData.display_name}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">{clientData.client_id}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-[#6B7280]">Wilaya</p>
                      <p className="mt-1 text-sm font-semibold text-[#111827]">{clientData.wilaya}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-[#6B7280]">Gestionnaire</p>
                      <p className="mt-1 text-sm font-semibold text-[#111827]">{clientData.manager}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: clientData.color }}
                    />
                    <span className="text-sm font-semibold text-[#111827]">{clientData.segment}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#6B7280]">Aucun client selectionne pour le moment.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#111827]">
                <Sparkles className="size-5 text-[#E60028]" />
                Top 5 Clients Similaires
              </CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Look-alike ML hors Wilaya cible et hors gestionnaire cible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-[#6B7280]">
                  <LoaderCircle className="size-4 animate-spin text-[#E60028]" />
                  Calcul des voisins les plus proches...
                </div>
              ) : similarClients.length ? (
                similarClients.map((similarClient) => (
                  <div
                    className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur"
                    key={similarClient.client_id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{similarClient.client_id}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">{similarClient.display_name}</p>
                      </div>
                      <Badge className="border border-[#E60028]/15 bg-[#FFF1F3] text-[#E60028]" variant="outline">
                        Match {Number(similarClient.similarity_pct || 0).toFixed(0)}%
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#6B7280]">Wilaya</p>
                        <p className="mt-2 text-sm font-semibold text-[#111827]">{similarClient.wilaya}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#6B7280]">PNB</p>
                        <p className="mt-2 text-sm font-semibold text-[#111827]">
                          {formatCurrencyDa(similarClient.pnb_net)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#6B7280]">Distance client</p>
                        <p className="mt-2 text-sm font-semibold text-[#111827]">
                          {Number(similarClient.distance || 0).toFixed(3)}
                        </p>
                      </div>
                    </div>

                    <Button
                      className="mt-4 h-10 w-full rounded-xl"
                      onClick={() =>
                        navigate(
                          `/dashboard?client=${encodeURIComponent(similarClient.client_id)}&source_client=${encodeURIComponent(clientData?.client_id || "")}&allow_cartography_match=true`,
                        )
                      }
                      type="button"
                      variant="outline"
                    >
                      <Radar className="size-4 text-[#E60028]" />
                      Voir Fiche 360
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">
                  Lancez une recherche client pour afficher les jumeaux detectes par le modele.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
