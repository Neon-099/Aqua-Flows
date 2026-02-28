// components/RiderListItem.jsx
import { AlertTriangle } from 'lucide-react';
import { getRiderStatusInfo } from '../utils/staffFormatters';
import { RiderStatus } from '../constants/staff.constants';

const RiderListItem = ({ rider, onAssign }) => {
  const statusInfo = getRiderStatusInfo(rider.status);
  const isAvailable = rider.status === RiderStatus.AVAILABLE;
  const isAtCapacity = Boolean(rider?.isAtCapacity);

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-full ${rider.avatarColor} flex items-center justify-center text-white font-bold text-sm`}
        >
          {rider.initials}
        </div>

        {/* Rider Info */}
        <div>
          <p className="font-semibold text-slate-900">{rider.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
            <span className="text-xs text-slate-600 font-medium">{statusInfo.label}</span>
          </div>
          {Number.isFinite(rider?.currentLoadGallons) && Number.isFinite(rider?.maxCapacityGallons) && (
            <p className={`text-xs mt-1 ${isAtCapacity ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
              Load: {rider.currentLoadGallons} / {rider.maxCapacityGallons} gal
            </p>
          )}
          {isAtCapacity && (
            <p className="text-xs text-rose-600 mt-0.5">At max capacity</p>
          )}
        </div>
      </div>

      {/* Action Button */}
      {isAvailable && !isAtCapacity ? (
        <button
          onClick={() => onAssign(rider.id)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Assign
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onAssign(rider.id)}
          disabled={!isAtCapacity}
          className={`px-5 py-2 rounded-lg font-semibold text-sm ${
            isAtCapacity
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isAtCapacity ? (
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={14} />
              At Capacity
            </span>
          ) : (
            'Busy'
          )}
        </button>
      )}
    </div>
  );
};

export default RiderListItem;
