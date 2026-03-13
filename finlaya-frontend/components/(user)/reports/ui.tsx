// Small reusable UI pieces shared across report section components
import { motion } from 'framer-motion';

export function PreviewCard({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        </div>
        {count !== undefined && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {count} {count === 1 ? 'record' : 'records'}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export function SimpleTable({
  headers,
  rows,
  more,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  more: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            {headers.map((h) => (
              <th key={h} className="text-left pb-2 text-gray-400 font-semibold pr-3 last:pr-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-3 last:pr-0 text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {more > 0 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          + {more} more in the downloaded PDF
        </p>
      )}
    </div>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return <p className="text-xs text-gray-400 text-center py-3">{text}</p>;
}

export const fmtNRs = (n: number) =>
  `NRs ${Math.round(n).toLocaleString('en-IN')}`;