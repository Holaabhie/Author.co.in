// SizeChart — reusable, accessible, mobile-responsive size table component
// Used in: product detail page accordion (Measurements & Size Guide)
// Architecture: no external deps, matches existing product page table styling

interface SizeRow {
  size: string;
  chest: string;
  length: string;
  shoulder: string;
}

interface SizeChartProps {
  sizeChart: SizeRow[];
  modelInfo?: string;
  fitNote?: string;
}

export default function SizeChart({ sizeChart, modelInfo, fitNote }: SizeChartProps) {
  return (
    <div className="space-y-4 font-sans text-xs text-neutral-600">
      {/* Model info */}
      {modelInfo && (
        <p className="font-semibold text-black">{modelInfo}</p>
      )}

      {/* Fit note */}
      <p>{fitNote || "Check your measurements below:"}</p>

      {/* Responsive table — horizontal scroll on mobile */}
      <div
        className="overflow-x-auto border border-neutral-100 rounded-sm mt-3"
        role="region"
        aria-label="Size chart"
      >
        <table
          className="w-full text-left border-collapse min-w-[280px]"
          role="table"
          aria-label="Product size measurements"
        >
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] uppercase font-bold text-black">
              <th className="p-2.5" scope="col">Size</th>
              <th className="p-2.5" scope="col">Chest / Waist</th>
              <th className="p-2.5" scope="col">Length</th>
              <th className="p-2.5" scope="col">Shoulder / Outseam</th>
            </tr>
          </thead>
          <tbody>
            {sizeChart.map((row, i) => (
              <tr
                key={row.size}
                className={`border-b border-neutral-50 text-[11px] ${
                  i % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                }`}
              >
                <td className="p-2.5 font-bold text-black" scope="row">{row.size}</td>
                <td className="p-2.5">{row.chest}</td>
                <td className="p-2.5">{row.length}</td>
                <td className="p-2.5">{row.shoulder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Measurements note */}
      <p className="text-[10px] text-neutral-400 italic">
        All measurements are in inches. Slight variations may occur due to manual measurement.
      </p>
    </div>
  );
}
