const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText,
  onConfirm,
  onClose,
  loading,
  requireText,
  inputValue,
  onInputChange,
  inputLabel,
  inputPlaceholder,
}) => {
  if (!open) return null;
  const requireMatch = Boolean(requireText);
  const safeValue = (inputValue || "").trim();
  const confirmDisabled = loading || (requireMatch && safeValue !== requireText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        {requireMatch && (
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase text-slate-500">
              {inputLabel || `Type ${requireText} to confirm`}
            </label>
            <input
              value={inputValue || ""}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder || requireText}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
            disabled={confirmDisabled}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
