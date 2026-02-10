// components/ConversationItem.jsx
import { getContactTypeBadge, formatConversationTime } from '../utils/messagingFormatters';

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const badgeColors = getContactTypeBadge(conversation.contactType);

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full ${conversation.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}
        >
          {conversation.contactInitials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-slate-900 text-sm truncate">
              {conversation.contactName}
            </h3>
            <span className="text-xs text-slate-400 ml-2 shrink-0">
              {formatConversationTime(conversation.timestamp)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-600">{conversation.orderId}</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${badgeColors.bg} ${badgeColors.text}`}
            >
              {conversation.contactType}
            </span>
          </div>

          <p className="text-sm text-slate-600 truncate">{conversation.lastMessage}</p>

          {conversation.orderStatus && conversation.orderStatus !== conversation.contactType && (
            <div className="mt-1">
              <span className="text-xs text-green-600 font-medium">● {conversation.orderStatus}</span>
            </div>
          )}
        </div>

        {conversation.unreadCount > 0 && (
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {conversation.unreadCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
