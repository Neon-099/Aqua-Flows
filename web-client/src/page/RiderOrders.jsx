// page/RiderOrders.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  ClipboardList,
  MessageSquare,
  Package,
} from 'lucide-react';
import RiderOrderCard from '../components/RiderOrderCard';
import { OrderStatus } from '../constants/staff.constants';
import { apiRequest } from '../utils/api';
import { formatOrderId } from '../utils/staffFormatters';

const RiderOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedPickupIds, setSelectedPickupIds] = useState(new Set());
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoadError('');
        const res = await apiRequest('/orders');
        const mappedOrders = (res?.data || []).map((order) => ({
          id: order._id,
          orderId: formatOrderId(String(order._id).slice(-4)),
          customerName: order.customer_name || (order.customer_id ? `Customer ${String(order.customer_id).slice(-4)}` : 'Customer'),
          address: order.customer_address || 'Address unavailable',
          gallons: order.water_quantity,
          gallonType: order.gallon_type,
          paymentMethod: order.payment_method,
          totalAmount: order.total_amount,
          status: order.status,
          eta: order.eta_text || null,
          createdAt: order.created_at,
        }));
        setOrders(mappedOrders);
      } catch (err) {
        setLoadError(err?.message || 'Failed to load orders');
      }
    };

    loadOrders();
  }, []);

  const handleAction = async (orderId, actionType) => {
    try {
      let endpoint = null;
      switch (actionType) {
        case 'confirmPickup':
          endpoint = `/orders/${orderId}/confirm`;
          break;
        case 'startDelivery':
          endpoint = `/orders/${orderId}/start_delivery`;
          break;
        case 'markDelivered':
          endpoint = `/orders/${orderId}/mark_delivered`;
          break;
        case 'confirmPayment':
          endpoint = `/orders/${orderId}/confirm_payment`;
          break;
        case 'cancelPickup':
          endpoint = `/orders/${orderId}/cancel_pickup`;
          break;
        default:
          break;
      }

      if (!endpoint) return;
      const res = await apiRequest(endpoint, 'PUT');
      const updated = res?.data;

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id !== orderId) return order;
          return { ...order, status: updated?.status || order.status };
        })
      );

      if (actionType === 'startDelivery') {
        setSelectedPickupIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    } catch (err) {
      setLoadError(err?.message || 'Failed to update order');
    }
  };

  const activeOrders = orders.filter(
    (o) => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED
  );
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);
  const pickupOrders = activeOrders.filter((o) => o.status === OrderStatus.PICKUP);
  const allOutForDelivery =
    activeOrders.length > 0 && activeOrders.every((o) => o.status === OrderStatus.OUT_FOR_DELIVERY);

  const togglePickupSelect = (orderId) => {
    setSelectedPickupIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleSelectAllPickup = () => {
    setSelectedPickupIds(new Set(pickupOrders.map((o) => o.id)));
  };

  const handleClearPickupSelection = () => {
    setSelectedPickupIds(new Set());
  };

  const handleStartDeliverySelected = () => {
    if (selectedPickupIds.size === 0) return;
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        selectedPickupIds.has(order.id)
          ? { ...order, status: OrderStatus.OUT_FOR_DELIVERY }
          : order
      )
    );
    setSelectedPickupIds(new Set());
  };

  const ordersByEta = activeOrders.reduce((groups, order) => {
    const key = order.eta || 'ETA pending';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(order);
    return groups;
  }, {});
  const etaKeys = Object.keys(ordersByEta);

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-12 py-4 bg-white border-b border-slate-100 shrink-0 w-full">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow Rider</span>
        </div>

        <div className="hidden md:flex gap-4">
          <Link to="/rider/orders">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
              <ClipboardList size={18} /> My Orders
            </button>
          </Link>
          <Link to="/rider/messages">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <MessageSquare size={18} /> Messages
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">Jose Manalo</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">
              Rider
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-white shadow-md flex items-center justify-center text-white font-bold">
            JM
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* Gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-8">
          {/* Active Orders Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-slate-900">Active Orders</h1>
              {activeOrders.length > 0 && (
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                  {activeOrders.length}
                </div>
              )}
            </div>
            {loadError && (
              <p className="text-xs text-rose-600 mb-4">{loadError}</p>
            )}

            {pickupOrders.length > 0 && (
              <div className="mb-4 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Start Delivery</h2>
                  <p className="text-xs text-slate-500">
                    Select pickup orders to start delivery in bulk.
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    Selected: {selectedPickupIds.size} orders
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAllPickup}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Select All Pickup
                  </button>
                  <button
                    onClick={handleClearPickupSelection}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleStartDeliverySelected}
                    disabled={selectedPickupIds.size === 0}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    Start Delivery Selected
                  </button>
                </div>
              </div>
            )}

            {activeOrders.length > 0 ? (
              <>
                {allOutForDelivery ? (
                  <div className="space-y-6">
                    {etaKeys.map((etaKey) => (
                      <div key={etaKey}>
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-lg font-bold text-slate-900">ETA: {etaKey}</h2>
                          <span className="text-xs font-semibold text-slate-500">
                            {ordersByEta[etaKey].length} orders
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {ordersByEta[etaKey].map((order) => (
                            <RiderOrderCard key={order.id} order={order} onAction={handleAction} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeOrders.map((order) => (
                      <RiderOrderCard
                        key={order.id}
                        order={order}
                        onAction={handleAction}
                        isSelectable={order.status === OrderStatus.PICKUP}
                        isChecked={selectedPickupIds.has(order.id)}
                        selectionLabel="Select to start"
                        onToggleSelect={togglePickupSelect}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Package size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No active orders at the moment</p>
              </div>
            )}
          </div>

          {/* Completed Orders Section */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Completed Today</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedOrders.map((order) => (
                  <RiderOrderCard key={order.id} order={order} onAction={handleAction} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RiderOrders;
