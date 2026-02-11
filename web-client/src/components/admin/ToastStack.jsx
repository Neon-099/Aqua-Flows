const ToastStack = ({ toasts }) => {
  if (!toasts?.length) return null;

  return (
    <div className="fixed right-6 top-6 z-50 flex w-72 flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <p className="font-semibold">{toast.title}</p>
          {toast.message && <p className="mt-1 text-xs text-slate-600">{toast.message}</p>}
        </div>
      ))}
    </div>
  );
};

export default ToastStack;
