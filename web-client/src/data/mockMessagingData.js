// data/mockMessagingData.js
import { ContactType, MessageSender } from '../constants/messaging.constants';

export const mockConversations = [
  {
    id: 'conv-1',
    contactName: 'Jose Manalo',
    contactInitials: 'JM',
    contactType: ContactType.RIDER,
    orderId: '#ORD-1023',
    orderStatus: 'On Delivery',
    lastMessage: "Copy that. I'm nearby. Picking it up in 5 minutes.",
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    unreadCount: 0,
    isActive: true,
    avatarColor: 'bg-gray-400',
  },
  {
    id: 'conv-2',
    contactName: 'Maria Santos',
    contactInitials: 'MS',
    contactType: ContactType.CUSTOMER,
    orderId: '#ORD-1024',
    orderStatus: 'On Delivery',
    lastMessage: 'Can I pay via GCash instead?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    unreadCount: 0,
    isActive: true,
    avatarColor: 'bg-purple-500',
  },
  {
    id: 'conv-3',
    contactName: 'Vic Sotto',
    contactInitials: 'VS',
    contactType: ContactType.RIDER,
    orderId: '#ORD-1020',
    orderStatus: 'Delivery completed',
    lastMessage: 'Delivery completed.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
    unreadCount: 0,
    isActive: false,
    avatarColor: 'bg-blue-400',
  },
  {
    id: 'conv-4',
    contactName: 'Ana Reyes',
    contactInitials: 'AR',
    contactType: ContactType.CUSTOMER,
    orderId: '#ORD-1022',
    orderStatus: 'CUSTOMER',
    lastMessage: 'Thank you for the fast service!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    unreadCount: 0,
    isActive: false,
    avatarColor: 'bg-orange-500',
  },
];

export const mockMessages = {
  'conv-1': [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      content: 'Hi Jose, Order #ORD-1023 is ready for pickup. Its 2 Gallons for Green Village.',
      sender: MessageSender.STAFF,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isSystemMessage: false,
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      content: 'Order Status updated: Out for Delivery',
      sender: MessageSender.SYSTEM,
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      isSystemMessage: true,
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      content: "Copy that. I'm nearby. Picking it up in 5 minutes.",
      sender: MessageSender.RIDER,
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      isSystemMessage: false,
    },
    {
      id: 'msg-4',
      conversationId: 'conv-1',
      content: 'Noted. I have change. Just arriving at the gate now.',
      sender: MessageSender.RIDER,
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      isSystemMessage: false,
    },
    {
      id: 'msg-5',
      conversationId: 'conv-1',
      content: 'Customer noted they only have large bills. Please bring change for 1000 if possible.',
      sender: MessageSender.STAFF,
      timestamp: new Date(Date.now() - 1000 * 60 * 12),
      isSystemMessage: false,
    },
    {
      id: 'msg-6',
      conversationId: 'conv-1',
      content: 'Found the address. Unlocking now.',
      sender: MessageSender.RIDER,
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      isSystemMessage: false,
    },
  ],
  'conv-2': [
    {
      id: 'msg-7',
      conversationId: 'conv-2',
      content: 'Can I pay via GCash instead?',
      sender: MessageSender.CUSTOMER,
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      isSystemMessage: false,
    },
  ],
  'conv-3': [
    {
      id: 'msg-8',
      conversationId: 'conv-3',
      content: 'Delivery completed.',
      sender: MessageSender.RIDER,
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      isSystemMessage: false,
    },
  ],
  'conv-4': [
    {
      id: 'msg-9',
      conversationId: 'conv-4',
      content: 'Thank you for the fast service!',
      sender: MessageSender.CUSTOMER,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      isSystemMessage: false,
    },
  ],
};
