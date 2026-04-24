import jsPDF from "jspdf";

import brandLogo from "../../assets/synerg-logo.svg";

const COLORS = {
  black: "#111827",
  danger: "#BE123C",
  dangerBg: "#FFF1F2",
  light: "#F8FAFC",
  muted: "#6B7280",
  red: "#E60028",
  soft: "#F4F7FE",
  success: "#047857",
  successBg: "#ECFDF5",
  text: "#111827",
  warn: "#B45309",
  warnBg: "#FFFBEB",
  white: "#FFFFFF",
};

const CURRENCY_FORMATTER = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function sanitizeText(value) {
  return String(value ?? "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function sanitizeWilaya(value) {
  const cleaned = sanitizeText(value).replace(/[_-]+/g, " ");
  const withoutCodes = cleaned.replace(/\d+/g, " ").replace(/\s+/g, " ").trim();

  if (!withoutCodes) {
    return "N/A";
  }

  const normalizedKey = withoutCodes.toUpperCase();
  const lookup = {
    ALGER: "Alger",
    ANNABA: "Annaba",
    BATNA: "Batna",
    BEJAIA: "Bejaia",
    BLIDA: "Blida",
    BOUIRA: "Bouira",
    CHLEF: "Chlef",
    CONSTANTINE: "Constantine",
    DJELFA: "Djelfa",
    JIJEL: "Jijel",
    ORAN: "Oran",
    SETIF: "Setif",
    "SIDI BEL ABBES": "Sidi Bel Abbes",
    SKIKDA: "Skikda",
    TIARET: "Tiaret",
    "TIZI OUZOU": "Tizi Ouzou",
    TLEMCEN: "Tlemcen",
    TIPAZA: "Tipaza",
  };

  const exactMatch = lookup[normalizedKey];
  if (exactMatch) {
    return exactMatch;
  }

  const firstWordMatch = lookup[normalizedKey.split(" ")[0]];
  if (firstWordMatch) {
    return firstWordMatch;
  }

  return toTitleCase(withoutCodes);
}

function safeText(value, fallback = "N/A") {
  const cleaned = sanitizeText(value);
  return cleaned || fallback;
}

function formatCurrencyDa(value) {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) {
    return "0 DA";
  }

  return `${CURRENCY_FORMATTER.format(numericValue)} DA`;
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return safeText(value);
  }

  return parsed.toLocaleDateString("fr-FR");
}

function formatPercent(value, digits = 1) {
  const numericValue = Number(value ?? 0);
  return `${(Number.isFinite(numericValue) ? numericValue : 0).toFixed(digits)}%`;
}

function formatInteger(value) {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue)
    ? CURRENCY_FORMATTER.format(Math.trunc(numericValue))
    : "0";
}

function getQualityStatus(score) {
  const numericScore = Number(score ?? 0);

  if (numericScore <= 4) {
    return {
      label: "Qualite client",
      value: numericScore ? numericScore.toFixed(1) : "0.0",
      fill: COLORS.successBg,
      text: COLORS.success,
    };
  }

  if (numericScore <= 6) {
    return {
      label: "Qualite client",
      value: numericScore.toFixed(1),
      fill: COLORS.warnBg,
      text: COLORS.warn,
    };
  }

  return {
    label: "Qualite client",
    value: numericScore.toFixed(1),
    fill: COLORS.dangerBg,
    text: COLORS.danger,
  };
}

function getChurnStatus(summary) {
  return summary?.churn_alert_flag
    ? {
        label: "Churn",
        value: "Alerte critique",
        fill: COLORS.dangerBg,
        text: COLORS.danger,
      }
    : {
        label: "Churn",
        value: "Situation stable",
        fill: COLORS.successBg,
        text: COLORS.success,
      };
}

function getIncidentStatus(summary) {
  const normalized = safeText(summary?.incident_status, "").toLowerCase();
  const isRisky = normalized.includes("risque");

  return isRisky
    ? {
        label: "Incidents",
        value: "A risque",
        fill: COLORS.dangerBg,
        text: COLORS.danger,
      }
    : {
        label: "Incidents",
        value: "Sain",
        fill: COLORS.successBg,
        text: COLORS.success,
      };
}

function getFluxTrend(summary) {
  const changeRatio = Number(summary?.flux_change_ratio ?? 0) * 100;

  if (changeRatio > 0) {
    return `Hausse ${formatPercent(changeRatio)}`;
  }

  if (changeRatio < 0) {
    return `Baisse ${formatPercent(Math.abs(changeRatio))}`;
  }

  return "Flux stables";
}

function getProductMix(summary) {
  const distribution = Array.isArray(summary?.product_distribution)
    ? summary.product_distribution
    : [];

  if (!distribution.length) {
    return "N/A";
  }

  return distribution
    .slice(0, 3)
    .map((item) => `${safeText(item.name, "Produit")} ${formatPercent(item.value)}`)
    .join(", ");
}

function buildPdfPayload(client, insights) {
  const summary = client?.summary;

  if (!summary) {
    throw new Error("La fiche client ne contient pas de donnees exportables.");
  }

  const clientId = safeText(summary.client_id, "client");
  const displayName = safeText(summary.display_name, `Client ${clientId}`);
  const recommendations = Array.isArray(insights?.recommendations)
    ? insights.recommendations.slice(0, 3).map((item, index) => ({
        argumentaire: safeText(
          item?.argumentaire,
          "Aucun argumentaire disponible pour cette recommandation.",
        ),
        confidence: formatPercent(item?.confidence_pct),
        family: safeText(item?.family),
        product: safeText(item?.product, `Recommendation ${index + 1}`),
      }))
    : [];

  return {
    clientId,
    companyCards: [
      ["Gestionnaire", safeText(summary.manager)],
      ["Segment", safeText(summary.segment)],
      ["Persona", safeText(insights?.persona || summary.persona)],
      ["Secteur", safeText(summary.sector_detail || summary.sector)],
      ["Wilaya", sanitizeWilaya(summary.wilaya)],
      ["Creation", formatDate(summary.creation_date)],
      ["Capital", formatCurrencyDa(summary.capital_simulated)],
      ["Actionnaires", formatInteger(summary.shareholders_count)],
    ],
    displayName,
    exportDate: new Date().toLocaleDateString("fr-FR"),
    financeCards: [
      ["Chiffre d'affaire", formatCurrencyDa(summary.chiffre_affaire)],
      ["PNB net", formatCurrencyDa(summary.pnb_net)],
      ["Flux 3M actuel", formatCurrencyDa(summary.flux_current_3m)],
      ["Flux 3M precedent", formatCurrencyDa(summary.flux_previous_3m)],
      ["Tendance flux", getFluxTrend(summary)],
      ["Mix produits", getProductMix(summary)],
    ],
    recommendations,
    statusCards: [
      getQualityStatus(summary.quality_client),
      getChurnStatus(summary),
      getIncidentStatus(summary),
    ],
  };
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function loadLogoCanvas() {
  try {
    const image = await loadImage(brandLogo);
    const width = image.naturalWidth || image.width || 1280;
    const height = image.naturalHeight || image.height || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return {
      aspectRatio: width / height,
      canvas,
    };
  } catch {
    return null;
  }
}

function ensureSpace(doc, cursorY, blockHeight, marginY) {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (cursorY + blockHeight <= pageHeight - marginY) {
    return cursorY;
  }

  doc.addPage();
  return marginY;
}

function drawSectionHeader(doc, title, cursorY, marginX, contentWidth) {
  doc.setDrawColor(COLORS.red);
  doc.setLineWidth(0.6);
  doc.line(marginX, cursorY, marginX + contentWidth, cursorY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(COLORS.text);
  doc.text(title, marginX, cursorY + 8);

  return cursorY + 13;
}

function getCardHeight(doc, value, width, fontSize = 12, minHeight = 24) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(safeText(value), width - 10);
  return Math.max(minHeight, 14 + lines.length * 5 + 5);
}

function drawDataCard(doc, { x, y, width, height, label, value }) {
  doc.setFillColor(COLORS.soft);
  doc.roundedRect(x, y, width, height, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.muted);
  doc.text(label, x + 5, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(COLORS.text);
  const lines = doc.splitTextToSize(safeText(value), width - 10);
  doc.text(lines, x + 5, y + 14);
}

function drawStatusCard(doc, { x, y, width, status }) {
  doc.setFillColor(status.fill);
  doc.roundedRect(x, y, width, 17, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(status.text);
  doc.text(status.label, x + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(status.value, x + 4, y + 12);
}

function drawHeroCard(doc, { x, y, width, payload }) {
  const heroHeight = 28;

  doc.setFillColor(COLORS.light);
  doc.roundedRect(x, y, width, heroHeight, 5, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(COLORS.text);
  const nameLines = doc.splitTextToSize(payload.displayName, width - 10);
  doc.text(nameLines, x + 5, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(COLORS.muted);
  doc.text(`Client ID ${payload.clientId}`, x + 5, y + 19);
  doc.text(`Export du ${payload.exportDate}`, x + 5, y + 24);

  return heroHeight;
}

function writeFooter(doc, clientId) {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(COLORS.red);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted);
    doc.text(`SynerG | Client ${clientId} | Page ${page}/${pageCount}`, 14, pageHeight - 5);
  }
}

function drawRecommendationCard(doc, recommendation, index, cursorY, marginX, contentWidth, marginY) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const innerWidth = contentWidth - 12;
  const lineHeight = 4.6;
  const textLines = doc.splitTextToSize(recommendation.argumentaire, innerWidth);
  let lineIndex = 0;
  let isFirstChunk = true;
  let nextY = cursorY;

  while (lineIndex < textLines.length || isFirstChunk) {
    const headerHeight = isFirstChunk ? 22 : 12;
    nextY = ensureSpace(doc, nextY, headerHeight + lineHeight * 3 + 8, marginY);

    const availableHeight = pageHeight - marginY - nextY - headerHeight - 8;
    const maxLines = Math.max(1, Math.floor(availableHeight / lineHeight));
    const linesForPage = textLines.slice(lineIndex, lineIndex + maxLines);
    const bodyHeight = Math.max(8, linesForPage.length * lineHeight);
    const cardHeight = headerHeight + bodyHeight + 8;

    doc.setFillColor(COLORS.white);
    doc.roundedRect(marginX, nextY, contentWidth, cardHeight, 4, 4, "F");
    doc.setDrawColor(COLORS.red);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, nextY, contentWidth, cardHeight, 4, 4, "S");

    if (isFirstChunk) {
      doc.setFillColor(COLORS.dangerBg);
      doc.roundedRect(marginX + 4, nextY + 4, 20, 8, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(COLORS.red);
      doc.text(`TOP ${index + 1}`, marginX + 14, nextY + 9.4, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(COLORS.text);
      doc.text(recommendation.product, marginX + 28, nextY + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(COLORS.muted);
      doc.text(
        `${recommendation.family} | Confiance ${recommendation.confidence}`,
        marginX + 28,
        nextY + 16,
      );
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.text);
      doc.text(`Suite argumentaire - ${recommendation.product}`, marginX + 6, nextY + 8);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(COLORS.text);
    doc.text(linesForPage, marginX + 6, nextY + headerHeight, {
      baseline: "top",
    });

    lineIndex += linesForPage.length;
    nextY += cardHeight + 6;
    isFirstChunk = false;
  }

  return nextY;
}

export async function exportClientPdf({ client, insights }) {
  const payload = buildPdfPayload(client, insights);
  const doc = new jsPDF({
    format: "a4",
    orientation: "portrait",
    unit: "mm",
  });

  const marginX = 14;
  const marginY = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  const gutter = 6;
  const columnWidth = (contentWidth - gutter) / 2;

  const logoAsset = await loadLogoCanvas();
  let cursorY = marginY;

  if (logoAsset) {
    const maxLogoWidth = 40;
    const logoWidth = Math.min(maxLogoWidth, contentWidth * 0.34);
    const logoHeight = logoWidth / logoAsset.aspectRatio;
    const logoX = pageWidth - marginX - logoWidth;

    doc.addImage(logoAsset.canvas, "PNG", logoX, cursorY, logoWidth, logoHeight);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(COLORS.text);
  doc.text("SynerG", marginX, cursorY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(COLORS.muted);
  doc.text("Fiche client 360", marginX, cursorY + 15);
  doc.text(`Export du ${payload.exportDate}`, marginX, cursorY + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.black);
  doc.text(`Identifiant client: ${payload.clientId}`, marginX, cursorY + 28);

  cursorY += 38;
  cursorY = drawSectionHeader(doc, "Profil client", cursorY, marginX, contentWidth);

  const heroHeight = drawHeroCard(doc, {
    payload,
    width: contentWidth,
    x: marginX,
    y: cursorY,
  });
  cursorY += heroHeight + 6;

  payload.statusCards.forEach((status, index) => {
    const width = (contentWidth - gutter * 2) / 3;
    drawStatusCard(doc, {
      status,
      width,
      x: marginX + index * (width + gutter),
      y: cursorY,
    });
  });
  cursorY += 23;

  for (let index = 0; index < payload.companyCards.length; index += 2) {
    const leftCard = payload.companyCards[index];
    const rightCard = payload.companyCards[index + 1];
    const leftHeight = getCardHeight(doc, leftCard[1], columnWidth);
    const rightHeight = rightCard ? getCardHeight(doc, rightCard[1], columnWidth) : leftHeight;
    const rowHeight = Math.max(leftHeight, rightHeight);

    cursorY = ensureSpace(doc, cursorY, rowHeight, marginY);

    drawDataCard(doc, {
      height: rowHeight,
      label: leftCard[0],
      value: leftCard[1],
      width: columnWidth,
      x: marginX,
      y: cursorY,
    });

    if (rightCard) {
      drawDataCard(doc, {
        height: rowHeight,
        label: rightCard[0],
        value: rightCard[1],
        width: columnWidth,
        x: marginX + columnWidth + gutter,
        y: cursorY,
      });
    }

    cursorY += rowHeight + gutter;
  }

  cursorY = ensureSpace(doc, cursorY, 24, marginY);
  cursorY = drawSectionHeader(doc, "Synthese financiere", cursorY, marginX, contentWidth);

  for (let index = 0; index < payload.financeCards.length; index += 2) {
    const leftCard = payload.financeCards[index];
    const rightCard = payload.financeCards[index + 1];
    const leftHeight = getCardHeight(doc, leftCard[1], columnWidth);
    const rightHeight = rightCard ? getCardHeight(doc, rightCard[1], columnWidth) : leftHeight;
    const rowHeight = Math.max(leftHeight, rightHeight);

    cursorY = ensureSpace(doc, cursorY, rowHeight, marginY);

    drawDataCard(doc, {
      height: rowHeight,
      label: leftCard[0],
      value: leftCard[1],
      width: columnWidth,
      x: marginX,
      y: cursorY,
    });

    if (rightCard) {
      drawDataCard(doc, {
        height: rowHeight,
        label: rightCard[0],
        value: rightCard[1],
        width: columnWidth,
        x: marginX + columnWidth + gutter,
        y: cursorY,
      });
    }

    cursorY += rowHeight + gutter;
  }

  cursorY = ensureSpace(doc, cursorY, 28, marginY);
  cursorY = drawSectionHeader(doc, "Top recommandations IA", cursorY, marginX, contentWidth);

  if (!payload.recommendations.length) {
    drawDataCard(doc, {
      height: 24,
      label: "Recommandations",
      value: "Aucune recommandation disponible pour ce client.",
      width: contentWidth,
      x: marginX,
      y: cursorY,
    });
    cursorY += 30;
  } else {
    payload.recommendations.forEach((recommendation, index) => {
      cursorY = drawRecommendationCard(doc, recommendation, index, cursorY, marginX, contentWidth, marginY);
    });
  }

  writeFooter(doc, payload.clientId);

  doc.setProperties({
    subject: "Fiche client SynerG",
    title: `SynerG - ${payload.clientId}`,
  });

  const fileName = `SynerG_Fiche_Client_${payload.clientId}.pdf`;
  doc.save(fileName);

  return fileName;
}
