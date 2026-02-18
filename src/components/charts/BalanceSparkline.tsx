'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface BalanceSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export default function BalanceSparkline({
  data,
  color = '#7B5EA7',
  width = 60,
  height = 30,
}: BalanceSparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
