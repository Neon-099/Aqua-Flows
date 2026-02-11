import { ArrowDown, ArrowUp, Edit3, RotateCcw, Trash2 } from "lucide-react";
import RoleBadge from "./RoleBadge";
import StatusBadge from "./StatusBadge";

const columns = [
  { key: "name", label: "User" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "createdAt", label: "Created" },
];

const UserTable = ({ users, onEdit, onArchive, onRestore, onSort, sortBy, sortOrder, archivedView }) => {
  const renderSortIcon = (key) => {
    if (sortBy !== key) return null;
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="text-blue-600" />
    ) : (
      <ArrowDown size={14} className="text-blue-600" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold">
                <button
                  type="button"
                  onClick={() => onSort(col.key)}
                  className="inline-flex items-center gap-2"
                >
                  {col.label}
                  {renderSortIcon(col.key)}
                </button>
              </th>
            ))}
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-t border-slate-100">
              <td className="px-4 py-4">
                <div className="font-semibold text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">{user.phone}</div>
              </td>
              <td className="px-4 py-4 text-slate-600">{user.email}</td>
              <td className="px-4 py-4">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-4 py-4 text-slate-600">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-4">
                <StatusBadge archived={user.isArchived} />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                  {archivedView ? (
                    <button
                      type="button"
                      onClick={() => onRestore(user)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      <RotateCcw size={14} />
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onArchive(user)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Archive
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
