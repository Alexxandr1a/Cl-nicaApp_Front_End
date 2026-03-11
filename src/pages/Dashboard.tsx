// ================= IMPORTAÇÃO DE ÍCONES =================
// Ícones usados nos cards de estatísticas do dashboard
import {CalendarDays, Users, Stethoscope, DollarSign, Clock, XCircle, TrendingUp, ArrowUpRight,
} from "lucide-react";

  
// ================= IMPORTAÇÃO DOS COMPONENTES DE GRÁFICOS =================
// Biblioteca usada para criar gráficos no React
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";


// ================= DADOS DAS ESTATÍSTICAS =================
// Esses dados futuramente devem vir do BACKEND
// Exemplo: número de consultas, pacientes etc

const stats = [
  { label: "Consultas Hoje", value: "0", icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-100" },
  { label: "Médicos Atendendo", value: "0", icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-100" },
  { label: "Pacientes Agendados", value: "0", icon: Users, color: "text-cyan-600", bg: "bg-cyan-100" },
  { label: "Receita do Dia", value: "R$ 0", icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
  { label: "Pendentes", value: "0", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
  { label: "Canceladas", value: "0", icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
];


// ================= DADOS DO GRÁFICO DE CONSULTAS =================
// Representa quantidade de consultas por mês
// Inicialmente zerado até receber dados do backend

const monthlyData = [
  { month: "Jan", consultas: 0 },
  { month: "Fev", consultas: 0 },
  { month: "Mar", consultas: 0 },
  { month: "Abr", consultas: 0 },
];


// ================= DADOS DO GRÁFICO DE STATUS =================
// Status das consultas do dia

const statusData = [
  { name: "Confirmadas", value: 0, color: "#22c55e" },
  { name: "Pendentes", value: 0, color: "#f59e0b" },
  { name: "Canceladas", value: 0, color: "#ef4444" },
];


// ================= TABELA DE CONSULTAS =================
// Lista de consultas recentes
// Começa vazia até receber dados do backend

const recentAppointments: any[] = [];


// ================= COMPONENTE PRINCIPAL DO DASHBOARD =================

export default function Dashboard() {

  return (

    // Container principal da página
    // space-y cria espaçamento vertical entre os elementos
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">


      {/* ================= HEADER DO DASHBOARD ================= */}

      <div>
        {/* Título principal */}
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        {/* Subtítulo */}
        <p className="text-sm text-gray-500">
          Visão geral do sistema
        </p>
      </div>



      {/* ================= CARDS DE ESTATÍSTICAS ================= */}

      {/* Grid responsivo com os indicadores do sistema */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

        {stats.map((s) => (

          // Card individual de estatística
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
          >

            {/* Ícone da estatística */}
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>

            {/* Valor da estatística */}
            <p className="text-2xl font-bold text-gray-900">
              {s.value}
            </p>

            {/* Nome da estatística */}
            <p className="text-xs text-gray-500 mt-1">
              {s.label}
            </p>

          </div>

        ))}

      </div>



      {/* ================= GRÁFICOS ================= */}

      <div className="grid lg:grid-cols-3 gap-4">


        {/* ================= GRÁFICO DE BARRAS ================= */}
        {/* Mostra quantidade de consultas por mês */}

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          {/* Cabeçalho do gráfico */}
          <div className="flex items-center justify-between mb-4">

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Consultas Mensais
              </h3>

              <p className="text-xs text-gray-500">
                Últimos meses
              </p>
            </div>

            {/* Indicador de crescimento */}
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              0%
            </div>

          </div>


          {/* Container responsivo do gráfico */}
          <ResponsiveContainer width="100%" height={240}>

            <BarChart data={monthlyData}>

              {/* Linhas do fundo do gráfico */}
              <CartesianGrid strokeDasharray="3 3" />

              {/* Eixo horizontal (meses) */}
              <XAxis dataKey="month" />

              {/* Eixo vertical */}
              <YAxis />

              {/* Tooltip ao passar o mouse */}
              <Tooltip />

              {/* Barras do gráfico */}
              <Bar
                dataKey="consultas"
                fill="#0284c7"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>



        {/* ================= GRÁFICO DE PIZZA ================= */}
        {/* Mostra status das consultas */}

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Status de Hoje
          </h3>

          <ResponsiveContainer width="100%" height={180}>

            <PieChart>

              <Pie
                data={statusData}
                dataKey="value"
                innerRadius={50}
                outerRadius={75}
              >

                {/* Cores das fatias */}
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}

              </Pie>

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>



      {/* ================= TABELA DE CONSULTAS ================= */}

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

        {/* Cabeçalho da tabela */}
        <div className="flex items-center justify-between mb-4">

          <h3 className="text-sm font-semibold text-gray-900">
            Consultas de Hoje
          </h3>

          {/* Botão para acessar todas as consultas */}
          <button className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline">
            Ver todas
            <ArrowUpRight className="w-3 h-3" />
          </button>

        </div>



        {/* Container com scroll horizontal */}
        <div className="overflow-x-auto">

          <table className="w-full text-sm">


            {/* Cabeçalho da tabela */}
            <thead>
              <tr className="border-b border-gray-200">

                <th className="text-left py-2 text-xs font-medium text-gray-500">
                  Horário
                </th>

                <th className="text-left py-2 text-xs font-medium text-gray-500">
                  Paciente
                </th>

                <th className="text-left py-2 text-xs font-medium text-gray-500">
                  Médico
                </th>

                <th className="text-left py-2 text-xs font-medium text-gray-500">
                  Especialidade
                </th>

              </tr>
            </thead>



            {/* Corpo da tabela */}
            <tbody>

              {/* Lista de consultas */}
              {recentAppointments.map((a, i) => (

                <tr key={i} className="border-b border-gray-100">

                  <td className="py-2.5 font-medium text-gray-900">
                    {a.time}
                  </td>

                  <td className="py-2.5">
                    {a.patient}
                  </td>

                  <td className="py-2.5 text-gray-500">
                    {a.doctor}
                  </td>

                  <td className="py-2.5 text-gray-500">
                    {a.specialty}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}