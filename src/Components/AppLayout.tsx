import { useState } from "react";
import { Link, useLocation } from "react-router-dom";


import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  FileText,
  Menu,
  Activity,
} from "lucide-react";


import { cn } from "../lib/utils";



const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/pacientes", label: "Pacientes", icon: Users },
  { path: "/medicos", label: "Médicos", icon: Stethoscope },
  { path: "/agendamentos", label: "Agendamentos", icon: CalendarDays },
  { path: "/prontuarios", label: "Prontuários", icon: FileText },
];



export default function AppLayout({ children }: { children: React.ReactNode }) {


  const location = useLocation();

 
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (

  
    <div className="flex h-screen overflow-hidden text-white ">

      
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden "
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* menu lateral*/}
      <aside
        className={cn(
          
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#49b594] text-white flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0",

         
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >

        {/* Cabeçalho da sidebar (logo e nome do sistema) */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/20">

          
          <div className="w-9 h-9 rounded-xl bg-[#3cab90] flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>

         
          <div>
            <h1 className="text-base font-bold text-white">
              MedAdmin
            </h1>
            <p className="text-xs text-white/80">
              Sistema Médico
            </p>
          </div>

        </div>


        {/* Navegação da sidebar */}
        <nav className="flex-1 px-3 py-4 space-y-1">

          {/* Percorre todos os itens do menu */}
          {navItems.map((item) => {

            // Verifica se a rota atual é igual ao path do item
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path} 
                to={item.path} 
                onClick={() => setSidebarOpen(false)} 
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ",

                  isActive
                    ? "bg-white text-[#49b594]"
                    : "text-white/85 hover:bg-white/20 hover:text-white"
                )}  
              >

                {/* Renderiza o ícone correspondente ao item */}
                <item.icon className="w-5 h-5" />

                {/* Nome da página */}
                {item.label}

              </Link>
            );
          })}
        </nav>


        {/* Área inferior da sidebar (informações do usuário) */}
        <div className="px-4 py-4 border-t border-white/20">

          <div className="flex items-center gap-3">

            {/* Avatar do usuário */}
            <div className="w-8 h-8 rounded-full bg-[#3cab90] flex items-center justify-center text-xs font-semibold text-white">
              AD
            </div>

            {/* Informações do usuário */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                Administrador
              </p>
              <p className="text-[10px] text-white/80">
                admin@medadmin.com
              </p>
            </div>

          </div>
        </div>
      </aside>


      {/* Área principal da aplicação */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header superior */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 lg:px-6 gap-4 shrink-0">

          {/* Botão que abre a sidebar no mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-md hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>

          
          <div className="flex-1" />

          {/* Mostra a data atual formatada em português */}
          <span className="text-xs text-muted-foreground">
            {
              new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              })
            }
          </span>

        </header>


        {/* Área onde as páginas do sistema serão renderizadas */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>

      </div>
    </div>
  );
}