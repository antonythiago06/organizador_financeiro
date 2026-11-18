import { useCallback, useEffect, useState } from "react";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

import DeleteUserModal from "../../components/admin/DeleteUserModal";
import AdminUsersTable from "../../components/admin/AdminUsersTable";
import { deleteAdminUser, fetchAdminUsers } from "../../lib/adminApi";
import type { AdminUser } from "../../types/admin";

const PAGE_SIZE = 6;

/**
 * Dados temporários apenas para visualização do layout durante o
 * desenvolvimento do front-end. Eles não representam pessoas reais.
 *
 * TODO [BACKEND]: Remover dados de exemplo/mockados do estado inicial. Conectar endpoint GET /api/admin/users para preencher a tabela dinamicamente com dados do banco de dados.
 */
const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: "mock-user-1",
    name: "Ana Beatriz Souza",
    email: "ana.souza@exemplo.com",
    createdAt: "2026-01-12T12:00:00.000Z",
  },
  {
    id: "mock-user-2",
    name: "Bruno Carvalho Lima",
    email: "bruno.lima@exemplo.com",
    createdAt: "2026-02-03T12:00:00.000Z",
  },
  {
    id: "mock-user-3",
    name: "Camila Ferreira Alves",
    email: "camila.alves@exemplo.com",
    createdAt: "2026-02-21T12:00:00.000Z",
  },
  {
    id: "mock-user-4",
    name: "Diego Martins Rocha",
    email: "diego.rocha@exemplo.com",
    createdAt: "2026-03-08T12:00:00.000Z",
  },
  {
    id: "mock-user-5",
    name: "Elisa Nogueira Prado",
    email: "elisa.prado@exemplo.com",
    createdAt: "2026-03-27T12:00:00.000Z",
  },
  {
    id: "mock-user-6",
    name: "Felipe Andrade Costa",
    email: "felipe.costa@exemplo.com",
    createdAt: "2026-04-15T12:00:00.000Z",
  },
];

/**
 * Alterna entre os dados de demonstração e a API real.
 *
 * TODO [BACKEND]: Alterar para `false` (ou remover a flag) quando o endpoint
 * GET /api/admin/users estiver disponível no ambiente de desenvolvimento.
 */
const USE_MOCK_USERS = true;

function AdminUsers() {
  const [mockUsers, setMockUsers] = useState<AdminUser[]>(MOCK_ADMIN_USERS);
  const [remoteUsers, setRemoteUsers] = useState<AdminUser[]>([]);
  const [remoteTotal, setRemoteTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(!USE_MOCK_USERS);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [feedback, setFeedback] = useState("");

  const totalUsers = USE_MOCK_USERS ? mockUsers.length : remoteTotal;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, totalPages);
  const users = USE_MOCK_USERS
    ? mockUsers.slice(
        (visiblePage - 1) * PAGE_SIZE,
        visiblePage * PAGE_SIZE,
      )
    : remoteUsers;

  useEffect(() => {
    if (USE_MOCK_USERS) {
      return;
    }

    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);
      setLoadError("");

      try {
        // TODO [BACKEND]: Conectar endpoint GET /api/admin/users para
        // preencher a tabela dinamicamente com dados do banco de dados.
        const result = await fetchAdminUsers({
          page: visiblePage,
          limit: PAGE_SIZE,
        });

        if (!isMounted) {
          return;
        }

        setRemoteUsers(result.items);
        setRemoteTotal(result.total);

        if (result.page > result.totalPages) {
          setCurrentPage(result.totalPages);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários do painel admin:", error);

        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os usuários cadastrados.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [reloadKey, visiblePage]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(""), 4500);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleOpenDelete = useCallback((user: AdminUser) => {
    setDeleteError("");
    setDeletingUser(user);
  }, []);

  const handleCloseDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setDeleteError("");
    setDeletingUser(null);
  }, [isDeleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingUser || isDeleting) {
      return;
    }

    const userToDelete = deletingUser;

    setIsDeleting(true);
    setDeleteError("");

    try {
      if (USE_MOCK_USERS) {
        // Simula a exclusão local apenas para validar o fluxo visual.
        setMockUsers((currentUsers) =>
          currentUsers.filter((user) => user.id !== userToDelete.id),
        );
        setCurrentPage(1);
      } else {
        // TODO [BACKEND]: Conectar endpoint DELETE /api/admin/users/:id para persistir a exclusão da conta do usuário no banco de dados e atualizar a listagem em tempo real.
        await deleteAdminUser(userToDelete.id);
        setReloadKey((currentKey) => currentKey + 1);
      }

      setFeedback(`Conta de ${userToDelete.name} excluída com sucesso.`);
      setDeletingUser(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a conta do usuário.",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [deletingUser, isDeleting]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
    },
    [totalPages],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-[#0B0B45]">
          Usuários
        </h2>

        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Gerencie as contas dos usuários cadastrados no Organizaê.
        </p>
      </header>

      {feedback && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5"
        >
          <CheckCircle2
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <p className="flex-1 text-sm font-medium text-emerald-800">
            {feedback}
          </p>

          <button
            type="button"
            onClick={() => setFeedback("")}
            aria-label="Fechar mensagem de sucesso"
            className="rounded-full p-1 text-emerald-600 transition hover:bg-emerald-100"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {!isLoading && loadError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-rose-600"
            />

            <div>
              <p className="text-sm font-semibold text-rose-800">{loadError}</p>
              <p className="mt-0.5 text-xs text-rose-600">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-300 bg-white px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <AdminUsersTable
        users={users}
        totalUsers={totalUsers}
        currentPage={visiblePage}
        totalPages={totalPages}
        isLoading={isLoading}
        onDelete={handleOpenDelete}
        onPageChange={handlePageChange}
      />

      <DeleteUserModal
        isOpen={Boolean(deletingUser)}
        user={deletingUser}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default AdminUsers;
