// components/AssignRiderPanel.jsx
import RiderListItem from './RiderListItem';

const AssignRiderPanel = ({ riders, onAssign, onCancel, selectedCount, totalGallons }) => {
  const orderSummary =
    selectedCount && totalGallons
      ? `${selectedCount} orders (${totalGallons} gallons)`
      : selectedCount
        ? `${selectedCount} orders`
        : 'selected orders';

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Assign Rider</h2>
        <p className="text-sm text-slate-600">Select a rider for {orderSummary}.</p>
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
