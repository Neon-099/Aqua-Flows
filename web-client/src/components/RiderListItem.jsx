// components/RiderListItem.jsx
import { getRiderStatusInfo } from '../utils/staffFormatters';
import { RiderStatus } from '../constants/staff.constants';

const RiderListItem = ({ rider, onAssign }) => {
  const statusInfo = getRiderStatusInfo(rider.status);
  const isAvailable = rider.status === RiderStatus.AVAILABLE;

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
        </div>
      </div>

      {/* Action Button */}
      {isAvailable ? (
        <button
          onClick={() => onAssign(rider.id)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Assign
        </button>
      ) : (
        <button
          disabled
          className="px-5 py-2 bg-slate-100 text-slate-400 rounded-lg font-semibold text-sm cursor-not-allowed"
        >
          Busy
        </button>
      )}
    </div>
  );
};

export default RiderListItem;
