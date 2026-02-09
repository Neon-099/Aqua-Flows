import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  MapPin,
  Clock,
  Wallet,
  CreditCard,
  Info,
  Truck,
  Shield,
  CalendarRange,
  X,
} from 'lucide-react';

const Order = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [containerType, setContainerType] = useState('5-gal-refill');
  const [quantity, setQuantity] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [schedule, setSchedule] = useState('today-am');
  const [notes, setNotes] = useState('');

  const subtotal = quantity * 85; // sample pricing in pesos
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  const changeQuantity = (delta) => {
    setQuantity((q) => {
      const next = q + delta;
      return next < 1 ? 1 : next > 10 ? 10 : next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // hook up to backend later
    console.log({ containerType, quantity, paymentMethod, schedule, notes });
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-12 py-4 bg-white border-b border-slate-100 shrink-0 w-full">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Droplet fill="currentColor" size={28} />
          <span>AquaFlow</span>
        </div>

        <div className="hidden md:flex gap-4">
          <Link to="/home">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <LayoutDashboard size={18} /> Dashboard
            </button>
          </Link>
          <Link to="/orders">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
              <ClipboardList size={18} /> Orders
            </button>
          </Link>
          <Link to="/messages">
            <button className="flex items-center gap-2 bg-white/50 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/80 transition-all">
              <MessageSquare size={18} /> Messages
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900 leading-none">Sarah Johnson</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">
              Household Account
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-md overflow-hidden">
            <img src="/api/placeholder/40/40" alt="Sarah" />
          </div>
        </div>
      </nav>

      {/* Background + Card Layout */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* soft gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-10 lg:py-16 grid gap-10 lg:grid-cols-[1.2fr,1fr]">
          {/* Left column: intro + CTA card */}
          <section className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-slate-100">
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
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-600/90 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.18em]">
                      Delivery address
                    </p>
                    <p className="font-black text-lg text-slate-900">Maple Residence · Dagupan City</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Unit 4B, Maple Residence, Phase 2, Brgy. San Miguel, Dagupan City, Pangasinan.
                </p>
              </div>

              <div className="bg-blue-600 text-blue-50 rounded-3xl p-6 shadow-md shadow-blue-200 flex flex-col justify-between">
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
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} /> Last delivery: Yesterday, 3:45 PM
                  </span>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="underline font-semibold hover:text-white"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Right column: stacked feature / reassurance cards */}
          <aside className="space-y-5">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Truck size={22} />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Real-time delivery tracking</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Track your rider on the map and receive SMS updates from pickup to doorstep.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Safe & verified riders</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Every rider is background-checked and trained to handle your containers carefully.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.18em] mb-2">
                Payment options
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Wallet size={20} />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">Cash on Delivery</p>
                    <p className="text-slate-500 text-xs">Pay your rider once gallons are delivered.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-blue-100 flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">GCash</p>
                    <p className="text-slate-500 text-xs">Secure and instant digital payments.</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 flex items-start gap-2 text-[11px] text-slate-400 font-semibold">
                <Info size={14} className="mt-[2px]" />
                Your rider will confirm the final amount and payment method upon arrival.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Modal - Order Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[2.2rem] shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/60">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  New order
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Schedule your water refill
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal content */}
            <form onSubmit={handleSubmit} className="grid md:grid-cols-[1.4fr,1fr] gap-0">
              {/* Left: form fields */}
              <div className="p-8 space-y-7 border-r border-slate-100">
                {/* Container type */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-lg text-slate-900">Gallon selection</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Step 1 of 3
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { id: '5-gal-refill', label: '5 Gallon Round', sub: 'Refill (bring empty)', price: '₱85' },
                      { id: '5-gal-new', label: '5 Gallon Round', sub: 'With new container', price: '₱250' },
                      { id: '3-gal-refill', label: '3 Gallon Slim', sub: 'Refill', price: '₱70' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setContainerType(item.id)}
                        className={`text-left rounded-2xl p-4 border-2 transition-all flex flex-col justify-between h-full ${
                          containerType === item.id
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-inner">
                            <Droplet size={22} />
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-900">{item.label}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.16em]">
                              {item.sub}
                            </p>
                          </div>
                        </div>
                        <p className="font-black text-xl text-slate-900">{item.price}</p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Quantity & schedule */}
                <section className="grid md:grid-cols-2 gap-5">
                  {/* Quantity */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                        Quantity
                      </p>
                      <p className="font-black text-lg text-slate-900">How many gallons?</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => changeQuantity(-1)}
                        className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-500 hover:bg-slate-100"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <p className="text-3xl font-black text-slate-900 leading-none">{quantity}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                          Gallons
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => changeQuantity(1)}
                        className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black hover:bg-blue-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-inner">
                        <CalendarRange size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                          Schedule
                        </p>
                        <p className="font-black text-lg text-slate-900">When do you need it?</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'today-am', label: 'Today', sub: '9AM – 12NN' },
                        { id: 'today-pm', label: 'Today', sub: '1PM – 5PM' },
                        { id: 'tomorrow-am', label: 'Tomorrow', sub: '9AM – 12NN' },
                      ].map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSchedule(slot.id)}
                          className={`rounded-xl px-3 py-2 text-left border text-[11px] font-bold leading-tight ${
                            schedule === slot.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block uppercase tracking-[0.18em] text-[10px]">
                            {slot.label}
                          </span>
                          <span className="block mt-1 text-slate-500">{slot.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Notes */}
                <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Notes for rider
                    </p>
                  </div>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white rounded-2xl border border-slate-100 p-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="e.g. Please call when you arrive at the gate. Blue house, 2nd floor."
                  />
                </section>
              </div>

              {/* Right: summary + payment */}
              <aside className="p-8 space-y-6 bg-slate-50/60">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.22em] mb-4 text-center">
                    Order Summary
                  </h3>
                  <div className="flex gap-4 mb-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                      <Droplet fill="currentColor" size={26} />
                    </div>
                    <div>
                      <p className="font-black text-base text-slate-900">
                        {containerType === '5-gal-new'
                          ? '5 Gallon Round (New container)'
                          : containerType === '3-gal-refill'
                          ? '3 Gallon Slim (Refill)'
                          : '5 Gallon Round (Refill)'}
                      </p>
                      <p className="text-[12px] text-slate-400 font-semibold mt-1">
                        Qty {quantity} •{' '}
                        {schedule === 'today-am'
                          ? 'Today, 9AM–12NN'
                          : schedule === 'today-pm'
                          ? 'Today, 1PM–5PM'
                          : 'Tomorrow, 9AM–12NN'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Subtotal</span>
                      <span className="text-slate-800">₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Delivery fee</span>
                      <span className="text-slate-800">₱{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 text-xl pt-3">
                      <span>Total</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-blue-500" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Payment method
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'cod', label: 'Cash on Delivery', icon: Wallet },
                      { id: 'gcash', label: 'GCash', icon: CreditCard },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPaymentMethod(id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold ${
                          paymentMethod === id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                          <Icon size={18} className="text-blue-500" />
                        </div>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold flex items-start gap-2">
                    <Info size={14} className="mt-[2px] text-slate-300" />
                    Your rider will confirm the amount and payment upon delivery.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-[0.22em] hover:bg-slate-800 transition-all"
                >
                  Confirm Order
                </button>
              </aside>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;