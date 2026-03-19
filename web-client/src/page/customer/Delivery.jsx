import { 
  ClipboardList, MessageSquare,  Droplet,
  Package,  Truck, Clock, CircleDot
} from 'lucide-react';
import Header from '../../components/Header'
import { Skeleton, SkeletonGroup } from '../../components/WireframeSkeleton';
import useDelivery from '../../hooks/customer/useDelivery';



const Delivery = () => {
  
  const {
    user,
    loading,
    error,
    latestActiveOrder,
    activeOrders,
    selectedActiveOrder,
    selectedActiveOrderId,
    setSelectedActiveOrderId,
    latestSummaryOrder,
    recentHistory,
    riderConversation,
    progressSteps,
    subtotal,
    total,
    etaText,
    isInitialLoading,
    totalHistoryPages,
    historyPage,
    setHistoryPage,
    paginatedHistory,
    getGreeting,
    initials,
    money,
    fmtDate,
    STATUS_LABEL,
    riderName,
    riderPhone,
    DELIVERY_FEE,
    HISTORY_PER_PAGE,
    navigate,
  } = useDelivery();
  const activeCount = progressSteps.filter((step) => step.active).length;
  const currentStep = progressSteps[Math.max(0, activeCount - 1)];

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      {/* Standardized Navigation */}
      <Header 
        name={user?.name || 'customer'}
        />

      {/* Main Content Area */}
      <div className="flex-1 w-full px-12 py-8">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            {`${getGreeting()}, ${user?.name || 'Customer'}!`}
          </h1>
          <p className="text-slate-500 text-lg mt-2">
            {selectedActiveOrder 
              ? 'Your water refill is on its way. Stay hydrated!'
              : 'No active delivery. Place an order to get started.'}
          </p>
        </header>

        {/* Grid System: 12-column layout */}
        <div className="grid grid-cols-12 gap-10">
          
          {/* Main Column (Spans 8 of 12 columns) */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            
            {isInitialLoading && (
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <SkeletonGroup className="space-y-8">
                  <div className="flex justify-between items-start">
                    <SkeletonGroup>
                      <Skeleton className="h-8 w-56" />
                      <Skeleton className="h-4 w-40" />
                    </SkeletonGroup>
                    <Skeleton className="h-9 w-32 rounded-full" />
                  </div>
                  <Skeleton className="h-40 w-full rounded-3xl" />
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <SkeletonGroup>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-44" />
                      </SkeletonGroup>
                    </div>
                    <div className="flex gap-3">
                      <Skeleton className="h-12 w-24 rounded-2xl" />
                      <Skeleton className="h-12 w-28 rounded-2xl" />
                    </div>
                  </div>
                </SkeletonGroup>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-200 p-6 rounded-[2.5rem]">
                <p className="text-rose-600 font-semibold">{error}</p>
              </div>
            )}

            {!loading && !error && selectedActiveOrder && (
              /* Enhanced Status Card */
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h3 className="font-black text-2xl text-slate-800">
                      Order #{selectedActiveOrder.order_code || String(selectedActiveOrder._id).slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-slate-400 font-medium mt-1">
                      {fmtDate(selectedActiveOrder.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg shadow-emerald-100 animate-pulse">
                      {STATUS_LABEL[selectedActiveOrder.status] || 'In Transit'}
                    </span>
                    {activeOrders.length > 1 && (
                      <select
                        value={selectedActiveOrderId}
                        onChange={(e) => setSelectedActiveOrderId(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
                      >
                        {activeOrders.map((order) => (
                          <option key={order._id} value={order._id}>
                            {order.order_code || String(order._id).slice(-6).toUpperCase()} · {STATUS_LABEL[order.status] || order.status}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Enhanced Progress Bar with Icons */}
                <div className="relative mb-24 px-4">
                  {/* Background line */}
                  <div className="absolute top-6 left-0 w-full h-2 bg-slate-100 z-0 rounded-full"></div>
                  {/* Progress line with gradient */}
                  <div 
                    className={`absolute top-6 left-0 h-2 z-0 rounded-full transition-all duration-500 ${currentStep?.progressClass || 'bg-blue-600'}`}
                    style={{ 
                      width: `${(activeCount / progressSteps.length) * 100}%` 
                    }}
                  ></div>
                  
                  <div className="relative flex justify-between items-start">
                    {progressSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div className={`z-10 w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-300 shadow-lg ${
                            step.active 
                              ? step.current
                                ? `bg-gradient-to-br ${step.activeClasses} text-white scale-110 animate-pulse ring-4`
                                : `bg-gradient-to-br ${step.activeClasses} text-white scale-105`
                              : 'bg-white border-2 border-slate-200 text-slate-300'
                          }`}>
                            <Icon size={20} className={step.active ? 'text-white' : 'text-slate-300'} />
                          </div>
                          <span className={`text-xs font-bold text-center w-28 leading-tight ${
                            step.active ? step.textActiveClass : 'text-slate-300'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Driver Contact Section */}
                {selectedActiveOrder.assigned_rider_name && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between border-2 border-blue-200/50 mt-16 shadow-sm">
                    <div className="flex items-center gap-6 mb-4 sm:mb-0">
                      <div className="relative">
                        <div className="w-15 h-15 rounded-[1.6rem] bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-200">
                          {initials}
                        </div>
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-md"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-slate-800 text-xl">{selectedActiveOrder.assigned_rider_name}</p>
                          <CircleDot size={16} className="text-emerald-500" fill="currentColor" />
                        </div>
                        <p className="text-blue-600 font-bold tracking-wide flex items-center gap-2">
                          <Truck size={16} />
                          {selectedActiveOrder.assigned_rider_name} • Active
                        </p>
                        {riderPhone && (
                          <p className="text-slate-500 text-sm font-semibold mt-1">
                            Phone: {riderPhone}
                          </p>
                        )}
                        {etaText && (
                          <p className="text-slate-500 text-sm font-semibold mt-1 flex items-center gap-1">
                            <Clock size={14} />
                            ETA: {etaText}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {riderPhone && (
                        <a
                          href={`tel:${riderPhone}`}
                          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-200 rounded-2xl text-blue-700 font-bold hover:bg-blue-50 transition-all shadow-lg shadow-blue-100"
                        >
                          Call Rider
                        </a>
                      )}
                      <button 
                        onClick={() => navigate('/messages', {
                          state: {orderId: selectedActiveOrder?._id || latestActiveOrder?._id || ''}
                        })}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
                      >
                        <MessageSquare size={18} /> Message
                      </button>
                    </div>
                  </div>
                )}

                {/* Order Details Section */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-4">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Order Details</p>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Delivery address</p>
                      <p className="text-slate-700 font-semibold mt-1">
                        {selectedActiveOrder.customer_address || user?.address || 'Address unavailable'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Quantity</p>
                        <p className="text-slate-700 font-semibold mt-1">{selectedActiveOrder.water_quantity} gallons</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Gallon type</p>
                        <p className="text-slate-700 font-semibold mt-1">
                          {selectedActiveOrder.gallon_type === 'SLIM' ? 'Slim gallon' : 'Round gallon'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Payment method</p>
                        <p className="text-slate-700 font-semibold mt-1">
                          {selectedActiveOrder.payment_method === 'GCASH' ? 'GCash' : 'Cash on Delivery'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Assigned rider</p>
                        <p className="text-slate-700 font-semibold mt-1">
                          {selectedActiveOrder.assigned_rider_name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Rider Contact</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-lg font-black text-slate-800">
                          {selectedActiveOrder.assigned_rider_name || 'Waiting for rider'}
                        </p>
                        <p className="text-sm text-slate-500 font-semibold mt-1">
                          {riderPhone || 'Phone not available yet'}
                        </p>
                      </div>
                      {riderPhone ? (
                        <a
                          href={`tel:${riderPhone}`}
                          className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
                        >
                          Call Rider
                        </a>
                      ) : (
                        <span className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-400 font-semibold">
                          Call Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && !latestActiveOrder && (
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="text-center py-12">
                  <Package size={64} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-black text-2xl text-slate-800 mb-2">No Active Delivery</h3>
                  <p className="text-slate-500 mb-6">You don't have any active orders at the moment.</p>
                  <button
                    onClick={() => navigate('/orders')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    Place New Order
                  </button>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              {isInitialLoading ? (
                <SkeletonGroup className="space-y-5">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <SkeletonGroup>
                        <Skeleton className="h-6 w-44" />
                        <Skeleton className="h-4 w-56" />
                      </SkeletonGroup>
                    </div>
                    <Skeleton className="h-7 w-20" />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <SkeletonGroup>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-52" />
                      </SkeletonGroup>
                    </div>
                    <Skeleton className="h-7 w-20" />
                  </div>
                </SkeletonGroup>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-2xl text-slate-800">Recent Activity</h3>
                    <button
                      onClick={() => navigate('/orders')}
                      className="text-blue-600 font-bold hover:underline text-sm"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {recentHistory.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-8">No order history yet.</p>
                    )}
                    {paginatedHistory.map((o) => (
                      <div key={o._id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <ClipboardList size={22} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-black text-lg text-slate-800">
                              {STATUS_LABEL[o.status] || o.status}
                            </p>
                            <p className="text-slate-400 text-sm font-semibold mt-1">
                              {fmtDate(o.created_at)} • Qty {o.water_quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-xl text-slate-700">{money(o.total_amount)}</span>
                      </div>
                    ))}
                    {recentHistory.length > HISTORY_PER_PAGE && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                          disabled={historyPage === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {historyPage} of {totalHistoryPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
                          disabled={historyPage === totalHistoryPages}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar (Spans 4 of 12 columns) */}
          <div className="col-span-12 lg:col-span-4 space-y-10">
            {/* Reorder Card */}
            {isInitialLoading ? (
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <SkeletonGroup>
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-14 w-full rounded-[1.5rem]" />
                </SkeletonGroup>
              </div>
            ) : (
              <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-black text-3xl mb-3">Running Low?</h3>
                  <p className="text-blue-100 text-base leading-relaxed mb-10 font-medium">
                    Reorder your usual refill with one tap.
                  </p>
                  <button
                    onClick={() => navigate('/orders')}
                    className="w-full bg-slate-900 text-blue-500 py-5 rounded-[1.5rem] font-black text-lg hover:bg-slate-800 transition-all"
                  >
                    + Order Water
                  </button>
                </div>
                <div className="absolute -top-10 -right-10 text-white/10 text-[12rem] rotate-12">💧</div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
              
              {isInitialLoading ? (
                <SkeletonGroup>
                  <Skeleton className="h-6 w-40 mx-auto" />
                  <div className="flex gap-6 mb-3">
                    <Skeleton className="h-16 w-16 rounded-2xl" />
                    <SkeletonGroup className="flex-1">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </SkeletonGroup>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-28 ml-auto" />
                  <Skeleton className="h-10 w-full rounded-2xl" />
                </SkeletonGroup>
              ) : (
                <>
                  <h3 className="font-black text-xl text-slate-800 mb-8 uppercase tracking-widest text-center">
                    Order Summary
                  </h3>
                  {!latestSummaryOrder && <p className="text-slate-400 text-sm text-center">No orders yet.</p>}
                  {latestSummaryOrder && (
                    <>
                      <div className="flex gap-6 mb-10">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner shrink-0">
                          <Droplet fill="currentColor" size={32} />
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-xl text-slate-800">
                            {latestSummaryOrder.gallon_type === 'SLIM' ? 'Gallon Slim (Refill)' : '5 Gallon Round (Refill)'}
                          </p>
                          <p className="text-slate-400 text-sm font-bold mt-1">
                            Quantity: {latestSummaryOrder.water_quantity}
                          </p>
                          <p className="text-slate-400 text-xs font-bold mt-1">
                            {STATUS_LABEL[latestSummaryOrder.status] || latestSummaryOrder.status}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4 text-sm pt-8 border-t border-slate-100">
                        <div className="flex justify-between text-slate-400 font-bold text-lg">
                          <span>Subtotal</span>
                          <span className="text-slate-800">{money(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-bold text-lg">
                          <span>Delivery fee</span>
                          <span className="text-slate-800">{money(5)}</span>
                        </div>
                        {latestSummaryOrder.payment_method === 'GCASH' && (
                          <div className="flex justify-between text-slate-400 font-bold text-lg">
                            <span>Vat</span>
                            <span className="text-slate-800">{money(3)}</span>
                          </div> 
                        )}
                        <div className="flex justify-between font-black text-slate-900 text-3xl pt-2">
                          <span>Total</span>
                          <span>{money(total)}</span>
                        </div>
                      </div>
                      <div className="mt-8 p-4 bg-blue-50 rounded-2xl text-blue-600 text-xs font-black text-center border border-blue-100 uppercase tracking-widest">
                        Payment: {latestSummaryOrder.payment_method}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Mini Messages */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
              {isInitialLoading ? (
                <SkeletonGroup>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-14 w-full rounded-[1.5rem]" />
                </SkeletonGroup>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-xl text-slate-800">Messages</h3>
                    <button >
                      <MessageSquare size={20} className="text-slate-300" />
                    </button>
                    
                  </div>
                  {riderConversation ? (
                    <>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {riderConversation.counterpartyLabel || 'Rider'}
                        </p>
                        <p className="text-sm text-slate-500 italic mt-2 leading-relaxed font-medium">
                          "{riderConversation.lastMessage || 'No recent rider messages.'}"
                        </p>
                        {riderConversation.lastMessageAt && (
                          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                            <Clock size={13} /> {fmtDate(riderConversation.lastMessageAt)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate('/messages')}
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
                      >
                        Open Message Station
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare size={32} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-400 text-sm mb-4">No rider messages yet.</p>
                      <button
                        onClick={() => navigate('/messages')}
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
                      >
                        Open Message Station
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Delivery;
