import { useEffect, useRef, useState } from 'react';
import { OrderStatus, RiderStatus } from '../../constants/staff.constants';
import { apiRequest } from '../../utils/api';
import { formatOrderId, getInitials } from '../../utils/staffFormatters';

const ORDERS_PER_PAGE = 6;
const AUTO_ASSIGN_WEIGHTS = { load: 0.5, orders: 0.4, capacity: 0.1, distance: 0.0 };
const CACHE_KEY = 'staffOrdersCache_v1';
const CACHE_TTL_MS = 60 * 1000;

const useStaffOrders = () => {
  const isMountedRef = useRef(true);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState(new Set());
  const [selectedAssignIds, setSelectedAssignIds] = useState(new Set());
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [cancelOrderId, setCancelOrderId] = useState('');
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [ordersError, setOrdersError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewCandidates, setPreviewCandidates] = useState([]);
  const [previewOrderId, setPreviewOrderId] = useState(null);
  const [pageByStatus, setPageByStatus] = useState({
    pending: 1,
    assignable: 1,
    assigned: 1,
    pickedUp: 1,
    outForDelivery: 1,
    delivered: 1,
    pendingPayment: 1,
    completed: 1,
    cancelled: 1,
  });

  const getAcceptErrorMessage = (err) => {
    const raw = String(err?.message || '');
    if (raw.includes('NO_AVAILABLE_RIDER_CAPACITY')) {
      return 'Cannot accept order right now. No active rider has enough remaining gallon capacity.';
    }
    return raw || 'Failed to accept order';
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed?.data || !parsed?.timestamp) return;
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return;
      const cachedOrders = parsed?.data?.orders || [];
      const cachedRiders = parsed?.data?.riders || [];
      if (cachedOrders.length) setOrders(cachedOrders);
      if (cachedRiders.length) setRiders(cachedRiders);
    } catch {
      // ignore cache errors
    }
  }, []);

  const mapOrders = (ordersRes) =>
    (ordersRes?.data || []).map((order) => ({
      id: order._id,
      orderId: order.order_code || formatOrderId(String(order._id).slice(-4)),
      customerName: order.customer_name || (order.customer_id ? `Customer ${String(order.customer_id).slice(-4)}` : 'Customer'),
      address: order.customer_address || 'Address unavailable',
      gallons: order.water_quantity,
      gallonType: order.gallon_type,
      paymentMethod: order.payment_method,
      status: order.status,
      assignedRiderId: order.assigned_rider_id || null,
      assignedRider: order.assigned_rider_name || null,
      autoAccepted: Boolean(order.auto_accepted),
      dispatchedAt: order.dispatched_at || null,
      createdAt: order.created_at,
    }));

  const mapRiders = (ridersRes) =>
    (ridersRes?.data || []).map((rider) => {
      const name = rider?.user?.name || `Rider ${String(rider._id).slice(-4)}`;
      const maxCapacity = Number(rider.maxCapacityGallons ?? 0);
      const currentLoad = Number(rider.currentLoadGallons ?? 0);
      const remaining = Math.max(0, maxCapacity - currentLoad);
      return {
        id: rider._id,
        name,
        initials: getInitials(name),
        status: rider.status === 'active' ? RiderStatus.AVAILABLE : RiderStatus.OFFLINE,
        avatarColor: rider.status === 'active' ? 'bg-blue-500' : 'bg-gray-400',
        currentOrders: rider.activeOrdersCount || 0,
        maxCapacityGallons: maxCapacity,
        currentLoadGallons: currentLoad,
        remainingCapacityGallons: remaining,
        isAtCapacity: maxCapacity > 0 && currentLoad >= maxCapacity,
      };
    });

  const refreshOrders = async () => {
    setIsRefreshing(true);
    try {
      const [ordersRes, ridersRes] = await Promise.all([
        apiRequest('/staff/orders'),
        apiRequest('/riders'),
      ]);
      if (!isMountedRef.current) return;
      const nextOrders = mapOrders(ordersRes);
      const nextRiders = mapRiders(ridersRes);
      setOrders(nextOrders);
      setRiders(nextRiders);
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: { orders: nextOrders, riders: nextRiders },
          })
        );
      } catch {
        // ignore cache errors
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError('');

        await refreshOrders();
      } catch (err) {
        if (!isMounted) return;
        console.error('[StaffOrders] load error', err);
        const status = err?.status ? ` (${err.status})` : '';
        setLoadError(`${err?.message || 'Failed to load orders'}${status}`);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleAcceptOrder = async (orderId) => {
    let snapshot = null;
    try {
      setOrders((prev) => {
        snapshot = prev;
        return prev.map((order) =>
          order.id === orderId
            ? { ...order, status: OrderStatus.CONFIRMED }
            : order
        );
      });
      const res = await apiRequest(`/orders/${orderId}/confirm`, 'PUT');
      const updated = res?.data;
      if (updated) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: updated.status,
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
      if (snapshot) setOrders(snapshot);
      setAssignError(getAcceptErrorMessage(err));
    }
  };

  const handleCancelOrder = (order) => {
    setCancelTargetOrder(order);
  };

  const confirmCancelOrder = async () => {
    if (!cancelTargetOrder?.id) return;

    const orderId = cancelTargetOrder.id;
    setOrdersError('');
    setCancelOrderId(orderId);

    try {
      const res = await apiRequest(`/orders/${orderId}/cancel`, 'PUT');
      const updated = res?.data;
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: updated?.status || OrderStatus.CANCELLED,
              }
            : order
        )
      );
      setCancelTargetOrder(null);
    } catch (err) {
      setOrdersError(err?.message || 'Failed to cancel order');
    } finally {
      setCancelOrderId('');
    }
  };

  const closeCancelModal = () => {
    if (cancelOrderId) return;
    setCancelTargetOrder(null);
  };

  const handleCloseAssignPanel = () => {
    setShowAssignPanel(false);
  };

  const handleAssignRider = async (riderId) => {
    const rider = riders.find((r) => r.id === riderId);
    const selectedIds = Array.from(selectedAssignIds);

    if (rider && selectedIds.length > 0) {
      if (rider.isAtCapacity) {
        setAssignError(`Cannot assign: ${rider.name} is already at max capacity.`);
        return;
      }
      let snapshot = null;
      try {
        setOrders((prev) => {
          snapshot = prev;
          return prev.map((o) =>
            selectedAssignIds.has(o.id)
              ? { ...o, assignedRiderId: rider.id, assignedRider: rider.name, status: 'QUEUED' }
              : o
          );
        });
        const results = await Promise.all(
          selectedIds.map((orderId) =>
            apiRequest(`/orders/${orderId}/assign_rider`, 'PUT', { rider_id: riderId })
              .then((res) => ({ ok: true, orderId, taskId: res?.taskId }))
              .catch((error) => ({ ok: false, orderId, error }))
          )
        );

        const failedRequest = results.find((r) => !r.ok);
        if (failedRequest) {
          setAssignError(failedRequest.error?.message || 'Failed to queue some orders');
          if (snapshot) setOrders(snapshot);
          return;
        }
        // Do not block UI waiting for task completion. Refresh in background.
        refreshOrders();
        setTimeout(refreshOrders, 1500);
        setTimeout(refreshOrders, 5000);

        setSelectedAssignIds(new Set());
        handleCloseAssignPanel();
      } catch (err) {
        if (snapshot) setOrders(snapshot);
        setAssignError(err?.message || 'Failed to assign rider');
      }
    }
  };

  const previewEnabled = selectedAssignIds.size === 1;
  const previewTargetId = previewEnabled ? Array.from(selectedAssignIds)[0] : null;
  const recommended = previewCandidates?.[0] || null;

  useEffect(() => {
    if (!previewEnabled || previewOrderId !== previewTargetId) {
      setPreviewCandidates([]);
      setPreviewError('');
      setPreviewOrderId(previewTargetId);
    }
  }, [previewEnabled, previewOrderId, previewTargetId]);

  const handlePreviewRecommended = async () => {
    if (!previewTargetId) return;
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const res = await apiRequest(`/orders/${previewTargetId}/auto_assign_preview`, 'POST', {
        weights: AUTO_ASSIGN_WEIGHTS,
      });
      const data = res?.data;
      setPreviewCandidates(data?.candidates || []);
      setPreviewOrderId(previewTargetId);
    } catch (err) {
      setPreviewError(err?.message || 'Failed to preview auto-assign');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAssignRecommended = async () => {
    if (!previewTargetId) return;
    let snapshot = null;
    try {
      setOrders((prev) => {
        snapshot = prev;
        return prev.map((o) =>
          o.id === previewTargetId
            ? { ...o, assignedRiderId: recommended?._id || o.assignedRiderId, assignedRider: recommended?.name || o.assignedRider }
            : o
        );
      });
      const res = await apiRequest(`/orders/${previewTargetId}/auto_assign`, 'PUT', {
        weights: AUTO_ASSIGN_WEIGHTS,
      });
      const updated = res?.data?.order || res?.data;
      const assignedRiderName = res?.data?.rider?.name || recommended?.name;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === previewTargetId
            ? {
                ...o,
                assignedRiderId: updated?.assigned_rider_id || o.assignedRiderId,
                assignedRider: assignedRiderName || o.assignedRider,
                status: updated?.status || o.status,
              }
            : o
        )
      );
      setSelectedAssignIds(new Set());
      setShowAssignPanel(false);
      setPreviewCandidates([]);
      setPreviewError('');
    } catch (err) {
      if (snapshot) setOrders(snapshot);
      setAssignError(err?.message || 'Failed to auto-assign rider');
    }
  };

  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING);
  const confirmedOrders = orders.filter((o) => o.status === OrderStatus.CONFIRMED);
  const assignableOrders = confirmedOrders.filter((o) => !o.assignedRiderId);
  const assignedOrders = confirmedOrders.filter((o) => o.assignedRiderId);
  const pickedUpOrders = orders.filter((o) => o.status === OrderStatus.PICKED_UP);
  const outForDeliveryOrders = orders.filter((o) => o.status === OrderStatus.OUT_FOR_DELIVERY);
  const deliveredOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED);
  const pendingPaymentOrders = orders.filter((o) => o.status === OrderStatus.PENDING_PAYMENT);
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);
  const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED);
  const pendingOrdersCount = pendingOrders.length;
  const selectedAssignGallons = orders.reduce(
    (total, order) => (selectedAssignIds.has(order.id) ? total + order.gallons : total),
    0
  );
  const getGallonsForSet = (idSet) =>
    orders.reduce((total, order) => (idSet.has(order.id) ? total + order.gallons : total), 0);

  const getTotalPages = (items) => Math.max(1, Math.ceil(items.length / ORDERS_PER_PAGE));
  const getPageSlice = (items, page) => {
    const start = (page - 1) * ORDERS_PER_PAGE;
    return items.slice(start, start + ORDERS_PER_PAGE);
  };
  const setPageFor = (key, nextPage) => {
    setPageByStatus((prev) => ({ ...prev, [key]: nextPage }));
  };

  useEffect(() => {
    setPageByStatus((prev) => ({
      pending: Math.min(prev.pending, getTotalPages(pendingOrders)),
      assignable: Math.min(prev.assignable, getTotalPages(assignableOrders)),
      assigned: Math.min(prev.assigned, getTotalPages(assignedOrders)),
      pickedUp: Math.min(prev.pickedUp, getTotalPages(pickedUpOrders)),
      outForDelivery: Math.min(prev.outForDelivery, getTotalPages(outForDeliveryOrders)),
      delivered: Math.min(prev.delivered, getTotalPages(deliveredOrders)),
      pendingPayment: Math.min(prev.pendingPayment, getTotalPages(pendingPaymentOrders)),
      completed: Math.min(prev.completed, getTotalPages(completedOrders)),
      cancelled: Math.min(prev.cancelled, getTotalPages(cancelledOrders)),
    }));
  }, [
    pendingOrders.length,
    assignableOrders.length,
    assignedOrders.length,
    pickedUpOrders.length,
    outForDeliveryOrders.length,
    deliveredOrders.length,
    pendingPaymentOrders.length,
    completedOrders.length,
    cancelledOrders.length,
  ]);

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
    if (!order || order.assignedRiderId) return;

    setSelectedAssignIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
        setAssignError('');
        return next;
      }

      const nextTotalGallons = getGallonsForSet(next) + order.gallons;
      if (nextTotalGallons > 43) {
        setAssignError('Selection exceeds 43 gallons. Adjust your selection.');
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
    assignableOrders.forEach((order) => {
      if (total + order.gallons <= 43) {
        total += order.gallons;
        next.add(order.id);
      }
    });
    setSelectedAssignIds(next);
    setAssignError(total === 0 ? 'No eligible orders within 43 gallons.' : '');
  };

  const handleClearAssignSelection = () => {
    setSelectedAssignIds(new Set());
    setAssignError('');
  };

  const handleAcceptSelected = async () => {
    if (selectedPendingIds.size === 0) return;
    const ids = Array.from(selectedPendingIds);
    let snapshot = null;
    try {
      setOrders((prev) => {
        snapshot = prev;
        return prev.map((order) =>
          selectedPendingIds.has(order.id)
            ? { ...order, status: OrderStatus.CONFIRMED }
            : order
        );
      });
      await Promise.all(
        ids.map((orderId) => apiRequest(`/orders/${orderId}/confirm`, 'PUT'))
      );
      setSelectedPendingIds(new Set());
    } catch (err) {
      if (snapshot) setOrders(snapshot);
      setAssignError(getAcceptErrorMessage(err));
    }
  };

  const handleOpenAssignPanel = (orderId) => {
    if (!orderId) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== OrderStatus.CONFIRMED || order.assignedRiderId) return;

    if (order.gallons > 43) {
      setAssignError('Order exceeds 43 gallons and cannot be assigned in bulk.');
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

  const handleDispatchNowBulk = async () => {
    const targets = pickedUpOrders.map((o) => o.id);
    if (targets.length === 0) return;
    try {
      await Promise.all(targets.map((orderId) => handleDispatchNow(orderId)));
      setAssignError('');
    } catch (err) {
      setAssignError(err?.message || 'Failed to dispatch orders');
    }
  };

  const handleDispatchNow = async (orderId) => {
    const current = orders.find((o) => o.id === orderId);
    if (!current || current.status !== OrderStatus.PICKED_UP) return;
    let snapshot = null;
    try {
      setOrders((prev) => {
        snapshot = prev;
        return prev.map((o) =>
          o.id === orderId
            ? { ...o, status: OrderStatus.OUT_FOR_DELIVERY, dispatchedAt: new Date().toISOString() }
            : o
        );
      });
      const res = await apiRequest(`/orders/${orderId}/dispatch`, 'PUT');
      const updated = res?.data;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: updated?.status || o.status,
                dispatchedAt: updated?.dispatched_at || o.dispatchedAt,
              }
            : o
        )
      );
      setAssignError('');
    } catch (err) {
      if (snapshot) setOrders(snapshot);
      if (String(err?.message || '').includes('Order must be picked up')) {
        refreshOrders();
        return;
      }
      setAssignError(err?.message || 'Failed to dispatch order');
    }
  };

  return {
    ORDERS_PER_PAGE,
    autoAssignWeights: AUTO_ASSIGN_WEIGHTS,
    orders,
    riders,
    selectedPendingIds,
    selectedAssignIds,
    showAssignPanel,
    assignError,
    isLoading,
    isRefreshing,
    loadError,
    cancelOrderId,
    cancelTargetOrder,
    ordersError,
    previewLoading,
    previewError,
    previewEnabled,
    recommended,
    pageByStatus,
    pendingOrders,
    assignableOrders,
    assignedOrders,
    pickedUpOrders,
    outForDeliveryOrders,
    deliveredOrders,
    pendingPaymentOrders,
    completedOrders,
    cancelledOrders,
    pendingOrdersCount,
    selectedAssignGallons,
    getTotalPages,
    getPageSlice,
    setPageFor,
    handleAcceptOrder,
    handleCancelOrder,
    confirmCancelOrder,
    closeCancelModal,
    handleCloseAssignPanel,
    handleAssignRider,
    handlePreviewRecommended,
    handleAssignRecommended,
    togglePendingSelect,
    toggleAssignSelect,
    handleSelectAllPending,
    handleClearPendingSelection,
    handleSelectAllAssign,
    handleClearAssignSelection,
    handleAcceptSelected,
    handleOpenAssignPanel,
    handleAssignSelected,
    handleDispatchNowBulk,
    handleDispatchNow,
  };
};

export default useStaffOrders;
