import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Truck,
} from 'lucide-react';
import Header from '../../components/Header'
import { Skeleton } from '../../components/WireframeSkeleton';
import OrderFormModal from '../../components/OrderFormModal';
import CancelOrder from '../../components/CancelOrder';
import useOrders  from '../../hooks/customer/useOrders.js'

const Order = () => {
  const {
    user,
    isModalOpen,
    setIsModalOpen,
    quantity,
    changeQuantity,
    paymentMethod,
    setPaymentMethod,
    paymentChannel,
    setPaymentChannel,
    isProcessingPayment,
    paymentError,
    schedule,
    setSchedule,
    orders,
    currentPage,
    setCurrentPage,
    ordersLoading,
    ordersError,
    cancellingOrderId,
    cancelTargetOrder,
    handleCancelOrder,
    closeCancelModal,
    confirmCancelOrder,
    gallonLabel,
    subtotal,
    deliveryFee,
    vatFee,
    total,
    totalPages,
    paginatedOrders,
    isInitialLoading,
    handleSubmit,
    statusStyles,
    ORDERS_PER_PAGE,
    safeAddress,
    sortedRecentOrders
  } = useOrders()
  
  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      {/* Standardized Navigation */}
      <Header 
        name={user?.name || 'customer'}
        />

      {/* Background + Card Layout */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* soft gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100" />
        <div className="relative z-10 max-w-6xl mx-auto px-12 py-8 grid gap-10 lg:grid-cols-[1.2fr,1fr]">
          {/* Left column: intro + CTA card */}
          <section className="space-y-8">
            {isInitialLoading ? (
              <>
                <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-4">
                  <Skeleton className="h-7 w-44 rounded-full" />
                  <Skeleton className="h-12 w-full max-w-[560px]" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                  <div className="flex flex-wrap gap-4 items-center pt-2">
                    <Skeleton className="h-12 w-52 rounded-xl" />
                    <Skeleton className="h-5 w-64" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-6 w-56" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>

                  <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <div className="pt-3 flex items-center justify-between">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-7 w-56" />
                    </div>
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-52" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-52" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4">
                    <Truck size={14} />
                    Same-day delivery in your area
                  </p>

                  <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
                    Order water refills, without the hassle.
                  </h1>
                  <p className="text-slate-500 text-lg leading-relaxed mb-6">
                    Choose your gallons, confirm your address, and pick a delivery window.
                    Our riders handle the pickup and refill so you never run out of clean water.
                  </p>

                  <div className="flex flex-wrap gap-4 items-center">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-[0.16em] uppercase shadow-md"
                    >
                      Place New Order
                    </button>
                    <span className="text-sm text-slate-500">
                      Next available window:{' '}
                      <span className="font-semibold text-slate-800">Today, 1PM – 5PM</span>
                    </span>
                  </div>
                </div>

                {/* Address summary card */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-600/90 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.18em]">
                          Delivery address
                        </p>
                        <p className="font-black text-lg text-slate-900">{`${safeAddress}, Mapandan`}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {safeAddress === 'Address unavailable' ? safeAddress : `${safeAddress}, Mapandan, Pangasinan`}
                    </p>
                  </div>

                  <div className="bg-blue-600 text-blue-50 rounded-[2.5rem] p-10 shadow-md shadow-blue-200 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100 mb-2">
                        Active plan
                      </p>
                      <p className="text-xl font-black">Household Refill</p>
                      <p className="text-sm text-blue-100 mt-1">
                        Up to <span className="font-semibold">10 gallons</span> per day with priority routing.
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-blue-100">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="underline font-semibold hover:text-white"
                      >
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.18em]">
                        Recent Orders
                      </p>
                      <h3 className="text-xl font-black text-slate-900">Your latest deliveries</h3>
                    </div>
                    <Link to="/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                      View all
                    </Link>
                  </div>
                  <div className="grid gap-4">
                    {ordersError && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-semibold">
                        {ordersError}
                      </div>
                    )}
                    {sortedRecentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em]">
                              {order.orderCode} • {order.date}
                            </p>
                            <p className="font-black text-slate-900 mt-1">{order.qty}{order.items.slice(1)}</p>
                            <p className="text-sm text-slate-500 mt-1">
                              Qty {order.qty} · {order.address}
                            </p>
                          </div>
                          <span
                            className={`text-[11px] font-bold uppercase tracking-[0.18em] border px-2.5 py-1 rounded-full ${statusStyles(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <Clock size={16} /> {order.eta || 'Waiting to assign rider'}
                          </span>
                          <div className="flex items-center gap-3">
                            {order.rawStatus === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order)}
                                disabled={cancellingOrderId === order.id}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            )}
                            <span className="font-black text-slate-900">₱{order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!orders.length && (
                      <p className="text-sm text-slate-400">No recent orders yet.</p>
                    )}
                    {orders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {cancelTargetOrder && (
        <CancelOrder 
          cancelTargetOrder={cancelTargetOrder}
          closeCancelModal={closeCancelModal}
          cancellingOrderId={cancellingOrderId} 
          confirmCancelOrder={confirmCancelOrder}/>
      )}

      <OrderFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        quantity={quantity}
        onChangeQuantity={changeQuantity}
        schedule={schedule}
        onScheduleChange={setSchedule}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        paymentChannel={paymentChannel}
        onPaymentChannelChange={setPaymentChannel}
        paymentError={paymentError}
        isProcessingPayment={isProcessingPayment}
        gallonLabel={gallonLabel}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        vatFee={vatFee}
        total={total}
      />
    </div>
  );
};

export default Order;
