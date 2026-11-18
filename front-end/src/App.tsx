import type { ReactNode } from "react";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import VerifyCode from "./pages/VerifyCode";
import Dashboard from "./pages/Dashboard";
import FixedExpenses from "./pages/FixedExpenses";
import Transactions from "./pages/Transactions";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminSystemReport from "./pages/admin/AdminSystemReport";
import AdminUsers from "./pages/admin/AdminUsers";

/**
 * Guarda provisória das rotas administrativas.
 *
 * TODO [BACKEND]: Atualmente a rota /admin é acessada provisoriamente pelas credenciais de teste (usuario admin / senha admin). Substituir por middleware de autorização baseado em roles/claims JWT (ex: role === 'ADMIN').
 *
 * Enquanto o JWT não expõe a role, a flag `admin_access` é gravada pelo login
 * provisório e removida ao sair do painel. O `user_role` já é consultado para
 * facilitar a transição assim que o back-end passar a enviar a claim.
 */
function AdminAccessGuard({ children }: { children: ReactNode }) {
  const storedRole = localStorage.getItem("user_role");
  const hasAdminRole = storedRole?.toUpperCase() === "ADMIN";
  const hasProvisionalAccess = localStorage.getItem("admin_access") === "true";

  if (!hasAdminRole && !hasProvisionalAccess) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/movimentacoes" element={<Transactions />} />
        <Route path="/gastos-fixos" element={<FixedExpenses />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/verificar-codigo" element={<VerifyCode />} />

        <Route
          path="/admin"
          element={
            <AdminAccessGuard>
              <AdminLayout />
            </AdminAccessGuard>
          }
        >
          <Route index element={<AdminUsers />} />
          <Route path="relatorio" element={<AdminSystemReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
