import { useEffect, useMemo, useState } from "react";
import { Filter, LayoutGrid, Plus, Search, Users } from "lucide-react";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import ToastStack from "../../components/admin/ToastStack";
import UserFormModal from "../../components/admin/UserFormModal";
import UserTable from "../../components/admin/UserTable";
import {
  archiveAdminUser,
  createAdminUser,
  fetchAdminUsers,
  restoreAdminUser,
  updateAdminUser,
} from "../../utils/adminApi";

const roleOptions = [
  { label: "All Roles", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "Staff", value: "staff" },
  { label: "Rider", value: "rider" },
  { label: "Customer", value: "customer" },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingArchive, setPendingArchive] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [data, setData] = useState({ items: [], pages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, roleFilter, debouncedSearch, limit]);

  const params = useMemo(
    () => ({
      archived: activeTab === "archived",
      search: debouncedSearch,
      role: roleFilter,
      page,
      limit,
      sortBy,
      sortOrder,
    }),
    [activeTab, debouncedSearch, roleFilter, page, limit, sortBy, sortOrder]
  );

  const loadUsers = async (payload) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const response = await fetchAdminUsers(payload);
      setData(response);
    } catch (err) {
      setIsError(true);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(params);
  }, [params]);

  const users = data?.items || [];
  const totalPages = data?.pages || 1;

  const pushToast = (toast) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  };

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await createAdminUser(payload);
      pushToast({ type: "success", title: "User created" });
      setFormOpen(false);
      await loadUsers(params);
    } catch (err) {
      pushToast({ type: "error", title: "Create failed", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    setSaving(true);
    try {
      await updateAdminUser(id, payload);
      pushToast({ type: "success", title: "User updated" });
      setFormOpen(false);
      await loadUsers(params);
    } catch (err) {
      pushToast({ type: "error", title: "Update failed", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveRequest = async (id) => {
    setArchiving(true);
    try {
      await archiveAdminUser(id);
      pushToast({ type: "success", title: "User archived" });
      setConfirmOpen(false);
      setPendingArchive(null);
      await loadUsers(params);
    } catch (err) {
      pushToast({ type: "error", title: "Archive failed", message: err.message });
    } finally {
      setArchiving(false);
    }
  };

  const handleRestoreRequest = async (id) => {
    setRestoring(true);
    try {
      await restoreAdminUser(id);
      pushToast({ type: "success", title: "User restored" });
      await loadUsers(params);
    } catch (err) {
      pushToast({ type: "error", title: "Restore failed", message: err.message });
    } finally {
      setRestoring(false);
    }
  };

  const emptyStateTitle = useMemo(() => {
    if (activeTab === "archived") return "No archived users yet.";
    if (search.trim()) return "No results match your search.";
    return "No active users to display.";
  }, [activeTab, search]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const openCreate = () => {
    setFormMode("create");
    setSelectedUser(null);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setFormMode("edit");
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleFormSubmit = (formData) => {
    if (formMode === "create") {
      handleCreate(formData);
      return;
    }
    const payload = { ...formData };
    if (!payload.password) {
      delete payload.password;
    }
    handleUpdate(selectedUser._id, payload);
  };

  const handleArchive = (user) => {
    setPendingArchive(user);
    setConfirmOpen(true);
  };

  const handleConfirmArchive = () => {
    if (!pendingArchive) return;
    handleArchiveRequest(pendingArchive._id);
  };

  const handleRestore = (user) => {
    handleRestoreRequest(user._id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ToastStack toasts={toasts} />
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-6 py-8 lg:flex">
          <div className="flex items-center gap-2 text-xl font-semibold text-blue-600">
            <LayoutGrid size={20} />
            <span>AquaFlow Admin</span>
          </div>
          <nav className="mt-10 space-y-2 text-sm font-medium">
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
              <Users size={18} />
              <span>User Management</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-500">
              <LayoutGrid size={18} />
              <span>Operations</span>
            </div>
          </nav>
          <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            Secure admin access enabled.
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin Console</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">User Management</h1>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={16} />
                Add User
              </button>
            </div>
          </header>

          <section className="px-6 py-8 lg:px-10">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search size={16} />
                    </span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name or email"
                      className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Filter size={16} />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`rounded-full px-4 py-2 ${
                      activeTab === "active"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Active Users
                  </button>
                  <button
                    onClick={() => setActiveTab("archived")}
                    className={`rounded-full px-4 py-2 ${
                      activeTab === "archived"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Archived Users
                  </button>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                {isLoading ? (
                  <div className="px-4 py-12 text-center text-sm text-slate-500">
                    Loading users...
                  </div>
                ) : isError ? (
                  <div className="px-4 py-12 text-center text-sm text-red-600">
                    {error?.message || "Unable to load users."}
                  </div>
                ) : users.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Users size={20} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-900">{emptyStateTitle}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Add new users or adjust filters to see results.
                    </p>
                  </div>
                ) : (
                  <UserTable
                    users={users}
                    onEdit={openEdit}
                    onArchive={handleArchive}
                    onRestore={handleRestore}
                    onSort={handleSort}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    archivedView={activeTab === "archived"}
                  />
                )}
              </div>

              <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
                <div>
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={30}>30 / page</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page >= totalPages}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <UserFormModal
        open={formOpen}
        mode={formMode}
        initialData={selectedUser}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        loading={saving}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Archive user?"
        message={`This will remove ${pendingArchive?.name || "this user"} from active users.`}
        confirmText="Archive"
        onConfirm={handleConfirmArchive}
        onClose={() => {
          setConfirmOpen(false);
          setPendingArchive(null);
        }}
        loading={archiving}
      />
    </div>
  );
};

export default AdminDashboard;
