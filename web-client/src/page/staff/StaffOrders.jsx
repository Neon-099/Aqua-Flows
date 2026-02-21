// page/staff/StaffOrders.jsx
import { Link, useLocation } from 'react-router-dom';
import {
  Droplet,
  ClipboardList,
  MessageSquare,
  Bell,
} from 'lucide-react';
import OrderCard from '../../components/staff/OrderCard';
import AssignRiderPanel from '../../components/AssignRiderPanel';
import { useAuth } from '../../contexts/AuthProvider';
import CancelOrder from '../../components/CancelOrder';
import useStaffOrders from './useStaffOrders';


const StaffOrders = () => {
  const { user } = useAuth()
  const location = useLocation()
  const {
    ORDERS_PER_PAGE,
    autoAssignWeights,
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
  } = useStaffOrders();

  const navButtonClass = (isActive) =>
    isActive
      ? 'flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all'
      : 'flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all';

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
            <button className={navButtonClass(location.pathname === '/staff/orders')}>
              <ClipboardList size={18} /> Orders
            </button>
          </Link>
          <Link to="/staff/messages">
            <button className={navButtonClass(location.pathname === '/staff/messages')}>
              <MessageSquare size={18} /> Messages
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">
              Staff Operator
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white font-bold">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "ST"}
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
                      Select Up To 43 Gallons
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
              <div className="space-y-8">
                {pendingOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Pending
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getPageSlice(pendingOrders, pageByStatus.pending).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isSelected={selectedPendingIds.has(order.id)}
                          isSelectable
                          isChecked={selectedPendingIds.has(order.id)}
                          selectionLabel="Select to accept"
                          onToggleSelect={togglePendingSelect}
                          onAccept={handleAcceptOrder}
                          onCancel={handleCancelOrder}
                          cancellingOrderId={cancelOrderId}
                          onAssignRider={handleOpenAssignPanel}
                        />
                      ))}
                    </div>
                    {pendingOrders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPageFor('pending', Math.max(1, pageByStatus.pending - 1))}
                          disabled={pageByStatus.pending === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {pageByStatus.pending} of {getTotalPages(pendingOrders)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPageFor('pending', Math.min(getTotalPages(pendingOrders), pageByStatus.pending + 1))}
                          disabled={pageByStatus.pending === getTotalPages(pendingOrders)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {assignableOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Confirmed (Unassigned)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getPageSlice(assignableOrders, pageByStatus.assignable).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isSelected={selectedAssignIds.has(order.id)}
                          isSelectable
                          isChecked={selectedAssignIds.has(order.id)}
                          selectionLabel="Select to assign"
                          onToggleSelect={toggleAssignSelect}
                          onAccept={handleAcceptOrder}
                          onAssignRider={handleOpenAssignPanel}
                        />
                      ))}
                      
                    </div>
                    {assignableOrders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPageFor('assignable', Math.max(1, pageByStatus.assignable - 1))}
                          disabled={pageByStatus.assignable === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {pageByStatus.assignable} of {getTotalPages(assignableOrders)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPageFor('assignable', Math.min(getTotalPages(assignableOrders), pageByStatus.assignable + 1))}
                          disabled={pageByStatus.assignable === getTotalPages(assignableOrders)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {assignedOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Assigned
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getPageSlice(assignedOrders, pageByStatus.assigned).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isSelected={false}
                          isSelectable={false}
                          isChecked={false}
                          selectionLabel=""
                          onToggleSelect={() => {}}
                          onAccept={handleAcceptOrder}
                          onCancel={handleCancelOrder}
                          onAssignRider={handleOpenAssignPanel}
                        />
                      ))}
                    </div>
                    {assignedOrders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPageFor('assigned', Math.max(1, pageByStatus.assigned - 1))}
                          disabled={pageByStatus.assigned === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {pageByStatus.assigned} of {getTotalPages(assignedOrders)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPageFor('assigned', Math.min(getTotalPages(assignedOrders), pageByStatus.assigned + 1))}
                          disabled={pageByStatus.assigned === getTotalPages(assignedOrders)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {pickedUpOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Picked Up
                    </h3>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Dispatch Queue (Bulk)</h4>
                    <p className="text-xs text-slate-500">Apply to all picked up orders.</p>
                    {getNextDispatchCountdown() !== null && (
                      <p className="text-xs text-slate-600 mt-1">
                        Next dispatch in {getNextDispatchCountdown()}s
                      </p>
                    )}
                  </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={bulkDispatchMinutes}
                          onChange={(e) => setBulkDispatchMinutes(e.target.value)}
                          placeholder="Minutes"
                          className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                        <button
                          onClick={handleQueueDispatchBulk}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Queue All
                        </button>
                        <button
                          onClick={handleDispatchNowBulk}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900"
                        >
                          Dispatch All Now
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getPageSlice(pickedUpOrders, pageByStatus.pickedUp).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isSelected={false}
                          isSelectable={false}
                          isChecked={false}
                          selectionLabel=""
                          onToggleSelect={() => {}}
                          onAccept={handleAcceptOrder}
                          onAssignRider={handleOpenAssignPanel}
                        />
                      ))}
                    </div>
                    {pickedUpOrders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPageFor('pickedUp', Math.max(1, pageByStatus.pickedUp - 1))}
                          disabled={pageByStatus.pickedUp === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {pageByStatus.pickedUp} of {getTotalPages(pickedUpOrders)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPageFor('pickedUp', Math.min(getTotalPages(pickedUpOrders), pageByStatus.pickedUp + 1))}
                          disabled={pageByStatus.pickedUp === getTotalPages(pickedUpOrders)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {outForDeliveryOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Out For Delivery
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getPageSlice(outForDeliveryOrders, pageByStatus.outForDelivery).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isSelected={false}
                          isSelectable={false}
                          isChecked={false}
                          selectionLabel=""
                          onToggleSelect={() => {}}
                          onAccept={handleAcceptOrder}
                          onAssignRider={handleOpenAssignPanel}
                        />
                      ))}
                    </div>
                    {outForDeliveryOrders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPageFor('outForDelivery', Math.max(1, pageByStatus.outForDelivery - 1))}
                          disabled={pageByStatus.outForDelivery === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {pageByStatus.outForDelivery} of {getTotalPages(outForDeliveryOrders)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPageFor('outForDelivery', Math.min(getTotalPages(outForDeliveryOrders), pageByStatus.outForDelivery + 1))}
                          disabled={pageByStatus.outForDelivery === getTotalPages(outForDeliveryOrders)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {deliveredOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Delivered
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getPageSlice(deliveredOrders, pageByStatus.delivered).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isSelected={false}
                          isSelectable={false}
                          isChecked={false}
                          selectionLabel=""
                          onToggleSelect={() => {}}
                          onAccept={handleAcceptOrder}
                          onAssignRider={handleOpenAssignPanel}
                        />
                      ))}
                    </div>
                    {deliveredOrders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPageFor('delivered', Math.max(1, pageByStatus.delivered - 1))}
                          disabled={pageByStatus.delivered === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {pageByStatus.delivered} of {getTotalPages(deliveredOrders)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPageFor('delivered', Math.min(getTotalPages(deliveredOrders), pageByStatus.delivered + 1))}
                          disabled={pageByStatus.delivered === getTotalPages(deliveredOrders)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {pendingPaymentOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Pending Payment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getPageSlice(pendingPaymentOrders, pageByStatus.pendingPayment).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isSelected={false}
                          isSelectable={false}
                          isChecked={false}
                          selectionLabel=""
                          onToggleSelect={() => {}}
                          onAccept={handleAcceptOrder}
                          onAssignRider={handleOpenAssignPanel}
                        />
                      ))}
                    </div>
                    {pendingPaymentOrders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPageFor('pendingPayment', Math.max(1, pageByStatus.pendingPayment - 1))}
                          disabled={pageByStatus.pendingPayment === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {pageByStatus.pendingPayment} of {getTotalPages(pendingPaymentOrders)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPageFor('pendingPayment', Math.min(getTotalPages(pendingPaymentOrders), pageByStatus.pendingPayment + 1))}
                          disabled={pageByStatus.pendingPayment === getTotalPages(pendingPaymentOrders)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {completedOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Completed
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getPageSlice(completedOrders, pageByStatus.completed).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isSelected={false}
                          isSelectable={false}
                          isChecked={false}
                          selectionLabel=""
                          onToggleSelect={() => {}}
                          onAccept={handleAcceptOrder}
                          onAssignRider={handleOpenAssignPanel}
                        />
                      ))}
                    </div>
                    {completedOrders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPageFor('completed', Math.max(1, pageByStatus.completed - 1))}
                          disabled={pageByStatus.completed === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {pageByStatus.completed} of {getTotalPages(completedOrders)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPageFor('completed', Math.min(getTotalPages(completedOrders), pageByStatus.completed + 1))}
                          disabled={pageByStatus.completed === getTotalPages(completedOrders)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {cancelledOrders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Cancelled
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getPageSlice(cancelledOrders, pageByStatus.cancelled).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isSelected={false}
                          isSelectable={false}
                          isChecked={false}
                          selectionLabel=""
                          onToggleSelect={() => {}}
                          onAccept={handleAcceptOrder}
                          onAssignRider={handleOpenAssignPanel}
                        />
                      ))}
                    </div>
                    {cancelledOrders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPageFor('cancelled', Math.max(1, pageByStatus.cancelled - 1))}
                          disabled={pageByStatus.cancelled === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {pageByStatus.cancelled} of {getTotalPages(cancelledOrders)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPageFor('cancelled', Math.min(getTotalPages(cancelledOrders), pageByStatus.cancelled + 1))}
                          disabled={pageByStatus.cancelled === getTotalPages(cancelledOrders)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                      weights={autoAssignWeights}
                      previewEnabled={previewEnabled}
                      onPreviewRecommended={handlePreviewRecommended}
                      previewLoading={previewLoading}
                      previewError={previewError}
                      recommended={recommended}
                      onAssignRecommended={handleAssignRecommended}
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
      
      <CancelOrder 
        confirmCancelOrder={confirmCancelOrder}
        cancelTargetOrder={cancelTargetOrder}
        closeCancelModal={closeCancelModal}
        cancellingOrderId={cancelOrderId}
      />
      {ordersError && (
        <p className="text-xs text-rose-600 mt-2">{ordersError}</p>
      )}

      
    </div>
  );
};

export default StaffOrders;
