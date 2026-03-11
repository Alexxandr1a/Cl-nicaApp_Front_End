// Importa o hook useState do React.
// Ele permite criar estados (valores que podem mudar na interface).
import { useState } from "react";

// Importa componentes do react-router-dom para navegação entre páginas.
import { Link, useLocation } from "react-router-dom";

// Importa ícones da biblioteca lucide-react.
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  FileText,
  Menu,
  X,
  Activity,
} from "lucide-react";

// Importa uma função utilitária chamada "cn".
// Ela normalmente serve para juntar classes CSS dinamicamente (className).
import { cn } from "../lib/utils";


// Lista de itens da navegação lateral (sidebar)
// Cada item representa uma página do sistema.
const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/pacientes", label: "Pacientes", icon: Users },
  { path: "/medicos", label: "Médicos", icon: Stethoscope },
  { path: "/agendamentos", label: "Agendamentos", icon: CalendarDays },
  { path: "/prontuarios", label: "Prontuários", icon: FileText },
];


// Componente principal do layout da aplicação
// Ele recebe "children", que são as páginas que serão renderizadas dentro dele.
export default function AppLayout({ children }: { children: React.ReactNode }) {

  // Hook do React Router que permite saber qual é a rota atual da aplicação
  const location = useLocation();

  // Estado que controla se a sidebar está aberta no mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (

    // Container principal do layout
    // flex = layout flexbox
    // h-screen = altura da tela inteira
    // overflow-hidden = evita scroll desnecessário
    <div className="flex h-screen overflow-hidden text-white ">

      {/* Overlay que aparece no mobile quando o menu está aberto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden "
          onClick={() => setSidebarOpen(false)} // fecha a sidebar quando clicar fora
        />
      )}

      {/* Sidebar (menu lateral) */}
      <aside
        className={cn(
          // classes padrão da sidebar
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 bg-[#49b594]  ",

          // se sidebarOpen for true ela aparece, senão fica escondida
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >

        {/* Cabeçalho da sidebar (logo e nome do sistema) */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border ">

          {/* Ícone do sistema */}
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>

          {/* Nome do sistema */}
          <div>
            <h1 className="text-base font-bold text-sidebar-primary-foreground">
              MedAdmin
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
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
                key={item.path} // chave única para o React
                to={item.path} // rota que será acessada
                onClick={() => setSidebarOpen(false)} // fecha sidebar no mobile
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ",

                  isActive
                    ? "bg-white text-[#49b594]"
                    : "text-sidebar-foreground hover:bg-white/20 hover:text-white"
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
        <div className="px-4 py-4 border-t border-sidebar-border">

          <div className="flex items-center gap-3">

            {/* Avatar do usuário */}
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground">
              AD
            </div>

            {/* Informações do usuário */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-primary-foreground truncate">
                Administrador
              </p>
              <p className="text-[10px] text-sidebar-foreground/60">
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

          {/* Espaço flexível para empurrar a data para direita */}
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