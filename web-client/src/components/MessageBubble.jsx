// components/MessageBubble.jsx
import { formatMessageTime } from '../utils/messagingFormatters';
import { MessageSender } from '../constants/messaging.constants';

const MessageBubble = ({ message }) => {
  const isStaff = message.sender === MessageSender.STAFF;
  const isSystem = message.isSystemMessage || message.sender === MessageSender.SYSTEM;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-slate-100 rounded-full">
          <p className="text-xs text-slate-500 text-center">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isStaff ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-md ${isStaff ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isStaff
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-slate-800 rounded-bl-sm'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <span className="text-xs text-slate-400 mt-1 px-1">
          {formatMessageTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
