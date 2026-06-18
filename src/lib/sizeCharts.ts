/**
 * Size Chart Configuration for AUTHOR products.
 *
 * Each chart maps to a product category and contains
 * column headers + row data with measurements.
 *
 * All measurements are in INCHES unless noted otherwise.
 *
 * To update measurements, edit the `rows` arrays below.
 */

export interface SizeChartRow {
  size: string;
  values: (string | number)[];
}

export interface SizeChartData {
  title: string;
  columns: string[];
  rows: SizeChartRow[];
  note: string;
}

// ── Category slug normalization ──────────────────────────────────────
// Maps various slug formats to a canonical key used for chart lookup.
const CATEGORY_SLUG_MAP: Record<string, string> = {
  tshirt: "tshirt",
  tshirts: "tshirt",
  "t-shirt": "tshirt",
  "t-shirts": "tshirt",
  top: "top",
  tops: "top",
  sweatpants: "sweatpants",
  sweatpant: "sweatpants",
  pant: "sweatpants",
  pants: "sweatpants",
};

function normalizeCategoryForChart(slug: string): string | null {
  const key = slug.toLowerCase().trim();
  return CATEGORY_SLUG_MAP[key] ?? null;
}

// ── SIZE CHART DATA ──────────────────────────────────────────────────

const SIZE_CHARTS: Record<string, SizeChartData> = {
  // ── T-Shirt Size Chart ──
  // TODO: Update measurements as needed
  tshirt: {
    title: "T-SHIRT SIZE CHART",
    columns: ["Size", "Chest (in)", "Length (in)", "Shoulder Length (in)"],
    rows: [
      { size: "S", values: ["42", "24.5", "18"] },
      { size: "M", values: ["44", "25.5", "18.5"] },
      { size: "L", values: ["46", "26.5", "19"] },
    ],
    note: "Measurements are approximate and may vary slightly. All sizes are in inches.",
  },

  // ── Top Size Chart ──
  // TODO: Update measurements as needed
  top: {
    title: "TOP SIZE CHART",
    columns: [
      "Size",
      "Chest / Bust (in)",
      "Garment Length (in)",
      "Sleeve Length (in)",
    ],
    rows: [
      { size: "XS", values: ["26 – 28.5", "16.5", "6.1"] },
      { size: "S", values: ["30 – 32.5", "17.5", "6.4"] },
      { size: "M", values: ["34 – 36.5", "18.5", "6.7"] },
      { size: "L", values: ["36 – 38.5", "19.5", "7.0"] },
    ],
    note: "Measurements are approximate and may vary slightly. All sizes are in inches.",
  },

  // ── Sweatpants Size Chart ──
  // TODO: Update measurements as needed
  sweatpants: {
    title: "SWEATPANTS SIZE CHART",
    columns: ["Size", "Length (in)", "Hip (in)", "Inseam Length (in)"],
    rows: [
      { size: "28-30", values: ["41", "51", "29"] },
      { size: "30-32", values: ["42", "53", "29"] },
      { size: "32-34", values: ["42.5", "55", "29"] },
      { size: "34-36", values: ["43", "57", "29"] },
    ],
    note: "Measurements are approximate and may vary slightly. All sizes are in inches.",
  },
};

/**
 * Get the size chart data for a given category slug.
 * Returns null if no chart matches the category.
 */
export function getSizeChart(categorySlug: string): SizeChartData | null {
  const normalized = normalizeCategoryForChart(categorySlug);
  if (!normalized) return null;
  return SIZE_CHARTS[normalized] ?? null;
}
