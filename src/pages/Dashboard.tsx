import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  Stethoscope,
  TrendingUp,
  UserRoundPlus,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiUrl } from "../lib/api";
import { useNavigate } from "react-router-dom";

type DashboardApi = {
  stats?: {
    consultasHoje?: number;
    medicosAtendendo?: number;
    pacientesAgendados?: number;
    pendentes?: number;
    canceladas?: number;
    concluidas?: number;
  };
  monthlyConsultations?: { month: string; consultas: number }[];
  todayStatus?: { name: string; value: number; color: string }[];
  todayAppointments?: {
    time: string;
    patient: string;
    doctor: string;
    specialty: string;
  }[];
};

const fallbackMonthly = [
  { month: "jan.", consultas: 0 },
  { month: "fev.", consultas: 0 },
  { month: "mar.", consultas: 0 },
  { month: "abr.", consultas: 0 },
];

const fallbackStatus = [
  { name: "Confirmadas", value: 0, color: "#22c55e" },
  { name: "Pendentes", value: 0, color: "#f59e0b" },
  { name: "Canceladas", value: 0, color: "#ef4444" },
  { name: "Concluídas", value: 0, color: "#8b90f8" },
];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardApi>({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(apiUrl("/api/dashboard"));
        if (!response.ok) return;
        const json = await response.json();
        setDashboard(json.data ?? {});
      } catch {
        
      }
    };
    loadDashboard();
  }, []);

  const monthlyData = dashboard.monthlyConsultations?.length
    ? dashboard.monthlyConsultations.map((m) => ({
        month: (m.month || "").toLowerCase(),
        consultas: Number(m.consultas || 0),
      }))
    : fallbackMonthly;

  const statusData = dashboard.todayStatus?.length ? dashboard.todayStatus : fallbackStatus;
  const totalStatus = statusData.reduce((acc, item) => acc + (item.value || 0), 0);

  const growth = useMemo(() => {
    if (monthlyData.length < 2) return 0;
    const prev = monthlyData[monthlyData.length - 2]?.consultas ?? 0;
    const current = monthlyData[monthlyData.length - 1]?.consultas ?? 0;
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  }, [monthlyData]);

  const stats = [
    {
      label: "Consultas Hoje",
      value: dashboard.stats?.consultasHoje ?? 0,
      icon: CalendarDays,
      color: "text-sky-600",
      bg: "bg-sky-100",
    },
    {
      label: "Médicos Atendendo",
      value: dashboard.stats?.medicosAtendendo ?? 0,
      icon: Stethoscope,
      color: "text-violet-600",
      bg: "bg-violet-100",
    },
    {
      label: "Pacientes Agendados",
      value: dashboard.stats?.pacientesAgendados ?? 0,
      icon: UserRoundPlus,
      color: "text-cyan-600",
      bg: "bg-cyan-100",
    },
    {
      label: "Pendentes",
      value: dashboard.stats?.pendentes ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Canceladas",
      value: dashboard.stats?.canceladas ?? 0,
      icon: XCircle,
      color: "text-rose-600",
      bg: "bg-rose-100",
    },
    {
      label: "Concluídas",
      value: dashboard.stats?.concluidas ?? 0,
      icon: Check,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  const rows = dashboard.todayAppointments ?? [];

  return (
    <div className="space-y-6 bg-[#f4f5f7] min-h-full">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-4xl leading-none font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 stat-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Consultas Mensais</h3>
              <p className="text-xs text-gray-500">Últimos meses</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              {growth >= 0 ? `+${growth}%` : `${growth}%`}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="consultas" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Status de Hoje</h3>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={statusData} dataKey="value" innerRadius={44} outerRadius={66}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {totalStatus === 0 && (
            <p className="text-xs text-gray-400 text-center -mt-7 mb-3">Nenhuma consulta hoje</p>
          )}
          <div className="space-y-1.5 mt-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="text-gray-900 font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Consultas de Hoje</h3>
          <button
            className="text-xs text-[#49b594] font-semibold flex items-center gap-1 hover:underline"
            onClick={() => navigate("/agendamentos")}
          >
            Ver todas
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Horário</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Paciente</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Médico</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Especialidade</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-gray-400">
                    Nenhuma consulta para hoje.
                  </td>
                </tr>
              ) : (
                rows.map((a, i) => (
                  <tr key={`${a.time}-${a.patient}-${i}`} className="border-b border-gray-100">
                    <td className="py-2.5 font-medium text-gray-900">{a.time}</td>
                    <td className="py-2.5 text-gray-700">{a.patient}</td>
                    <td className="py-2.5 text-gray-600">{a.doctor}</td>
                    <td className="py-2.5 text-gray-600">{a.specialty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}