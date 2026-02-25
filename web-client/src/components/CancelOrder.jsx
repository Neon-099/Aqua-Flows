const CancelOrder = ({ confirmCancelOrder, cancelTargetOrder, closeCancelModal, cancellingOrderId }) => {
  if (!cancelTargetOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close cancel confirmation"
        onClick={closeCancelModal}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600 mb-2">
          Cancel Order
        </p>
        <h3 className="text-xl font-black text-slate-900">
          Are you sure you want to cancel?
        </h3>
        <p className="text-sm text-slate-600 mt-3">
          {cancelTargetOrder.orderId || 'Order'} will be marked as cancelled and cannot be resumed.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeCancelModal}
            disabled={Boolean(cancellingOrderId)}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={confirmCancelOrder}
            disabled={Boolean(cancellingOrderId)}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancellingOrderId ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrder;
