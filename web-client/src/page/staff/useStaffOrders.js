import { useEffect, useRef, useState } from 'react';
import { OrderStatus, RiderStatus } from '../../constants/staff.constants';
import { apiRequest } from '../../utils/api';
import { formatOrderId, getInitials } from '../../utils/staffFormatters';

const ORDERS_PER_PAGE = 6;
const AUTO_ASSIGN_WEIGHTS = { load: 0.5, orders: 0.4, capacity: 0.1, distance: 0.0 };

const useStaffOrders = () => {
  const isMountedRef = useRef(true);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState(new Set());
  const [selectedAssignIds, setSelectedAssignIds] = useState(new Set());
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dispatchMinutesById, setDispatchMinutesById] = useState({});
  const [bulkDispatchMinutes, setBulkDispatchMinutes] = useState('');
  const [now, setNow] = useState(Date.now());
  const dispatchingRef = useRef(new Set());
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
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      dispatchQueuedAt: order.dispatch_queued_at || null,
      dispatchAfterMinutes: order.dispatch_after_minutes || null,
      dispatchScheduledFor: order.dispatch_scheduled_for || null,
      dispatchedAt: order.dispatched_at || null,
      timeRemaining: null,
      createdAt: order.created_at,
    }));

  const mapRiders = (ridersRes) =>
    (ridersRes?.data || []).map((rider) => {
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

  const refreshOrders = async () => {
    const [ordersRes, ridersRes] = await Promise.all([
      apiRequest('/staff/orders'),
      apiRequest('/riders'),
    ]);
    if (!isMountedRef.current) return;
    setOrders(mapOrders(ordersRes));
    setRiders(mapRiders(ridersRes));
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError('');

        await refreshOrders();
      } catch (err) {
        if (!isMounted) return;
        setLoadError(err?.message || 'Failed to load orders');
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
            ? { ...order, status: OrderStatus.CONFIRMED, timeRemaining: null }
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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitForTask = async (taskId, timeoutMs = 15000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const res = await apiRequest(`/tasks/${taskId}`);
      const status = res?.data?.status;
      if (status === 'done') return res?.data;
      if (status === 'failed') {
        throw new Error(res?.data?.error || 'Task failed');
      }
      await sleep(500);
    }
    throw new Error('Task timed out');
  };

  const handleAssignRider = async (riderId) => {
    const rider = riders.find((r) => r.id === riderId);
    const selectedIds = Array.from(selectedAssignIds);

    if (rider && selectedIds.length > 0) {
      let snapshot = null;
      try {
        setOrders((prev) => {
          snapshot = prev;
          return prev.map((o) =>
            selectedAssignIds.has(o.id)
              ? { ...o, assignedRiderId: rider.id, assignedRider: rider.name }
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

        const taskIds = results.map((r) => r.taskId).filter(Boolean);
        if (taskIds.length > 0) {
          try {
            await Promise.all(taskIds.map((taskId) => waitForTask(taskId)));
          } catch (err) {
            setAssignError(err?.message || 'Some assignments failed');
          }
        }

        await refreshOrders();

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
            ? { ...order, status: OrderStatus.CONFIRMED, timeRemaining: null }
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

  const getDispatchRemaining = (order) => {
    if (!order.dispatchScheduledFor) return null;
    const target = new Date(order.dispatchScheduledFor).getTime();
    const diff = Math.max(0, Math.ceil((target - now) / 1000));
    return diff;
  };

  const getNextDispatchCountdown = () => {
    const withSchedule = pickedUpOrders
      .map((o) => ({ id: o.id, remaining: getDispatchRemaining(o) }))
      .filter((o) => Number.isFinite(o.remaining));
    if (withSchedule.length === 0) return null;
    return Math.min(...withSchedule.map((o) => o.remaining));
  };

  const handleQueueDispatch = async (orderId) => {
    const minutes = Number(dispatchMinutesById[orderId] || 0);
    if (!minutes || minutes <= 0) {
      setAssignError('Enter dispatch minutes greater than 0.');
      return;
    }
    let snapshot = null;
    try {
      const nowTime = new Date();
      const scheduledFor = new Date(nowTime.getTime() + minutes * 60 * 1000);
      setOrders((prev) => {
        snapshot = prev;
        return prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                dispatchQueuedAt: nowTime.toISOString(),
                dispatchAfterMinutes: minutes,
                dispatchScheduledFor: scheduledFor.toISOString(),
              }
            : o
        );
      });
      const res = await apiRequest(`/orders/${orderId}/queue_dispatch`, 'PUT', { minutes });
      const updated = res?.data;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                dispatchQueuedAt: updated?.dispatch_queued_at || o.dispatchQueuedAt,
                dispatchAfterMinutes: updated?.dispatch_after_minutes || o.dispatchAfterMinutes,
                dispatchScheduledFor: updated?.dispatch_scheduled_for || o.dispatchScheduledFor,
              }
            : o
        )
      );
      setAssignError('');
    } catch (err) {
      if (snapshot) setOrders(snapshot);
      setAssignError(err?.message || 'Failed to queue dispatch');
    }
  };

  const handleQueueDispatchBulk = async () => {
    const minutes = Number(bulkDispatchMinutes || 0);
    if (!minutes || minutes <= 0) {
      setAssignError('Enter dispatch minutes greater than 0.');
      return;
    }
    const targets = pickedUpOrders.map((o) => o.id);
    if (targets.length === 0) return;
    try {
      await Promise.all(targets.map((orderId) => handleQueueDispatch(orderId)));
      setAssignError('');
    } catch (err) {
      setAssignError(err?.message || 'Failed to queue dispatch');
    }
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
      setAssignError(err?.message || 'Failed to dispatch order');
    }
  };

  useEffect(() => {
    const dueOrders = orders.filter(
      (o) =>
        o.status === OrderStatus.PICKED_UP &&
        o.dispatchScheduledFor &&
        getDispatchRemaining(o) === 0
    );

    dueOrders.forEach((order) => {
      if (dispatchingRef.current.has(order.id)) return;
      dispatchingRef.current.add(order.id);
      handleDispatchNow(order.id).finally(() => {
        dispatchingRef.current.delete(order.id);
      });
    });
  }, [orders, now]);

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
    loadError,
    dispatchMinutesById,
    setDispatchMinutesById,
    bulkDispatchMinutes,
    setBulkDispatchMinutes,
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
    getNextDispatchCountdown,
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
    handleQueueDispatch,
    handleQueueDispatchBulk,
    handleDispatchNowBulk,
    handleDispatchNow,
  };
};

export default useStaffOrders;
