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
import { useAuth } from '../contexts/AuthProvider';

const RiderOrders = () => {

  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [selectedConfirmIds, setSelectedConfirmIds] = useState(new Set());
  const [selectedDispatchIds, setSelectedDispatchIds] = useState(new Set());
  const [loadError, setLoadError] = useState('');
  const [acceptedOrderIds, setAcceptedOrderIds] = useState(new Set());

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      try {
        setLoadError('');
        const res = await apiRequest('/orders');
        const mappedOrders = (res?.data || []).map((order) => ({
          id: order._id,
          orderId: order.order_code || formatOrderId(String(order._id).slice(-4)),
          customerName: order.customer_name || (order.customer_id ? `Customer ${String(order.customer_id).slice(-4)}` : 'Customer'),
          address: order.customer_address || 'Address unavailable',
          gallons: order.water_quantity,
          gallonType: order.gallon_type,
          paymentMethod: order.payment_method,
          totalAmount: order.total_amount,
          status: order.status,
          assignedRiderId: order.assigned_rider_id,
          assignedToMe: Boolean(order.assigned_to_me),
          eta: order.eta_text || null,
          createdAt: order.created_at,
        }));
        if (isMounted) {
          setOrders(
            mappedOrders.map((order) =>
              acceptedOrderIds.has(order.id) && !order.assignedRiderId
                ? { ...order, assignedRiderId: 'self', assignedToMe: true }
                : order
            )
          );
        }
      } catch (err) {
        if (isMounted) setLoadError(err?.message || 'Failed to load orders');
      }
    };

    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [acceptedOrderIds]);

  const handleAction = async (orderId, actionType) => {
    try {
      let snapshot = null;
      const applyOptimistic = (updater) => {
        setOrders((prev) => {
          snapshot = prev;
          return updater(prev);
        });
      };

      let endpoint = null;
      switch (actionType) {
        case 'acceptOrder':
          endpoint = `/orders/${orderId}/confirm`;
          setAcceptedOrderIds((prev) => {
            const next = new Set(prev);
            next.add(orderId);
            return next;
          });
          applyOptimistic((prev) =>
            prev.map((order) =>
              order.id === orderId
                ? { ...order, status: OrderStatus.CONFIRMED, assignedRiderId: 'self', assignedToMe: true }
                : order
            )
          );
          break;
        case 'confirmPickup':
          endpoint = `/orders/${orderId}/pickup`;
          applyOptimistic((prev) =>
            prev.map((order) =>
              order.id === orderId ? { ...order, status: OrderStatus.PICKED_UP } : order
            )
          );
          break;
        case 'startDelivery':
          endpoint = `/orders/${orderId}/start_delivery`;
          applyOptimistic((prev) =>
            prev.map((order) =>
              order.id === orderId ? { ...order, status: OrderStatus.OUT_FOR_DELIVERY } : order
            )
          );
          break;
        case 'markDelivered':
          endpoint = `/orders/${orderId}/mark_delivered`;
          applyOptimistic((prev) =>
            prev.map((order) =>
              order.id === orderId ? { ...order, status: OrderStatus.DELIVERED } : order
            )
          );
          break;
        case 'confirmPayment':
          endpoint = `/orders/${orderId}/confirm_payment`;
          applyOptimistic((prev) =>
            prev.map((order) =>
              order.id === orderId ? { ...order, status: OrderStatus.COMPLETED } : order
            )
          );
          break;
        case 'cancelPickup':
          endpoint = `/orders/${orderId}/cancel_pickup`;
          applyOptimistic((prev) =>
            prev.map((order) =>
              order.id === orderId
                ? { ...order, status: OrderStatus.PENDING, assignedRiderId: null }
                : order
            )
          );
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
          return {
            ...order,
            status: updated?.status || order.status,
            assignedRiderId: updated?.assigned_rider_id ?? order.assignedRiderId,
            assignedToMe: updated?.assigned_to_me ?? order.assignedToMe,
          };
        })
      );
      if (updated?.assigned_rider_id) {
        setAcceptedOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }

      if (actionType === 'confirmPickup') {
        setSelectedConfirmIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
      if (actionType === 'startDelivery') {
        setSelectedDispatchIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    } catch (err) {
      if (snapshot) setOrders(snapshot);
      setAcceptedOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setLoadError(err?.message || 'Failed to update order');
    }
  };

  const availableOrders = orders.filter(
    (o) => o.status === OrderStatus.PENDING && !o.assignedRiderId
  );
  const activeOrders = orders.filter(
    (o) =>
      (o.assignedToMe || o.assignedRiderId || acceptedOrderIds.has(o.id)) &&
      o.status !== OrderStatus.COMPLETED &&
      o.status !== OrderStatus.CANCELLED
  );
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);
  const confirmedOrders = activeOrders.filter((o) => o.status === OrderStatus.CONFIRMED);
  const pickedUpOrders = activeOrders.filter((o) => o.status === OrderStatus.PICKED_UP);
  const allOutForDelivery =
    activeOrders.length > 0 && activeOrders.every((o) => o.status === OrderStatus.OUT_FOR_DELIVERY);

  const togglePickupSelect = (orderId) => {
    setSelectedConfirmIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleDispatchSelect = (orderId) => {
    setSelectedDispatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleSelectAllConfirm = () => {
    setSelectedConfirmIds(new Set(confirmedOrders.map((o) => o.id)));
  };

  const handleClearConfirmSelection = () => {
    setSelectedConfirmIds(new Set());
  };

  const handleSelectAllDispatch = () => {
    setSelectedDispatchIds(new Set(pickedUpOrders.map((o) => o.id)));
  };

  const handleClearDispatchSelection = () => {
    setSelectedDispatchIds(new Set());
  };

  const handleConfirmPickupSelected = async () => {
    if (selectedConfirmIds.size === 0) return;
    const ids = Array.from(selectedConfirmIds);
    let snapshot = null;
    setOrders((prev) => {
      snapshot = prev;
      return prev.map((order) =>
        selectedConfirmIds.has(order.id)
          ? { ...order, status: OrderStatus.PICKED_UP }
          : order
      );
    });
    try {
      await Promise.all(ids.map((id) => apiRequest(`/orders/${id}/pickup`, 'PUT')));
      setSelectedConfirmIds(new Set());
    } catch (err) {
      if (snapshot) setOrders(snapshot);
      setLoadError(err?.message || 'Failed to confirm pickup for selected orders');
    }
  };

  const handleStartDeliverySelected = async () => {
    if (selectedDispatchIds.size === 0) return;
    const ids = Array.from(selectedDispatchIds);
    let snapshot = null;
    setOrders((prev) => {
      snapshot = prev;
      return prev.map((order) =>
        selectedDispatchIds.has(order.id)
          ? { ...order, status: OrderStatus.OUT_FOR_DELIVERY }
          : order
      );
    });
    try {
      await Promise.all(ids.map((id) => apiRequest(`/orders/${id}/start_delivery`, 'PUT')));
      setSelectedDispatchIds(new Set());
    } catch (err) {
      if (snapshot) setOrders(snapshot);
      setLoadError(err?.message || 'Failed to start delivery for selected orders');
    }
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

  console.log('order rider: ', orders)

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
            <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">
              Rider
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-white shadow-md flex items-center justify-center text-white font-bold">
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* Gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-8">
          {/* Available Orders Section */}
          {availableOrders.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-slate-900">Available Orders</h1>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                  {availableOrders.length}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableOrders.map((order) => (
                  <RiderOrderCard key={order.id} order={order} onAction={handleAction} />
                ))}
              </div>
            </div>
          )}

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

            {confirmedOrders.length > 0 && (
              <div className="mb-4 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Confirm Pickup</h2>
                  <p className="text-xs text-slate-500">
                    Select confirmed orders to mark as picked up in bulk.
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    Selected: {selectedConfirmIds.size} orders
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAllConfirm}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Select All Confirmed
                  </button>
                  <button
                    onClick={handleClearConfirmSelection}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleConfirmPickupSelected}
                    disabled={selectedConfirmIds.size === 0}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    Confirm Pickup Selected
                  </button>
                </div>
              </div>
            )}

            {pickedUpOrders.length > 0 && (
              <div className="mb-4 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Start Delivery</h2>
                  <p className="text-xs text-slate-500">
                    Select picked up orders to start delivery in bulk.
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    Selected: {selectedDispatchIds.size} orders
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAllDispatch}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Select All Picked Up
                  </button>
                  <button
                    onClick={handleClearDispatchSelection}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleStartDeliverySelected}
                    disabled={selectedDispatchIds.size === 0}
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
                        isSelectable={
                          order.status === OrderStatus.CONFIRMED ||
                          order.status === OrderStatus.PICKED_UP
                        }
                        isChecked={
                          order.status === OrderStatus.CONFIRMED
                            ? selectedConfirmIds.has(order.id)
                            : selectedDispatchIds.has(order.id)
                        }
                        selectionLabel={
                          order.status === OrderStatus.CONFIRMED
                            ? 'Select to confirm pickup'
                            : 'Select to start'
                        }
                        onToggleSelect={
                          order.status === OrderStatus.CONFIRMED
                            ? togglePickupSelect
                            : toggleDispatchSelect
                        }
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
