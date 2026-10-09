import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { APPOINTMENT_STATUSES } from '../../utils/constants';

const STATUS_COLORS = {
  pending: '#F59E0B',   // warning amber
  confirmed: '#10B981', // success green
  completed: '#2563EB', // primary blue
  cancelled: '#EF4444', // danger red
  'no-show': '#64748B', // slate
};

export default function StaffStatusPie({ statusCounts = {} }) {
  const chartData = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: APPOINTMENT_STATUSES[status]?.label || status,
      key: status,
      value: count,
      color: STATUS_COLORS[status] || '#94A3B8',
    }));

  if (chartData.length === 0) {
    return <div className="p-4 text-center text-muted small">No appointment records yet.</div>;
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.key}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 border rounded shadow-sm small">
                    <div className="fw-semibold" style={{ color: data.color }}>
                      {data.name}
                    </div>
                    <div className="text-body font-monospace">
                      {data.value} {data.value === 1 ? 'appointment' : 'appointments'}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(val) => <span className="small text-muted">{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
