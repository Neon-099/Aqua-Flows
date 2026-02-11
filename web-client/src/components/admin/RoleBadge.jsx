const roleStyles = {
  admin: "bg-indigo-100 text-indigo-700 border-indigo-200",
  staff: "bg-amber-100 text-amber-700 border-amber-200",
  rider: "bg-emerald-100 text-emerald-700 border-emerald-200",
  customer: "bg-sky-100 text-sky-700 border-sky-200",
};

const RoleBadge = ({ role }) => {
  const style = roleStyles[role] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${style}`}>
      {role || "unknown"}
    </span>
  );
};

export default RoleBadge;
