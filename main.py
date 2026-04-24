from __future__ import annotations

import csv
import hashlib
import json
import math
import os
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    import httpx
except ImportError:  # pragma: no cover - optional when local Ollama is disabled
    httpx = None

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "df_final_features.csv"
INSIGHTS_PATH = BASE_DIR / "client_ai_insights.json"
MANIFEST_PATH = BASE_DIR / "exported_model_manifest.json"
FEEDBACK_LOG_PATH = BASE_DIR / "feedback_logs.csv"
BANDIT_STATE_PATH = BASE_DIR / "bandit_state.json"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OLLAMA_BASE_URL_CANDIDATES = list(
    dict.fromkeys(
        [
            OLLAMA_BASE_URL,
            "http://localhost:11434",
            "http://127.0.0.1:11434",
        ]
    )
)

LOCAL_FRENCH_STOPWORDS = {
    "de",
    "la",
    "le",
    "les",
    "un",
    "une",
    "du",
    "des",
    "et",
    "ou",
    "en",
    "dans",
    "pour",
    "sur",
    "au",
    "aux",
    "ce",
    "cet",
    "cette",
    "ces",
    "est",
    "sont",
    "avec",
    "par",
    "pas",
    "plus",
    "moins",
    "tres",
    "très",
    "ne",
    "que",
    "qui",
    "quoi",
    "dont",
    "a",
    "ai",
    "avons",
    "vous",
    "nous",
    "il",
    "elle",
    "ils",
    "elles",
    "je",
    "tu",
    "mais",
    "car",
    "comme",
}

POSITIVE_BANKING_WORDS = {
    "accepte",
    "accepté",
    "adopte",
    "adopté",
    "utile",
    "pertinent",
    "opportun",
    "satisfait",
    "rentable",
    "intéressant",
    "interessant",
    "rapide",
    "fluide",
    "confiance",
    "favorable",
    "excellent",
    "interesse",
    "intéressé",
}

NEGATIVE_BANKING_WORDS = {
    "refus",
    "refuse",
    "refusé",
    "cher",
    "risque",
    "bloque",
    "bloqué",
    "plaintes",
    "plainte",
    "inutile",
    "retard",
    "problème",
    "probleme",
    "impayé",
    "impaye",
    "insatisfait",
    "non",
    "budget",
    "complexe",
}

PRODUCT_FAMILY_FALLBACK = {
    "Financing/Credit": "#E60028",
    "Cash Management": "#111827",
    "Trade Finance": "#FB923C",
    "Relationship Banking": "#38BDF8",
}

STOPWORDS_NORMALIZED = {
    unicodedata.normalize("NFKD", word).encode("ascii", "ignore").decode("ascii").lower()
    for word in LOCAL_FRENCH_STOPWORDS
}


class FeedbackPayload(BaseModel):
    client_id: str = Field(..., min_length=1)
    product_id: str = Field(..., min_length=1)
    accepted: bool
    comment: str = ""


class PitchPayload(BaseModel):
    client_id: str = Field(..., min_length=1)
    product_id: str | None = None
    product_name: str | None = None
    manager_email: str | None = None
    manager_name: str | None = None


class UCBBandit:
    def __init__(self, arms: list[str], contexts: list[str] | None = None):
        ordered_arms = list(dict.fromkeys(arms))
        ordered_contexts = list(dict.fromkeys(contexts or ["GLOBAL"]))

        if "GLOBAL" not in ordered_contexts:
            ordered_contexts.insert(0, "GLOBAL")

        self.arms = ordered_arms
        self.contexts = ordered_contexts
        self.counts = {ctx: {arm: 0 for arm in self.arms} for ctx in self.contexts}
        self.values = {ctx: {arm: 0.0 for arm in self.arms} for ctx in self.contexts}

    def _ctx(self, context: str | None) -> str:
        context_value = clean_string(context)
        return context_value if context_value in self.contexts else "GLOBAL"

    def ensure_arm(self, arm: str) -> str:
        arm_value = clean_string(arm)
        if arm_value and arm_value not in self.arms:
            self.arms.append(arm_value)
            for context in self.contexts:
                self.counts[context][arm_value] = 0
                self.values[context][arm_value] = 0.0
        return arm_value

    def score_arm(self, arm: str, context: str | None = None) -> float:
        ctx = self._ctx(context)
        arm_value = self.ensure_arm(arm)
        arm_count = self.counts[ctx][arm_value]
        if arm_count == 0:
            return 1.0

        total_counts = sum(self.counts[ctx].values()) + 1
        bonus = math.sqrt(2 * math.log(total_counts) / arm_count)
        return self.values[ctx][arm_value] + bonus

    def update(self, arm: str, reward: float, context: str | None = None) -> None:
        ctx = self._ctx(context)
        arm_value = self.ensure_arm(arm)
        self.counts[ctx][arm_value] += 1
        count = self.counts[ctx][arm_value]
        current_value = self.values[ctx][arm_value]
        self.values[ctx][arm_value] = current_value + (reward - current_value) / count

    def arm_state(self, arm: str, context: str | None = None) -> dict[str, Any]:
        ctx = self._ctx(context)
        arm_value = self.ensure_arm(arm)
        return {
            "count": self.counts[ctx][arm_value],
            "value": round(self.values[ctx][arm_value], 4),
            "ucb_score": round(self.score_arm(arm_value, ctx), 4),
            "context": ctx,
        }

    def snapshot(self) -> dict[str, Any]:
        return {
            "arms": self.arms,
            "contexts": self.contexts,
            "counts": self.counts,
            "values": self.values,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }


def clean_string(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def safe_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default

    try:
        if pd.isna(value):
            return default
    except TypeError:
        pass

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_native(value: Any) -> Any:
    if isinstance(value, pd.Timestamp):
        return value.date().isoformat()

    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass

    try:
        if pd.isna(value):
            return None
    except TypeError:
        pass

    if isinstance(value, dict):
        return {key: to_native(item) for key, item in value.items()}

    if isinstance(value, list):
        return [to_native(item) for item in value]

    return value


def normalize_text(value: Any) -> str:
    text = clean_string(value).lower()
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")


def tokenize_french_text(text: str) -> list[str]:
    normalized_text = normalize_text(text)
    normalized_text = re.sub(r"[^a-z0-9\s\-']", " ", normalized_text)
    tokens = re.findall(r"[a-z0-9']+", normalized_text)
    return [token for token in tokens if token not in STOPWORDS_NORMALIZED and len(token) > 1]


def score_feedback_sentiment(comment: str) -> dict[str, Any]:
    tokens = tokenize_french_text(comment)
    positive_words = {normalize_text(word) for word in POSITIVE_BANKING_WORDS}
    negative_words = {normalize_text(word) for word in NEGATIVE_BANKING_WORDS}

    positive_hits = sum(token in positive_words for token in tokens)
    negative_hits = sum(token in negative_words for token in tokens)

    if positive_hits > negative_hits:
        sentiment = "positive"
        multiplier = 1.25
    elif negative_hits > positive_hits:
        sentiment = "negative"
        multiplier = 0.75
    else:
        sentiment = "neutral"
        multiplier = 1.00

    return {
        "tokens": tokens,
        "positive_hits": positive_hits,
        "negative_hits": negative_hits,
        "sentiment": sentiment,
        "sentiment_multiplier": multiplier,
    }


def compute_reward(accepted: bool, comment: str) -> dict[str, Any]:
    sentiment_info = score_feedback_sentiment(comment)
    base = 1 if accepted else -1
    reward = base * sentiment_info["sentiment_multiplier"]
    sentiment_info["reward"] = round(reward, 4)
    return sentiment_info


def load_dataframe() -> pd.DataFrame:
    dataframe = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    dataframe["Client"] = dataframe["Client"].astype(str)
    return dataframe


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as file:
        return json.load(file)


DATAFRAME = load_dataframe()
INSIGHTS_DATA = load_json(INSIGHTS_PATH)
MODEL_MANIFEST = load_json(MANIFEST_PATH)
MANAGER_COLUMN = next(
    (column for column in DATAFRAME.columns if "relation" in normalize_text(column)),
    "Chargée de la relation",
)


def manager_sort_key(value: str) -> tuple[str, int, str]:
    normalized_value = normalize_text(value)
    number_match = re.search(r"(\d+)", normalized_value)
    numeric_suffix = int(number_match.group(1)) if number_match else 10_000
    alpha_prefix = re.sub(r"\d+", "", normalized_value)
    return alpha_prefix, numeric_suffix, normalized_value

PRODUCT_LABEL_TO_SIGNAL = {
    clean_string(meta.get("product_label")): signal for signal, meta in MODEL_MANIFEST.items()
}
PRODUCT_SIGNAL_TO_LABEL = {
    signal: clean_string(meta.get("product_label")) or signal for signal, meta in MODEL_MANIFEST.items()
}
NORMALIZED_SIGNAL_TO_SIGNAL = {normalize_text(signal): signal for signal in MODEL_MANIFEST}
NORMALIZED_LABEL_TO_SIGNAL = {
    normalize_text(label): signal for label, signal in PRODUCT_LABEL_TO_SIGNAL.items() if label
}

PRODUCT_ARMS = sorted(
    {
        *MODEL_MANIFEST.keys(),
        *(
            clean_string(recommendation.get("product_signal"))
            for insights in INSIGHTS_DATA.values()
            for recommendation in insights.get("recommendations", [])
            if isinstance(recommendation, dict)
        ),
    }
)

PERSONA_CONTEXTS = sorted(
    {
        clean_string(persona)
        for persona in DATAFRAME["Persona_Name"].dropna().astype(str).tolist()
        if clean_string(persona)
    }
)
MANAGER_NAMES = sorted(
    {
        clean_string(manager_name)
        for manager_name in DATAFRAME[MANAGER_COLUMN].dropna().astype(str).tolist()
        if clean_string(manager_name)
    },
    key=manager_sort_key,
)
MANAGER_SET = set(MANAGER_NAMES)
NORMALIZED_MANAGER_LOOKUP = {normalize_text(manager_name): manager_name for manager_name in MANAGER_NAMES}

BANDIT = UCBBandit(arms=PRODUCT_ARMS, contexts=PERSONA_CONTEXTS or ["GLOBAL"])
FEEDBACK_LOCK = Lock()

DATAFRAME_BY_CLIENT = DATAFRAME.set_index("Client", drop=False)


def save_bandit_snapshot() -> None:
    BANDIT_STATE_PATH.write_text(
        json.dumps(BANDIT.snapshot(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def replay_feedback_logs() -> None:
    if not FEEDBACK_LOG_PATH.exists():
        return

    try:
        feedback_df = pd.read_csv(FEEDBACK_LOG_PATH)
    except Exception:
        return

    for _, feedback_row in feedback_df.iterrows():
        product_id = resolve_product_signal(feedback_row.get("product_id"))
        reward = safe_float(feedback_row.get("reward"))
        persona = clean_string(feedback_row.get("persona")) or "GLOBAL"
        if product_id:
            BANDIT.update(product_id, reward, context=persona)

    save_bandit_snapshot()


def get_client_row(client_id: str) -> pd.Series:
    client_key = clean_string(client_id)
    if client_key not in DATAFRAME_BY_CLIENT.index:
        raise HTTPException(status_code=404, detail=f"Client {client_key} introuvable.")
    return DATAFRAME_BY_CLIENT.loc[client_key]


def resolve_product_signal(product_id: Any) -> str:
    normalized_product = clean_string(product_id)
    if normalized_product in MODEL_MANIFEST:
        return normalized_product
    if normalized_product in PRODUCT_LABEL_TO_SIGNAL:
        return PRODUCT_LABEL_TO_SIGNAL[normalized_product]
    normalized_lookup = normalize_text(normalized_product)
    if normalized_lookup in NORMALIZED_SIGNAL_TO_SIGNAL:
        return NORMALIZED_SIGNAL_TO_SIGNAL[normalized_lookup]
    if normalized_lookup in NORMALIZED_LABEL_TO_SIGNAL:
        return NORMALIZED_LABEL_TO_SIGNAL[normalized_lookup]
    return normalized_product


def truncate_text(value: Any, max_chars: int = 600) -> str:
    text = re.sub(r"\s+", " ", clean_string(value))
    if len(text) <= max_chars:
        return text
    return f"{text[: max_chars - 3].rstrip()}..."


def canonicalize_manager_name(value: Any) -> str:
    text_value = clean_string(value)
    if not text_value:
        return ""

    normalized_value = normalize_text(text_value)
    exact_match = NORMALIZED_MANAGER_LOOKUP.get(normalized_value)
    if exact_match:
        return exact_match

    number_match = re.search(r"(\d+)", normalized_value)
    if not number_match:
        return ""

    candidate = f"Ges{int(number_match.group(1))}"
    return candidate if candidate in MANAGER_SET else ""


def resolve_manager_name(
    manager_email: str | None = None,
    manager_name: str | None = None,
) -> tuple[str, str]:
    explicit_manager = canonicalize_manager_name(manager_name)
    if explicit_manager:
        return explicit_manager, "manager_name"

    email_local_part = clean_string(manager_email).split("@")[0]
    email_manager = canonicalize_manager_name(email_local_part)
    if email_manager:
        return email_manager, "manager_email"

    if email_local_part and MANAGER_NAMES:
        hash_digest = hashlib.sha256(email_local_part.encode("utf-8")).hexdigest()
        manager_index = int(hash_digest, 16) % len(MANAGER_NAMES)
        return MANAGER_NAMES[manager_index], "email_fallback"

    if MANAGER_NAMES:
        return MANAGER_NAMES[0], "default"

    return "", "unresolved"


def verify_client_manager_access(
    client_row: pd.Series,
    manager_email: str | None = None,
    manager_name: str | None = None,
) -> tuple[str, str] | None:
    if not clean_string(manager_email) and not clean_string(manager_name):
        return None

    resolved_manager, resolution_source = resolve_manager_name(
        manager_email=manager_email,
        manager_name=manager_name,
    )
    client_manager = clean_string(client_row.get(MANAGER_COLUMN))

    if resolved_manager and client_manager != resolved_manager:
        raise HTTPException(
            status_code=403,
            detail=f"Le client demande n'est pas rattache au gestionnaire {resolved_manager}.",
        )

    return resolved_manager, resolution_source


def build_manager_client_row(client_id: str, row_dict: dict[str, Any]) -> dict[str, Any]:
    client_summary = build_client_summary(client_id, row_dict)
    return {
        "client_id": client_summary["client_id"],
        "display_name": client_summary["display_name"],
        "manager": client_summary["manager"],
        "quality_client": client_summary["quality_client"],
        "segment": client_summary["segment"],
        "sector": client_summary["sector"],
        "sector_detail": client_summary["sector_detail"],
        "chiffre_affaire": client_summary["chiffre_affaire"],
        "pnb_net": client_summary["pnb_net"],
        "commissions_sum": client_summary["commissions_sum"],
        "total_engagement": client_summary["total_engagement"],
        "flux_confie_pct": client_summary["flux_confie_pct"],
        "relation_age_years": client_summary["relation_age_years"],
        "digital_score": client_summary["digital_score"],
        "churn_alert_flag": client_summary["churn_alert_flag"],
        "incident_status": client_summary["incident_status"],
    }


def filter_manager_clients_dataframe(
    manager_name: str,
    query: str | None = None,
    churn_status: str = "all",
    segment: str = "all",
) -> pd.DataFrame:
    filtered = DATAFRAME.copy()

    if manager_name:
        filtered = filtered[
            filtered[MANAGER_COLUMN].fillna("").astype(str).map(clean_string) == manager_name
        ]

    normalized_segment = normalize_text(segment)
    if normalized_segment and normalized_segment != "all":
        filtered = filtered[
            filtered["Segmenattion"].fillna("").astype(str).str.upper() == clean_string(segment).upper()
        ]

    normalized_churn_status = normalize_text(churn_status)
    churn_mask = filtered["Churn_Alert_Flag"].fillna(0).map(lambda value: safe_float(value) > 0)
    if normalized_churn_status == "critical":
        filtered = filtered[churn_mask]
    elif normalized_churn_status == "stable":
        filtered = filtered[~churn_mask]

    normalized_query = normalize_text(query)
    if normalized_query:
        searchable_columns = [
            "Client",
            "Groupe",
            "Secteur d'activité",
            "Secteur d'activité détaillé",
            MANAGER_COLUMN,
        ]
        search_mask = pd.Series(False, index=filtered.index)
        for column in searchable_columns:
            if column not in filtered.columns:
                continue
            column_mask = filtered[column].fillna("").astype(str).map(
                lambda value: normalized_query in normalize_text(value)
            )
            search_mask = search_mask | column_mask
        filtered = filtered[search_mask]

    return filtered


def sort_manager_clients_dataframe(dataframe: pd.DataFrame, sort_by: str) -> pd.DataFrame:
    normalized_sort = normalize_text(sort_by)

    if normalized_sort == "revenue":
        return dataframe.sort_values(
            by=["chiffre d'affaire", "Churn_Alert_Flag", "Qualité Client"],
            ascending=[False, False, False],
            kind="mergesort",
        )

    if normalized_sort == "quality":
        return dataframe.sort_values(
            by=["Qualité Client", "Churn_Alert_Flag", "chiffre d'affaire"],
            ascending=[False, False, False],
            kind="mergesort",
        )

    return dataframe.sort_values(
        by=["Churn_Alert_Flag", "Qualité Client", "chiffre d'affaire"],
        ascending=[False, False, False],
        kind="mergesort",
    )


def build_manager_portfolio_summary(dataframe: pd.DataFrame) -> dict[str, Any]:
    if dataframe.empty:
        return {
            "total_clients": 0,
            "churn_alerts": 0,
            "total_revenue": 0.0,
            "average_quality": 0.0,
            "total_pnb": 0.0,
            "average_flux_confie_pct": 0.0,
        }

    churn_alerts = int(
        dataframe["Churn_Alert_Flag"].fillna(0).map(lambda value: safe_float(value) > 0).sum()
    )
    total_revenue = float(dataframe["chiffre d'affaire"].fillna(0).map(safe_float).sum())
    average_quality = float(dataframe["Qualité Client"].fillna(0).map(safe_float).mean())
    total_pnb = float(dataframe["PNB_NET_15m"].fillna(0).map(safe_float).sum())
    average_flux_confie_pct = float(
        dataframe.apply(
            lambda row: compute_ratio_percent(
                safe_float(row.get("Flux_Crediteurs_Current_3M")),
                safe_float(row.get("chiffre d'affaire")),
            ),
            axis=1,
        ).mean()
    )

    return {
        "total_clients": int(dataframe.shape[0]),
        "churn_alerts": churn_alerts,
        "total_revenue": round(total_revenue, 2),
        "average_quality": round(average_quality, 2),
        "total_pnb": round(total_pnb, 2),
        "average_flux_confie_pct": round(average_flux_confie_pct, 2),
    }


def build_pitch_prompt(
    client_summary: dict[str, Any],
    insights_payload: dict[str, Any],
    recommendation: dict[str, Any],
    manager_name: str,
) -> str:
    top_missing_products = ", ".join(insights_payload.get("top_missing_profile_products", [])[:3]) or "N/A"
    churn_label = "oui" if client_summary.get("churn_alert_flag") else "non"

    return f"""
Tu es un expert sales B2B pour Société Générale Algérie.
Rédige en français un argumentaire oral premium, concret et prêt à être utilisé en rendez-vous.

Contraintes:
- 120 à 150 mots maximum
- ton professionnel et rassurant
- pas de puces
- termine par une proposition d'action claire

Contexte manager:
- Gestionnaire: {manager_name or "N/A"}

Contexte client:
- Client: {client_summary.get("display_name")} ({client_summary.get("client_id")})
- Segment: {client_summary.get("segment") or "N/A"}
- Secteur: {client_summary.get("sector") or "N/A"}
- Wilaya: {client_summary.get("wilaya") or "N/A"}
- Persona: {insights_payload.get("persona") or "N/A"}
- Qualité client: {client_summary.get("quality_client")}
- Churn alert: {churn_label}
- Chiffre d'affaire: {round(safe_float(client_summary.get("chiffre_affaire"))):,} DA
- PNB net: {round(safe_float(client_summary.get("pnb_net"))):,} DA

Produit recommandé:
- Produit: {recommendation.get("product")}
- Famille: {recommendation.get("family")}
- Confiance: {recommendation.get("confidence_pct")}%
- Argumentaire existant: {truncate_text(recommendation.get("argumentaire"), max_chars=260)}
- Produits manquants profil: {top_missing_products}
- Fiche visite: {truncate_text(insights_payload.get("fiche_visite"), max_chars=420)}
""".strip()


def clean_prompt_value(value: Any, fallback: str = "N/A") -> str:
    normalized = re.sub(r"\s+", " ", clean_string(value))
    return normalized or fallback


def describe_flux_tendance(current_flux: float, previous_flux: float) -> str:
    if previous_flux <= 0 and current_flux <= 0:
        return "Flux stables"

    if previous_flux <= 0 < current_flux:
        return "Forte hausse des flux crediteurs"

    variation_ratio = (current_flux - previous_flux) / previous_flux if previous_flux else 0.0

    if variation_ratio >= 0.2:
        return "Hausse nette des flux crediteurs"
    if variation_ratio >= 0.05:
        return "Legere hausse des flux crediteurs"
    if variation_ratio <= -0.2:
        return "Baisse marquee des flux crediteurs"
    if variation_ratio <= -0.05:
        return "Legere baisse des flux crediteurs"
    return "Flux globalement stables"


def resolve_pitch_product_value(payload: PitchPayload) -> str:
    product_value = clean_string(payload.product_name) or clean_string(payload.product_id)
    if not product_value:
        raise HTTPException(status_code=422, detail="Le produit a generer est requis.")
    return product_value


def build_shadow_pitch_context(client_id: str, row_dict: dict[str, Any]) -> dict[str, Any]:
    raw_insights = INSIGHTS_DATA.get(client_id) or {}
    raw_kpis = raw_insights.get("kpis") or {}

    current_flux = safe_float(
        raw_kpis.get("Flux_Crediteurs_Current_3M") or row_dict.get("Flux_Crediteurs_Current_3M")
    )
    previous_flux = safe_float(
        raw_kpis.get("Flux_Crediteurs_Previous_3M") or row_dict.get("Flux_Crediteurs_Previous_3M")
    )

    return {
        "persona": clean_prompt_value(raw_insights.get("persona") or row_dict.get("Persona_Name"), "Standard"),
        "secteur": clean_prompt_value(
            raw_insights.get("sector") or row_dict.get("Secteur d'activitÃ©"),
            "Secteur non renseigne",
        ),
        "churn_alert": int(
            safe_float(raw_kpis.get("Churn_Alert_Flag") or row_dict.get("Churn_Alert_Flag"))
        ),
        "pnb_net": round(
            safe_float(raw_kpis.get("PNB_NET_15m") or row_dict.get("PNB_NET_15m") or row_dict.get("PNB NET_sum_15m"))
        ),
        "tendance_flux": describe_flux_tendance(current_flux, previous_flux),
    }


def build_shadow_pitch_prompt(client_id: str, product_name: str, context: dict[str, Any]) -> str:
    return f"""
Tu es un Conseiller Bancaire Corporate Senior a la Societe Generale Algerie (SGA).
Tu dois preparer un argumentaire de vente percutant pour proposer le produit "{product_name}" au client {client_id}.
Voici le profil du client :
- Persona : {context["persona"]}
- Secteur : {context["secteur"]}
- PNB Net sur 15 mois : {context["pnb_net"]} DA
- Tendance des flux crediteurs : {context["tendance_flux"]}
- Alerte de depart (Churn) : {context["churn_alert"]} (Si 1, le client est a risque).

Genere une reponse concise, professionnelle et directement utilisable par le commercial, structuree exactement avec ces 3 parties (utilise du Markdown) :
### 1. L'Accroche Personnalisee
(Une phrase d'introduction brise-glace basee sur son secteur et sa sante financiere).
### 2. L'Argumentaire Produit
(Pourquoi {product_name} est vital pour lui en ce moment).
### 3. Anticipation d'Objection
(La raison principale pour laquelle il pourrait dire non, et la phrase exacte pour contrer cette objection).
""".strip()


def build_pitch_fallback(
    client_summary: dict[str, Any],
    insights_payload: dict[str, Any],
    recommendation: dict[str, Any],
) -> str:
    persona = clean_string(insights_payload.get("persona")) or "client"
    sector = clean_string(client_summary.get("sector")) or "son secteur"
    product = clean_string(recommendation.get("product")) or clean_string(recommendation.get("product_signal"))
    confidence_pct = round(safe_float(recommendation.get("confidence_pct")), 1)
    churn_clause = (
        "La baisse récente des flux invite à ouvrir un échange rapide et orienté résultats. "
        if client_summary.get("churn_alert_flag")
        else ""
    )

    return (
        f"Pour ce client au persona {persona}, {product} constitue une opportunité crédible dans le secteur "
        f"{sector}. {churn_clause}Le niveau de confiance atteint {confidence_pct}%, avec un alignement utile "
        "entre le profil du client et les usages observés sur des comptes comparables. L'entretien peut être "
        "positionné autour d'un bénéfice concret, d'un chiffrage simple et d'une mise en oeuvre rapide, afin "
        "de sécuriser l'intérêt du client puis d'ouvrir la prochaine étape commerciale."
    )


def build_shadow_pitch_fallback(
    client_id: str,
    product_name: str,
    context: dict[str, Any],
    client_summary: dict[str, Any],
    insights_payload: dict[str, Any],
    recommendation: dict[str, Any] | None = None,
) -> str:
    confidence_pct = round(safe_float((recommendation or {}).get("confidence_pct")), 1)
    flux_trend = clean_prompt_value(context.get("tendance_flux"), "Flux stables")
    sector = clean_prompt_value(context.get("secteur"), "Secteur non renseigne")
    persona = clean_prompt_value(context.get("persona"), "Standard")
    pnb_net = round(safe_float(context.get("pnb_net")))
    churn_alert = int(safe_float(context.get("churn_alert")))
    fiche_visite = truncate_text(insights_payload.get("fiche_visite"), max_chars=180)
    flux_confie_pct = round(safe_float(client_summary.get("flux_confie_pct")), 1)

    if churn_alert:
        objection = (
            "Le client peut preferer temporiser toute nouvelle proposition tant que la relation n'est pas completement stabilisee."
        )
        rebuttal = (
            "Justement, la proposition peut etre presentee comme un levier simple pour recreer rapidement de la valeur et renforcer l'ancrage de la relation."
        )
    elif flux_confie_pct < 25:
        objection = (
            "Le client peut estimer que son niveau de flux confie a la banque reste encore trop limite pour prioriser ce produit."
        )
        rebuttal = (
            "Ce produit est justement un bon point d'entree pour capter davantage de flux, demontrer un benefice mesurable et installer une relation plus dense."
        )
    else:
        objection = (
            "Le client peut penser qu'il dispose deja d'une solution proche et ne pas voir l'urgence d'ajouter un nouveau produit."
        )
        rebuttal = (
            "La reponse a porter est celle de la complementarite, de la fluidite d'execution et de l'adaptation plus fine au rythme reel de son activite."
        )

    return "\n".join(
        [
            "### 1. L'Accroche Personnalisee",
            (
                f"Monsieur {client_id}, en tant qu'acteur cle dans le secteur {sector}, avec un PNB net de {pnb_net} DA "
                f"et {flux_trend.lower()}, nous avons identifie une opportunite credible pour positionner {product_name} dans un timing pertinent."
            ),
            "",
            "### 2. L'Argumentaire Produit",
            (
                f"{product_name} peut etre presente comme un levier immediat pour renforcer la qualite de service et la valeur relationnelle. "
                f"Le persona {persona} et le niveau de confiance du moteur a {confidence_pct}% soutiennent cette priorite. "
                f"{fiche_visite or 'Le contexte de visite reste compatible avec une approche simple, concrete et orientee resultat.'}"
            ),
            "",
            "### 3. Anticipation d'Objection",
            f"{objection} La phrase conseillee pour y repondre est : \"{rebuttal}\"",
        ]
    )


def stream_text_chunks(text: str, chunk_size: int = 32):
    normalized_text = clean_string(text)
    for index in range(0, len(normalized_text), chunk_size):
        yield normalized_text[index : index + chunk_size]


def extract_ollama_error(response: httpx.Response, base_url: str) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = None

    detail = clean_prompt_value((payload or {}).get("error"), "")
    if not detail:
        detail = clean_prompt_value(response.text, "")

    if not detail:
        detail = f"HTTP {response.status_code}"

    return f"Ollama local ({base_url}) a refuse la requete: {detail}"


def open_ollama_pitch_stream(prompt: str) -> tuple[httpx.Client, Any, httpx.Response]:
    if httpx is None:
        raise HTTPException(
            status_code=503,
            detail="Le module httpx est indisponible sur le serveur. Le pitch local Ollama est desactive.",
        )

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
    }
    last_error = ""

    for base_url in OLLAMA_BASE_URL_CANDIDATES:
        client = httpx.Client(timeout=httpx.Timeout(connect=5.0, read=120.0, write=30.0, pool=30.0))

        try:
            stream_context = client.stream("POST", f"{base_url}/api/generate", json=payload)
            response = stream_context.__enter__()
            response.raise_for_status()
            return client, stream_context, response
        except httpx.HTTPStatusError as exc:
            last_error = extract_ollama_error(exc.response, base_url)
            client.close()
        except httpx.HTTPError as exc:
            last_error = (
                f"Ollama local ({base_url}) est indisponible: {exc.__class__.__name__}. "
                "Verifiez que le service est lance et que le modele mistral est disponible."
            )
            client.close()

    raise HTTPException(status_code=503, detail=last_error or "Ollama local est indisponible.")


def infer_product_weight(row_dict: dict[str, Any], signal: str) -> float:
    has_signal_key = f"has_{signal}"
    has_signal = safe_float(row_dict.get(has_signal_key))

    for suffix in ("_sum_15m", "_max_15m", "_mean_15m", "_last"):
        candidate_key = f"{signal}{suffix}"
        candidate_value = safe_float(row_dict.get(candidate_key))
        if candidate_value > 0:
            return candidate_value

    if has_signal > 0:
        return 1.0

    return 0.0


def simulate_capital(row_dict: dict[str, Any]) -> float:
    revenue = safe_float(row_dict.get("chiffre d'affaire"))
    segment = clean_string(row_dict.get("Segmenattion")).upper()
    ratio = 0.05 if segment == "GE" else 0.035
    minimum_capital = 20_000_000 if segment == "GE" else 5_000_000
    capital = max(minimum_capital, revenue * ratio)
    return round(capital, -3)


def compute_product_distribution(row_dict: dict[str, Any]) -> list[dict[str, Any]]:
    family_weights: dict[str, float] = {}

    for signal, meta in MODEL_MANIFEST.items():
        weight = infer_product_weight(row_dict, signal)
        if weight <= 0:
            continue

        family = clean_string(meta.get("family")) or "Relationship Banking"
        family_weights[family] = family_weights.get(family, 0.0) + weight

    if not family_weights:
        fallback_weights = {
            "Financing/Credit": max(
                safe_float(row_dict.get("Nb_Produits_Credit")),
                safe_float(row_dict.get("total engagement_mean_15m")) / 1_000_000,
            ),
            "Cash Management": max(
                safe_float(row_dict.get("Nb_Produits_Non_Credit")),
                safe_float(row_dict.get("Cash_Transactions_15m")) / 1_000_000,
                safe_float(row_dict.get("Score_Digital_Actif")) + (0.4 if safe_float(row_dict.get("PNB_NET_15m")) > 0 else 0),
            ),
            "Trade Finance": max(
                (safe_float(row_dict.get("Flux Export_sum_15m")) + safe_float(row_dict.get("Flux IMPORT_sum_15m"))) / 1_000_000,
                safe_float(row_dict.get("Is_International")),
            ),
            "Relationship Banking": max(
                safe_float(row_dict.get("Flux_Crediteurs_15m")) / 1_000_000,
                0.25 if safe_float(row_dict.get("PNB_NET_15m")) > 0 else 0,
            ),
        }
        family_weights = {key: value for key, value in fallback_weights.items() if value > 0}

    if not family_weights:
        family_weights = {"Relationship Banking": 1.0}

    total = sum(family_weights.values()) or 1.0
    distribution = []

    for family, weight in sorted(family_weights.items(), key=lambda item: item[1], reverse=True):
        distribution.append(
            {
                "name": family,
                "value": round((weight / total) * 100, 1),
                "raw_value": round(weight, 4),
                "color": PRODUCT_FAMILY_FALLBACK.get(family, "#94A3B8"),
            }
        )

    return distribution


def build_flux_metrics(row_dict: dict[str, Any]) -> dict[str, Any]:
    current_flux = safe_float(row_dict.get("Flux_Crediteurs_Current_3M"))
    previous_flux = safe_float(row_dict.get("Flux_Crediteurs_Previous_3M"))
    change_value = current_flux - previous_flux

    if previous_flux == 0:
        if current_flux == 0:
            change_ratio = 0.0
        else:
            change_ratio = 1.0
    else:
        change_ratio = change_value / previous_flux

    if change_value > 0:
        direction = "up"
    elif change_value < 0:
        direction = "down"
    else:
        direction = "flat"

    return {
        "flux_current_3m": current_flux,
        "flux_previous_3m": previous_flux,
        "flux_change_value": round(change_value, 2),
        "flux_change_ratio": round(change_ratio, 4),
        "flux_direction": direction,
    }


def compute_ratio_percent(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


def build_client_summary(client_id: str, row_dict: dict[str, Any]) -> dict[str, Any]:
    quality_client = safe_float(row_dict.get("Qualité Client"))
    churn_alert = bool(int(safe_float(row_dict.get("Churn_Alert_Flag"))))
    risk_impayes_total = safe_float(row_dict.get("Risk_Impayes_Total"))
    latest_incidents = safe_float(row_dict.get("nbr_imp_total_last"))
    incident_status = "À risque" if quality_client >= 5 or risk_impayes_total > 0 or latest_incidents > 0 else "Sain"
    flux_metrics = build_flux_metrics(row_dict)
    chiffre_affaire = safe_float(row_dict.get("chiffre d'affaire"))
    pnb_net = safe_float(row_dict.get("PNB_NET_15m") or row_dict.get("PNB NET_sum_15m"))
    commissions_sum = safe_float(row_dict.get("Commissions_sum_15m"))
    mi_sum = safe_float(row_dict.get("MI_sum_15m"))
    total_engagement = safe_float(row_dict.get("total engagement_sum_15m"))
    export_flux_15m = safe_float(row_dict.get("Flux Export_sum_15m"))
    import_flux_15m = safe_float(row_dict.get("Flux IMPORT_sum_15m"))
    cash_transactions_15m = safe_float(row_dict.get("Cash_Transactions_15m"))
    months_observed = int(safe_float(row_dict.get("Months_Observed")))
    months_active_flux = int(safe_float(row_dict.get("Months_Active_Flux")))
    months_active_pnb = int(safe_float(row_dict.get("Months_Active_PNB")))
    relation_age_years = round(safe_float(row_dict.get("Ancienneté de la relation")) / 12, 1)
    flux_confie_pct = compute_ratio_percent(flux_metrics["flux_current_3m"], chiffre_affaire)
    pnb_margin_pct = compute_ratio_percent(pnb_net, chiffre_affaire)
    trade_dependency_pct = compute_ratio_percent(export_flux_15m + import_flux_15m, chiffre_affaire)
    commissions_share_pct = compute_ratio_percent(commissions_sum, pnb_net)
    engagement_coverage_pct = compute_ratio_percent(total_engagement, chiffre_affaire)

    return {
        "client_id": client_id,
        "display_name": clean_string(row_dict.get("Groupe")) or f"Client {client_id}",
        "manager": clean_string(row_dict.get("Chargée de la relation")),
        "quality_client": round(quality_client, 1),
        "segment": clean_string(row_dict.get("Segmenattion")),
        "sector": clean_string(row_dict.get("Secteur d'activité")),
        "sector_detail": clean_string(row_dict.get("Secteur d'activité détaillé")),
        "market": clean_string(row_dict.get("Marché")),
        "wilaya": clean_string(row_dict.get("Wilaya")),
        "creation_date": clean_string(row_dict.get("Date de création")),
        "capital_simulated": simulate_capital(row_dict),
        "shareholders_count": int(safe_float(row_dict.get("Nbr Actionnaire"))),
        "employees_count": int(safe_float(row_dict.get("Nbr d'employés"))),
        "relation_age_years": relation_age_years,
        "chiffre_affaire": chiffre_affaire,
        "pnb_net": pnb_net,
        "commissions_sum": commissions_sum,
        "mi_sum": mi_sum,
        "total_engagement": total_engagement,
        "export_flux_15m": export_flux_15m,
        "import_flux_15m": import_flux_15m,
        "cash_transactions_15m": cash_transactions_15m,
        "churn_alert_flag": churn_alert,
        "incident_status": incident_status,
        "risk_impayes_total": risk_impayes_total,
        "digital_score": safe_float(row_dict.get("Score_Digital_Actif")),
        "credit_utilization_rate": safe_float(row_dict.get("Taux_Utilisation_Credit")),
        "months_observed": months_observed,
        "months_active_flux": months_active_flux,
        "months_active_pnb": months_active_pnb,
        "flux_confie_pct": flux_confie_pct,
        "pnb_margin_pct": pnb_margin_pct,
        "trade_dependency_pct": trade_dependency_pct,
        "commissions_share_pct": commissions_share_pct,
        "engagement_coverage_pct": engagement_coverage_pct,
        "is_international": bool(int(safe_float(row_dict.get("Is_International")))),
        "nb_products_held": int(safe_float(row_dict.get("Nb_Produits_Detenus"))),
        "nb_products_credit": int(safe_float(row_dict.get("Nb_Produits_Credit"))),
        "nb_products_non_credit": int(safe_float(row_dict.get("Nb_Produits_Non_Credit"))),
        "persona": clean_string(row_dict.get("Persona_Name")) or "Standard",
        "product_distribution": compute_product_distribution(row_dict),
        **flux_metrics,
    }


def build_argumentaire(recommendation: dict[str, Any], persona: str, sector: str) -> str:
    product = clean_string(recommendation.get("product")) or clean_string(recommendation.get("product_signal"))
    family = clean_string(recommendation.get("family")) or "Relationship Banking"
    sector_score = safe_float(recommendation.get("sector_score"))
    content_score = safe_float(recommendation.get("content_score"))
    has_model = bool(recommendation.get("has_model"))

    if sector_score >= content_score and sector_score > 0:
        lead = (
            f"Le secteur {sector or 'du client'} montre une adoption significative de {product}, "
            "ce qui renforce l'opportunité commerciale."
        )
    elif content_score > 0:
        lead = (
            f"Le persona {persona or 'client'} présente une forte similarité avec les comptes déjà équipés "
            f"en {product}."
        )
    else:
        lead = f"{product} améliore la couverture de la famille {family.lower()} pour ce client."

    tail = (
        "Le score modèle confirme une traction exploitable à court terme."
        if has_model
        else "Le signal est principalement comportemental et sectoriel, à confirmer en entretien."
    )

    return f"{lead} {tail}"


def build_default_insights(client_id: str, row_dict: dict[str, Any]) -> dict[str, Any]:
    missing_products = [
        clean_string(row_dict.get("Produit_Manquant_Secteur_1")),
        clean_string(row_dict.get("Produit_Manquant_Secteur_2")),
        clean_string(row_dict.get("Produit_Manquant_Secteur_3")),
    ]
    filtered_products = [product for product in missing_products if product]

    recommendations = []
    for product in filtered_products:
        signal = resolve_product_signal(product)
        family = clean_string(MODEL_MANIFEST.get(signal, {}).get("family")) or "Relationship Banking"
        recommendations.append(
            {
                "product_signal": signal,
                "product": PRODUCT_SIGNAL_TO_LABEL.get(signal, product),
                "family": family,
                "score": 0.05,
                "model_score": 0.0,
                "content_score": 0.05,
                "sector_score": 0.05,
                "has_model": int(signal in MODEL_MANIFEST),
            }
        )

    return {
        "persona": clean_string(row_dict.get("Persona_Name")) or "Standard",
        "sector": clean_string(row_dict.get("Secteur d'activité")),
        "wilaya": clean_string(row_dict.get("Wilaya")),
        "top_missing_profile_products": filtered_products,
        "recommendations": recommendations,
        "fiche_visite": f"FICHE DE VISITE - Client {client_id}\nAucune fiche visite enrichie n'est disponible dans le JSON.",
    }


def build_insights_payload(client_id: str, row_dict: dict[str, Any]) -> dict[str, Any]:
    raw_insights = INSIGHTS_DATA.get(client_id) or build_default_insights(client_id, row_dict)
    persona = clean_string(raw_insights.get("persona")) or clean_string(row_dict.get("Persona_Name")) or "GLOBAL"
    sector = clean_string(raw_insights.get("sector")) or clean_string(row_dict.get("Secteur d'activité"))
    recommendations = []

    for recommendation in raw_insights.get("recommendations", []):
        signal = resolve_product_signal(recommendation.get("product_signal") or recommendation.get("product"))
        label = clean_string(recommendation.get("product")) or PRODUCT_SIGNAL_TO_LABEL.get(signal, signal)
        family = clean_string(recommendation.get("family")) or clean_string(
            MODEL_MANIFEST.get(signal, {}).get("family")
        ) or "Relationship Banking"

        enriched_recommendation = {
            "product_signal": signal,
            "product": label,
            "family": family,
            "score": round(safe_float(recommendation.get("score")), 4),
            "confidence_pct": round(safe_float(recommendation.get("score")) * 100, 1),
            "model_score": round(safe_float(recommendation.get("model_score")), 4),
            "content_score": round(safe_float(recommendation.get("content_score")), 4),
            "sector_score": round(safe_float(recommendation.get("sector_score")), 4),
            "has_model": int(bool(recommendation.get("has_model"))),
            "argumentaire": build_argumentaire(recommendation, persona=persona, sector=sector),
            "rl_state": BANDIT.arm_state(signal, context=persona),
        }
        recommendations.append(enriched_recommendation)

    recommendations.sort(key=lambda item: item["score"], reverse=True)

    return {
        "client_id": client_id,
        "persona": persona,
        "sector": sector,
        "wilaya": clean_string(raw_insights.get("wilaya")) or clean_string(row_dict.get("Wilaya")),
        "top_missing_profile_products": raw_insights.get("top_missing_profile_products", []),
        "recommendations": recommendations,
        "fiche_visite": clean_string(raw_insights.get("fiche_visite")),
    }


def append_feedback_log(feedback_row: dict[str, Any]) -> None:
    write_header = not FEEDBACK_LOG_PATH.exists()

    with FEEDBACK_LOG_PATH.open("a", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(feedback_row.keys()))
        if write_header:
            writer.writeheader()
        writer.writerow(feedback_row)


replay_feedback_logs()

app = FastAPI(
    title="SGA Sales Intelligence API",
    description="API FastAPI pour le cockpit conseiller B2B de Société Générale Algérie.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "clients": int(DATAFRAME.shape[0]),
        "insights": int(len(INSIGHTS_DATA)),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/clients")
def list_clients(
    query: str | None = Query(default=None, description="Filtre par ID client"),
    limit: int = Query(default=250, ge=1, le=5000),
) -> dict[str, Any]:
    client_ids = DATAFRAME["Client"].astype(str).sort_values().tolist()
    normalized_query = clean_string(query).lower()

    if normalized_query:
        client_ids = [client_id for client_id in client_ids if normalized_query in client_id.lower()]

    return {"clients": client_ids[:limit], "total": len(client_ids)}


@app.get("/api/managers")
def list_managers() -> dict[str, Any]:
    return {
        "managers": MANAGER_NAMES,
        "total": len(MANAGER_NAMES),
    }


@app.get("/api/manager/clients")
def list_manager_clients(
    manager_email: str | None = Query(default=None, description="Email du gestionnaire connecté"),
    manager_name: str | None = Query(default=None, description="Nom canonique du gestionnaire"),
    query: str | None = Query(default=None, description="Recherche sur client, groupe ou secteur"),
    churn_status: str = Query(default="all", description="all, critical, stable"),
    segment: str = Query(default="all", description="Filtre segment PME/GE"),
    sort_by: str = Query(default="churn", description="Tri: churn, revenue, quality"),
    limit: int = Query(default=250, ge=1, le=5000),
) -> dict[str, Any]:
    resolved_manager, resolution_source = resolve_manager_name(
        manager_email=manager_email,
        manager_name=manager_name,
    )
    filtered_clients = filter_manager_clients_dataframe(
        manager_name=resolved_manager,
        query=query,
        churn_status=churn_status,
        segment=segment,
    )
    sorted_clients = sort_manager_clients_dataframe(filtered_clients, sort_by=sort_by)
    limited_clients = sorted_clients.head(limit)

    clients_payload = []
    for _, client_row in limited_clients.iterrows():
        client_id = clean_string(client_row.get("Client"))
        row_dict = {column: to_native(value) for column, value in client_row.to_dict().items()}
        clients_payload.append(build_manager_client_row(client_id, row_dict))

    return {
        "manager": resolved_manager,
        "manager_email": manager_email,
        "manager_resolution": resolution_source,
        "total": int(filtered_clients.shape[0]),
        "clients": clients_payload,
        "summary": build_manager_portfolio_summary(filtered_clients),
        "filters": {
            "query": clean_string(query),
            "churn_status": churn_status,
            "segment": segment,
            "sort_by": sort_by,
        },
    }


@app.get("/api/clients/{client_id}")
def get_client(
    client_id: str,
    manager_email: str | None = Query(default=None, description="Email du gestionnaire connecte"),
    manager_name: str | None = Query(default=None, description="Nom canonique du gestionnaire"),
) -> dict[str, Any]:
    client_row = get_client_row(client_id)
    verify_client_manager_access(
        client_row,
        manager_email=manager_email,
        manager_name=manager_name,
    )
    row_dict = {column: to_native(value) for column, value in client_row.to_dict().items()}
    summary = build_client_summary(client_id, row_dict)

    return {
        "client_id": client_id,
        "summary": summary,
        "features": row_dict,
    }


@app.get("/api/insights/{client_id}")
def get_insights(
    client_id: str,
    manager_email: str | None = Query(default=None, description="Email du gestionnaire connecte"),
    manager_name: str | None = Query(default=None, description="Nom canonique du gestionnaire"),
) -> dict[str, Any]:
    client_row = get_client_row(client_id)
    verify_client_manager_access(
        client_row,
        manager_email=manager_email,
        manager_name=manager_name,
    )
    row_dict = {column: to_native(value) for column, value in client_row.to_dict().items()}
    return build_insights_payload(client_id, row_dict)


@app.post("/api/generate-pitch")
def generate_client_pitch(payload: PitchPayload) -> StreamingResponse:
    client_row = get_client_row(payload.client_id)
    verify_client_manager_access(
        client_row,
        manager_email=payload.manager_email,
        manager_name=payload.manager_name,
    )
    row_dict = {column: to_native(value) for column, value in client_row.to_dict().items()}
    client_summary = build_client_summary(payload.client_id, row_dict)
    insights_payload = build_insights_payload(payload.client_id, row_dict)
    requested_product = resolve_pitch_product_value(payload)
    resolved_product_signal = resolve_product_signal(requested_product)
    recommendation = next(
        (
            item
            for item in insights_payload.get("recommendations", [])
            if item.get("product_signal") == resolved_product_signal
            or clean_string(item.get("product")).lower() == requested_product.lower()
        ),
        None,
    )

    product_label = clean_prompt_value(
        (recommendation or {}).get("product") or requested_product,
        requested_product,
    )
    prompt_context = build_shadow_pitch_context(payload.client_id, row_dict)
    prompt = build_shadow_pitch_prompt(payload.client_id, product_label, prompt_context)

    try:
        client, stream_context, response = open_ollama_pitch_stream(prompt)
    except HTTPException:
        fallback_text = build_shadow_pitch_fallback(
            client_id=payload.client_id,
            product_name=product_label,
            context=prompt_context,
            client_summary=client_summary,
            insights_payload=insights_payload,
            recommendation=recommendation,
        )
        return StreamingResponse(
            stream_text_chunks(fallback_text),
            media_type="text/plain; charset=utf-8",
            headers={
                "Cache-Control": "no-cache",
                "X-LLM-Model": "fallback-rules",
            },
        )

    def stream_tokens():
        try:
            for raw_line in response.iter_lines():
                if not raw_line:
                    continue
                try:
                    parsed_line = json.loads(raw_line)
                except json.JSONDecodeError:
                    continue

                if parsed_line.get("error"):
                    raise RuntimeError(clean_prompt_value(parsed_line.get("error"), "Erreur Ollama"))

                chunk = parsed_line.get("response")
                if chunk:
                    yield chunk

                if parsed_line.get("done"):
                    break
        finally:
            stream_context.__exit__(None, None, None)
            client.close()

    return StreamingResponse(
        stream_tokens(),
        media_type="text/plain; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "X-LLM-Model": OLLAMA_MODEL,
        },
    )


@app.post("/api/feedback")
def update_feedback(payload: FeedbackPayload) -> dict[str, Any]:
    client_row = get_client_row(payload.client_id)
    row_dict = {column: to_native(value) for column, value in client_row.to_dict().items()}
    persona = clean_string(row_dict.get("Persona_Name")) or "GLOBAL"
    product_signal = resolve_product_signal(payload.product_id)
    product_label = PRODUCT_SIGNAL_TO_LABEL.get(product_signal, product_signal)

    reward_info = compute_reward(payload.accepted, payload.comment)

    feedback_row = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "client_id": payload.client_id,
        "persona": persona,
        "product_id": product_signal,
        "product_label": product_label,
        "accepted": payload.accepted,
        "comment": payload.comment,
        "sentiment": reward_info["sentiment"],
        "sentiment_multiplier": reward_info["sentiment_multiplier"],
        "positive_hits": reward_info["positive_hits"],
        "negative_hits": reward_info["negative_hits"],
        "reward": reward_info["reward"],
    }

    with FEEDBACK_LOCK:
        BANDIT.update(product_signal, reward_info["reward"], context=persona)
        append_feedback_log(feedback_row)
        save_bandit_snapshot()

    bandit_state = BANDIT.arm_state(product_signal, context=persona)

    return {
        "status": "success",
        "message": "Modèle mis à jour",
        "notification": f"Modèle RL mis à jour pour {product_label} sur le persona {persona}.",
        "client_id": payload.client_id,
        "persona": persona,
        "product_id": product_signal,
        "product_label": product_label,
        "sentiment": reward_info["sentiment"],
        "sentiment_multiplier": reward_info["sentiment_multiplier"],
        "positive_hits": reward_info["positive_hits"],
        "negative_hits": reward_info["negative_hits"],
        "reward": reward_info["reward"],
        "bandit_state": bandit_state,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
