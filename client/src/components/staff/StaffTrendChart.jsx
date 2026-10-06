import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDate } from '../../utils/formatters';

export default function StaffTrendChart({ trend = [] }) {
  if (!trend || trend.length === 0) {
    return <div className="p-4 text-center text-muted small">No trend data available yet.</div>;
  }

  const chartData = trend.map((item) => ({
    rawDate: item.date,
    date: formatDate(item.date, { month: 'short', day: 'numeric' }),
    count: item.count,
  }));

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickLine={false}
            axisLine={{ stroke: '#CBD5E1' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(30, 111, 232, 0.08)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 border rounded shadow-sm small">
                    <div className="fw-semibold text-body">{data.date}</div>
                    <div className="text-primary font-monospace">
                      {data.count} {data.count === 1 ? 'appointment' : 'appointments'}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" fill="#1E6FE8" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
