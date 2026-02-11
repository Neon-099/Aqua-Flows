// components/OrderCard.jsx
import { Check, Clock, Droplet } from 'lucide-react';
import { getStatusColors } from '../utils/staffFormatters';
import { OrderStatus, PaymentMethod } from '../constants/staff.constants';

const OrderCard = ({
  order,
  isSelected,
  isSelectable,
  isChecked,
  selectionLabel,
  onToggleSelect,
  onAccept,
  onAssignRider,
  footer,
}) => {
  const statusColors = getStatusColors(order.status);
  const isPending = order.status === OrderStatus.PENDING;
  const isConfirmed = order.status === OrderStatus.CONFIRMED;
  const isAssignable = order.status === OrderStatus.CONFIRMED && !order.assignedRiderId;
  const isAlreadyAssigned = order.status === OrderStatus.CONFIRMED && order.assignedRiderId;
  const gallonTypeLabel = order.gallonType
    ? (String(order.gallonType).toUpperCase() === 'SLIM'
      ? 'Slim'
      : String(order.gallonType).toUpperCase() === 'ROUND'
      ? 'Round'
      : order.gallonType)
    : null;

  return (
    <div
      className={`bg-white rounded-2xl p-5 border-2 transition-all ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-slate-200 shadow-sm'
      }`}
    >
      {/* Order ID Badge */}
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
        {order.timeRemaining && (
          <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg">
            <Clock size={14} />
            <span className="text-sm font-bold">
              {Math.floor(order.timeRemaining / 60)
                .toString()
                .padStart(2, '0')}
              :{(order.timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Customer Info */}
      <h3 className="text-lg font-bold text-slate-900 mb-1">{order.customerName}</h3>
      <p className="text-sm text-slate-600 mb-3">{order.address}</p>

      {/* Order Details */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-blue-600">
          <Droplet size={16} fill="currentColor" />
          <span className="text-sm font-semibold">
            {order.gallons} Gallons{gallonTypeLabel ? ` · ${gallonTypeLabel}` : ''}
          </span>
        </div>
        <div className="px-2.5 py-1 bg-slate-100 rounded-lg">
          <span className="text-xs font-semibold text-slate-700">
            {order.paymentMethod === PaymentMethod.COD ? 'COD' : 'GCash'}
          </span>
        </div>
      </div>

      {/* Status Badges */}
      {order.autoAccepted && (
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
            Auto-Assigned
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isPending ? (
          <button
            onClick={() => onAccept(order.id)}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Accept Order
          </button>
        ) : isAssignable ? (
          <>
            <button
              disabled
              className="flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-green-200"
            >
              <Check size={16} />
              Accepted
            </button>
            <button
              onClick={() => onAssignRider(order.id)}
              className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Assign Rider
            </button>
          </>
        ) : isAlreadyAssigned ? (
          <button
            disabled
            className="flex-1 bg-slate-100 text-slate-500 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-slate-200"
          >
            Assigned
          </button>
        ) : (
          <button
            disabled
            className="flex-1 bg-slate-100 text-slate-500 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-slate-200"
          >
            {order.status.replaceAll('_', ' ')}
          </button>
        )}
      </div>

      {isConfirmed && (
        <div className="mt-3">
          <span className="inline-block px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">
            Confirmed
          </span>
        </div>
      )}
      {isAlreadyAssigned && (
        <div className="mt-3">
          <span className="inline-block px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
            Assigned {order.assignedRider ? `to ${order.assignedRider}` : ''}
          </span>
        </div>
      )}
      {footer && (
        <div className="mt-4">
          {footer}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
