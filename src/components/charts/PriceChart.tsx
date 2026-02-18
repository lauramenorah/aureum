'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PriceChartProps {
  data: { date: string; price: number }[];
  color?: string;
  height?: number;
}

function CustomTooltip({ active, payload, label, color }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1B1E36] px-4 py-3 shadow-xl">
      <p className="mb-1 text-xs text-[#8892B0]">{label}</p>
      <p className="font-mono text-sm font-semibold" style={{ color: color || '#7B5EA7' }}>
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function PriceChart({ data, color = '#7B5EA7', height = 300 }: PriceChartProps) {
  const gradientId = `priceGradient-${color.replace('#', '')}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#4A5568', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#4A5568', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(2)}`
          }
          width={60}
        />
        <Tooltip content={<CustomTooltip color={color} />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          animationDuration={1200}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
