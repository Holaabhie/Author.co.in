"use client";

import { getSizeChart } from "@/lib/sizeCharts";

interface SizeChartProps {
  categorySlug: string;
}

/**
 * Displays the size chart for a given product category.
 * Renders nothing if no chart matches the category.
 * Designed with AUTHOR luxury minimal aesthetic: white/black, thin borders, proper spacing.
 */
export default function SizeChart({ categorySlug }: SizeChartProps) {
  const chart = getSizeChart(categorySlug);
  if (!chart) return null;

  return (
    <div className="mb-8">
      {/* Heading */}
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-black mb-4">
        {chart.title}
      </h3>

      {/* Table wrapper — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[340px] text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-300">
              {chart.columns.map((col, i) => (
                <th
                  key={i}
                  className={`py-3 px-3 text-[10px] uppercase tracking-[0.15em] font-bold text-black ${
                    i === 0 ? "text-left" : "text-center"
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-neutral-100 last:border-b-0"
              >
                <td className="py-3 px-3 text-xs font-bold text-black text-left">
                  {row.size}
                </td>
                {row.values.map((val, vi) => (
                  <td
                    key={vi}
                    className="py-3 px-3 text-xs text-neutral-600 text-center"
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <p className="text-[9px] text-neutral-400 mt-3 tracking-wide leading-relaxed">
        {chart.note}
      </p>
    </div>
  );
}
