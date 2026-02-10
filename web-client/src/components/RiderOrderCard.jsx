// components/RiderOrderCard.jsx
import { Droplet, MapPin, Wallet, Clock } from 'lucide-react';
import { getStatusColors } from '../utils/staffFormatters';
import { getRiderActions, getButtonVariant, formatCurrency } from '../utils/riderFormatters';
import { PaymentMethod } from '../constants/staff.constants';

const RiderOrderCard = ({
  order,
  onAction,
  isSelectable,
  isChecked,
  selectionLabel,
  onToggleSelect,
}) => {
  const statusColors = getStatusColors(order.status);
  const actions = getRiderActions(order.status, order.paymentMethod);
  const gallonTypeLabel = order.gallonType
    ? (String(order.gallonType).toUpperCase() === 'SLIM'
      ? 'Slim'
      : String(order.gallonType).toUpperCase() === 'ROUND'
      ? 'Round'
      : order.gallonType)
    : null;

  const handleAction = (actionType) => {
    onAction(order.id, actionType);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${statusColors.bg} ${statusColors.text}`}>
          {order.orderId}
        </span>
        {isSelectable && (
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={isChecked}
              onChange={() => onToggleSelect(order.id)}
            />
            {selectionLabel}
          </label>
        )}
        {order.eta && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock size={14} />
            <span className="text-xs font-semibold">{order.eta}</span>
          </div>
        )}
      </div>

      {/* Customer Info */}
      <h3 className="text-lg font-bold text-slate-900 mb-1">{order.customerName}</h3>
      <div className="flex items-start gap-1.5 mb-3">
        <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-sm text-slate-600">{order.address}</p>
      </div>

      {/* Order Details */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-blue-600">
          <Droplet size={16} fill="currentColor" />
          <span className="text-sm font-semibold">
            {order.gallons} Gallons{gallonTypeLabel ? ` · ${gallonTypeLabel}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <Wallet size={16} />
          <span className="text-sm font-semibold">
            {formatCurrency(order.totalAmount)} ({order.paymentMethod === PaymentMethod.COD ? 'COD' : 'GCash'})
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-3">
        <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${statusColors.bg} ${statusColors.text}`}>
          Status: {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(action.action)}
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${getButtonVariant(action.variant)}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {order.status === 'COMPLETED' && (
        <div className="mt-3">
          <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
            ✓ Completed
          </span>
        </div>
      )}
    </div>
  );
};

export default RiderOrderCard;
