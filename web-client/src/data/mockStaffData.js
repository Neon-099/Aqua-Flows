// data/mockStaffData.js
import { OrderStatus, RiderStatus, PaymentMethod } from '../constants/staff.constants';

export const mockOrders = [
  {
    id: '1024',
    orderId: '#ORD-1024',
    customerName: 'Maria Santos',
    address: '123 Acacia Ave, Brgy. San Jose',
    gallons: 4,
    gallonType: 'ROUND',
    paymentMethod: PaymentMethod.COD,
    status: OrderStatus.PENDING,
    autoAccepted: false,
    timeRemaining: 41, // seconds
    createdAt: new Date().toISOString(),
  },
  {
    id: '1023',
    orderId: '#ORD-1023',
    customerName: 'Pedro Penduko',
    address: '45 Narra St, Green Village',
    gallons: 2,
    gallonType: 'SLIM',
    paymentMethod: PaymentMethod.GCASH,
    status: OrderStatus.CONFIRMED,
    autoAccepted: true,
    timeRemaining: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: '1022',
    orderId: '#ORD-1022',
    customerName: 'Ana Reyes',
    address: '789 Pine Rd, Phase 2',
    gallons: 5,
    gallonType: 'ROUND',
    paymentMethod: PaymentMethod.COD,
    status: OrderStatus.CONFIRMED,
    autoAccepted: false,
    timeRemaining: null,
    createdAt: new Date().toISOString(),
  },
];

export const mockRiders = [
  {
    id: 'rider-1',
    name: 'Jose Manalo',
    initials: 'JM',
    status: RiderStatus.AVAILABLE,
    avatarColor: 'bg-gray-400',
    currentOrders: 0,
  },
  {
    id: 'rider-2',
    name: 'Mark Lee',
    initials: 'ML',
    status: RiderStatus.AVAILABLE,
    avatarColor: 'bg-purple-500',
    currentOrders: 0,
  },
  {
    id: 'rider-3',
    name: 'Vic Sotto',
    initials: 'VS',
    status: RiderStatus.ON_DELIVERY,
    avatarColor: 'bg-blue-400',
    currentOrders: 2,
  },
  {
    id: 'rider-4',
    name: 'Joey De Leon',
    initials: 'JD',
    status: RiderStatus.ON_DELIVERY,
    avatarColor: 'bg-purple-500',
    currentOrders: 1,
  },
];
