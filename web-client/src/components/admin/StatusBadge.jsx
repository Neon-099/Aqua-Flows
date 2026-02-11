const StatusBadge = ({ archived }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        archived
          ? "border-slate-200 bg-slate-100 text-slate-600"
          : "border-green-200 bg-green-100 text-green-700"
      }`}
    >
      {archived ? "Archived" : "Active"}
    </span>
  );
};

export default StatusBadge;
