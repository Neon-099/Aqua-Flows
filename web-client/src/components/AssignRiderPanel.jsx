// components/AssignRiderPanel.jsx
import RiderListItem from './RiderListItem';

const AssignRiderPanel = ({
  riders,
  onAssign,
  onCancel,
  selectedCount,
  totalGallons,
  weights,
  previewEnabled,
  onPreviewRecommended,
  previewLoading,
  previewError,
  recommended,
  onAssignRecommended,
}) => {
  const orderSummary =
    selectedCount && totalGallons
      ? `${selectedCount} orders (${totalGallons} gallons)`
      : selectedCount
        ? `${selectedCount} orders`
        : 'selected orders';

  const weightText = weights
    ? `Load ${Math.round(weights.load * 100)}%, Orders ${Math.round(weights.orders * 100)}%, Capacity ${Math.round(weights.capacity * 100)}%`
    : 'Load 50%, Orders 40%, Capacity 10%';

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Assign Rider</h2>
        <p className="text-sm text-slate-600">Select a rider for {orderSummary}.</p>
      </div>

      {/* Recommended Rider */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recommended Rider</h3>
            <p className="text-xs text-slate-600">Scoring: {weightText}</p>
          </div>
          <button
            type="button"
            onClick={onPreviewRecommended}
            disabled={!previewEnabled || previewLoading}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {previewLoading ? 'Loading...' : 'Preview Auto-Assign'}
          </button>
        </div>

        {!previewEnabled && (
          <p className="text-xs text-slate-500 mt-2">Preview is available when 1 order is selected.</p>
        )}

        {previewError && (
          <p className="text-xs text-rose-600 mt-2">{previewError}</p>
        )}

        {recommended && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{recommended.name}</p>
                <p className="text-xs text-slate-600">{recommended.reason}</p>
              </div>
              <button
                type="button"
                onClick={onAssignRecommended}
                disabled={!previewEnabled}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Recommended
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <div>Load: {recommended.currentLoadGallons} gal</div>
              <div>Orders: {recommended.activeOrdersCount}</div>
              <div>Remaining: {recommended.remainingCapacity} gal</div>
            </div>
          </div>
        )}
      </div>

      {/* Riders List */}
      <div className="space-y-1 mb-6">
        {riders.map((rider) => (
          <RiderListItem key={rider.id} rider={rider} onAssign={onAssign} />
        ))}
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="w-full py-3 bg-white text-slate-700 rounded-xl font-semibold border-2 border-slate-200 hover:border-slate-300 transition-colors"
      >
        Cancel Assignment
      </button>
    </div>
  );
};

export default AssignRiderPanel;
