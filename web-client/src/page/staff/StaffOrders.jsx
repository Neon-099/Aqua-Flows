// page/staff/StaffOrders.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  ClipboardList,
  MessageSquare,
  Bell,
} from 'lucide-react';
import OrderCard from '../../components/OrderCard';
import AssignRiderPanel from '../../components/AssignRiderPanel';
import { OrderStatus, RiderStatus } from '../../constants/staff.constants';
import { apiRequest } from '../../utils/api';
import { formatOrderId, getInitials } from '../../utils/staffFormatters';

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState(new Set());
  const [selectedAssignIds, setSelectedAssignIds] = useState(new Set());
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Auto-decrement timer for pending orders
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.timeRemaining && order.timeRemaining > 0) {
            return { ...order, timeRemaining: order.timeRemaining - 1 };
          }
          return order;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError('');

        const [ordersRes, ridersRes] = await Promise.all([
          apiRequest('/orders'),
          apiRequest('/riders'),
        ]);

        const mappedOrders = (ordersRes?.data || []).map((order) => ({
          id: order._id,
          orderId: formatOrderId(String(order._id).slice(-4)),
          customerName: order.customer_name || (order.customer_id ? `Customer ${String(order.customer_id).slice(-4)}` : 'Customer'),
          address: order.customer_address || 'Address unavailable',
          gallons: order.water_quantity,
          gallonType: order.gallon_type,
          paymentMethod: order.payment_method,
          status: order.status,
          autoAccepted: Boolean(order.auto_accepted),
          timeRemaining: null,
          createdAt: order.created_at,
        }));

        const mappedRiders = (ridersRes?.data || []).map((rider) => {
          const name = rider?.user?.name || `Rider ${String(rider._id).slice(-4)}`;
          return {
            id: rider._id,
            name,
            initials: getInitials(name),
            status: rider.status === 'active' ? RiderStatus.AVAILABLE : RiderStatus.OFFLINE,
            avatarColor: rider.status === 'active' ? 'bg-blue-500' : 'bg-gray-400',
            currentOrders: rider.activeOrdersCount || 0,
          };
        });

        setOrders(mappedOrders);
        setRiders(mappedRiders);
      } catch (err) {
        setLoadError(err?.message || 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await apiRequest(`/orders/${orderId}/confirm`, 'PUT');
      const updated = res?.data;
      if (updated) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: updated.status,
                  timeRemaining: null,
                  autoAccepted: Boolean(updated.auto_accepted),
                }
              : order
          )
        );
      }
      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    } catch (err) {
      setAssignError(err?.message || 'Failed to accept order');
    }
  };

  const handleCloseAssignPanel = () => {
    setShowAssignPanel(false);
  };

  const handleAssignRider = async (riderId) => {
    const rider = riders.find((r) => r.id === riderId);
    const selectedIds = Array.from(selectedAssignIds);

    if (rider && selectedIds.length > 0) {
      try {
        const results = await Promise.all(
          selectedIds.map((orderId) =>
            apiRequest(`/orders/${orderId}/assign_rider`, 'PUT', { rider_id: riderId })
              .then((res) => ({ ok: true, orderId, data: res?.data }))
              .catch((error) => ({ ok: false, orderId, error }))
          )
        );

        setOrders((prevOrders) =>
          prevOrders.map((o) => {
            const match = results.find((r) => r.ok && r.orderId === o.id);
            if (!match) return o;
            return {
              ...o,
              status: match.data?.status || o.status,
              timeRemaining: null,
              assignedRider: rider.name,
            };
          })
        );

        const failed = results.find((r) => !r.ok);
        setAssignError(failed ? (failed.error?.message || 'Failed to assign some orders') : '');
        setSelectedAssignIds(new Set());
        handleCloseAssignPanel();
      } catch (err) {
        setAssignError(err?.message || 'Failed to assign rider');
      }
    }
  };

  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING);
  const confirmedOrders = orders.filter((o) => o.status === OrderStatus.CONFIRMED);
  const pendingOrdersCount = pendingOrders.length;
  const selectedAssignGallons = orders.reduce(
    (total, order) => (selectedAssignIds.has(order.id) ? total + order.gallons : total),
    0
  );
  const getGallonsForSet = (idSet) =>
    orders.reduce((total, order) => (idSet.has(order.id) ? total + order.gallons : total), 0);

  const togglePendingSelect = (orderId) => {
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleAssignSelect = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setSelectedAssignIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
        setAssignError('');
        return next;
      }

      const nextTotalGallons = getGallonsForSet(next) + order.gallons;
      if (nextTotalGallons > 30) {
        setAssignError('Selection exceeds 30 gallons. Adjust your selection.');
        return next;
      }

      setAssignError('');
      next.add(orderId);
      return next;
    });
  };

  const handleSelectAllPending = () => {
    setSelectedPendingIds(new Set(pendingOrders.map((o) => o.id)));
  };

  const handleClearPendingSelection = () => {
    setSelectedPendingIds(new Set());
  };

  const handleSelectAllAssign = () => {
    let total = 0;
    const next = new Set();
    confirmedOrders.forEach((order) => {
      if (total + order.gallons <= 30) {
        total += order.gallons;
        next.add(order.id);
      }
    });
    setSelectedAssignIds(next);
    setAssignError(total === 0 ? 'No eligible orders within 30 gallons.' : '');
  };

  const handleClearAssignSelection = () => {
    setSelectedAssignIds(new Set());
    setAssignError('');
  };

  const handleAcceptSelected = async () => {
    if (selectedPendingIds.size === 0) return;
    const ids = Array.from(selectedPendingIds);
    try {
      await Promise.all(
        ids.map((orderId) => apiRequest(`/orders/${orderId}/confirm`, 'PUT'))
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          selectedPendingIds.has(order.id)
            ? { ...order, status: OrderStatus.CONFIRMED, timeRemaining: null }
            : order
        )
      );
      setSelectedPendingIds(new Set());
    } catch (err) {
      setAssignError(err?.message || 'Failed to accept selected orders');
    }
  };

  const handleOpenAssignPanel = (orderId) => {
    if (!orderId) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== OrderStatus.CONFIRMED) return;

    if (order.gallons > 30) {
      setAssignError('Order exceeds 30 gallons and cannot be assigned in bulk.');
      return;
    }

    setSelectedAssignIds(new Set([orderId]));
    setAssignError('');
    setShowAssignPanel(true);
  };

  const handleAssignSelected = () => {
    if (selectedAssignIds.size === 0) {
      setAssignError('Select at least one order to assign.');
      return;
    }
    setShowAssignPanel(true);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-12 py-4 bg-white border-b border-slate-100 shrink-0 w-full">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow Manager</span>
        </div>

        <div className="hidden md:flex gap-4">
          <Link to="/staff/orders">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
              <ClipboardList size={18} /> Orders
            </button>
          </Link>
          <Link to="/staff/messages">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <MessageSquare size={18} /> Messages
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">Juan Dela Cruz</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">
              Staff Operator
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white font-bold">
            JD
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* Gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">Incoming Orders</h1>
              {pendingOrdersCount > 0 && (
                <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-bold">
                  {pendingOrdersCount}
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500">Updated just now</p>
            {loadError && (
              <p className="text-xs text-rose-600 mt-2">{loadError}</p>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders Section - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="mb-4 space-y-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Pending Orders</h2>
                    <p className="text-xs text-slate-500">
                      Select pending orders and accept in bulk.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleSelectAllPending}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Select All Pending
                    </button>
                    <button
                      onClick={handleClearPendingSelection}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleAcceptSelected}
                      disabled={selectedPendingIds.size === 0}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      Accept Selected ({selectedPendingIds.size})
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Assign Rider</h2>
                    <p className="text-xs text-slate-500">
                      Select confirmed orders up to 30 gallons total.
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      Selected: {selectedAssignIds.size} orders · {selectedAssignGallons} gallons
                    </p>
                    {assignError && (
                      <p className="text-xs text-red-600 mt-1">{assignError}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleSelectAllAssign}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Select Up To 30 Gallons
                    </button>
                    <button
                      onClick={handleClearAssignSelection}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleAssignSelected}
                      disabled={selectedAssignIds.size === 0}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      Assign Selected
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isSelected={selectedPendingIds.has(order.id) || selectedAssignIds.has(order.id)}
                    isSelectable={
                      order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED
                    }
                    isChecked={
                      order.status === OrderStatus.PENDING
                        ? selectedPendingIds.has(order.id)
                        : selectedAssignIds.has(order.id)
                    }
                    selectionLabel={
                      order.status === OrderStatus.PENDING ? 'Select to accept' : 'Select to assign'
                    }
                    onToggleSelect={
                      order.status === OrderStatus.PENDING ? togglePendingSelect : toggleAssignSelect
                    }
                    onAccept={handleAcceptOrder}
                    onAssignRider={handleOpenAssignPanel}
                  />
                ))}
              </div>

              {orders.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                  <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">No orders at the moment</p>
                </div>
              )}
            </div>

            {/* Assign Rider Panel - Takes 1 column */}
            <div className="lg:col-span-1">
                <div className="sticky top-6">
                  {showAssignPanel ? (
                    <AssignRiderPanel
                      riders={riders}
                      onAssign={handleAssignRider}
                      onCancel={handleCloseAssignPanel}
                      selectedCount={selectedAssignIds.size}
                      totalGallons={selectedAssignGallons}
                    />
                  ) : (
                    <div className="bg-white/50 rounded-2xl p-12 text-center border border-slate-200 backdrop-blur-sm">
                      <Bell size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium text-sm">
                        Select orders to assign a rider
                      </p>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffOrders;
