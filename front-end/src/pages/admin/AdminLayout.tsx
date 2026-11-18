import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";

import logoImg from "../../assets/logo_projeto.png";

const ADMIN_TABS = [
  { label: "usuários", to: "/admin", end: true },
  { label: "relatório do sistema", to: "/admin/relatorio", end: false },
];

/**
 * Estrutura compartilhada das telas administrativas.
 *
 * O cabeçalho escuro mantém a identidade visual do Organizaê e as abas
 * internas alternam entre a listagem de usuários e o relatório do sistema.
 *
 * TODO [BACKEND]: A guarda real de acesso está em `AdminAccessGuard`
 * (App.tsx). Este componente não deve ser usado como barreira de segurança;
 * o back-end precisa validar a role ADMIN em todas as chamadas /api/admin/*.
 */
function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isReportPage = pathname.startsWith("/admin/relatorio");
  const sectionTitle = isReportPage ? "Relatório do sistema" : "Usuários";

  function handleExitAdmin() {
    localStorage.removeItem("admin_access");

    const hasAuthenticatedSession = Boolean(
      localStorage.getItem("access_token"),
    );

    navigate(hasAuthenticatedSession ? "/dashboard" : "/login", {
      replace: true,
    });
  }

  return (
    <div className="min-h-svh bg-slate-50">
      <header className="sticky top-0 z-30 bg-[#0B085C] text-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            aria-label="Ir para o início do painel administrativo"
          >
            <img
              src={logoImg}
              alt=""
              aria-hidden="true"
              className="h-[52px] w-[52px] select-none object-contain"
              draggable={false}
            />

            <span className="text-lg font-bold tracking-tight">Organizaê</span>
          </Link>

          <span className="ml-2 hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100 sm:inline-flex">
            <ShieldCheck size={14} aria-hidden="true" />
            Painel administrativo
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/dashboard"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-indigo-100/80 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Voltar ao dashboard</span>
              <span className="sm:hidden">Voltar</span>
            </Link>

            <button
              type="button"
              onClick={handleExitAdmin}
              aria-label="Sair do painel administrativo"
              title="Sair do painel administrativo"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-indigo-100/80 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} aria-hidden="true" />
              <span className="hidden md:inline">Sair do painel</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pt-8">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#4F26E9] uppercase">
              Administração
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#0B0B45]">
              Administrador — {sectionTitle}
            </h1>
          </div>

          <nav
            aria-label="Seções do painel administrativo"
            className="mt-6 flex gap-6 overflow-x-auto"
          >
            {ADMIN_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `-mb-px shrink-0 border-b-2 pb-3 text-sm font-semibold transition ${
                    isActive
                      ? "border-[#4F26E9] text-[#4F26E9]"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
