import { CalendarRange, CreditCard, Droplet, Info, Wallet, X } from 'lucide-react';

const PAYMENT_OPTIONS = [
  { id: 'cod', label: 'Cash on Delivery', icon: Wallet },
  { id: 'gcash', label: 'GCash', icon: CreditCard },
];

const DIGITAL_CHANNEL_OPTIONS = [
  { id: 'gcash', label: 'GCash App' },
  { id: 'qrph', label: 'QRPH Scan' },
];

const GALLON_OPTIONS = [
  { id: 'round-gallon', label: 'Round Gallon' },
  { id: 'slim-gallon', label: 'Slim Gallon' },
];

const OrderFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  quantity,
  onChangeQuantity,
  schedule,
  onScheduleChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentChannel,
  onPaymentChannelChange,
  paymentError,
  isProcessingPayment,
  gallonLabel,
  subtotal,
  deliveryFee,
  vatFee,
  total,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[2.2rem] shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100">
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
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid md:grid-cols-[1.4fr,1fr] gap-0">
          <div className="p-8 space-y-7 border-r border-slate-100">
            <section className="grid md:grid-cols-2 gap-5">
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
                    onClick={() => onChangeQuantity(-1)}
                    className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-500 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <p className="text-3xl font-black text-slate-900 leading-none">{quantity}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                      Gallons
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChangeQuantity(1)}
                    className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black hover:bg-blue-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-inner">
                    <CalendarRange size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Gallon Type
                    </p>
                    <p className="font-black text-lg text-slate-900">What type of gallon?</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {GALLON_OPTIONS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => onScheduleChange(slot.id)}
                      className={`rounded-xl px-3 py-2 text-left border text-[11px] font-bold leading-tight ${
                        schedule === slot.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block uppercase tracking-[0.18em] text-[10px]">
                        {slot.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="p-8 space-y-6 bg-slate-50/60">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-blue-500" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Payment method
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onPaymentMethodChange(id)}
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
              {paymentMethod === 'gcash' && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Checkout Channel
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {DIGITAL_CHANNEL_OPTIONS.map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => onPaymentChannelChange(channel.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                          paymentChannel === channel.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {channel.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-slate-400 font-semibold flex items-start gap-2">
                <Info size={14} className="mt-[2px] text-slate-300" />
                {paymentMethod === 'gcash'
                  ? paymentChannel === 'qrph'
                    ? 'You will be redirected to PayMongo QRPH checkout. Scan and pay, then return and press Confirm Order again.'
                    : 'You will be redirected to PayMongo GCash checkout. After successful payment, return and press Confirm Order again.'
                  : 'Pay on delivery.'}
              </p>
              {paymentError && (
                <p className="text-[11px] font-semibold text-rose-600">{paymentError}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.22em] mb-4 text-center">
                Order Summary
              </h3>
              <div className="flex gap-4 mb-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                  <Droplet fill="currentColor" size={26} />
                </div>
                <div>
                  <p className="font-black text-base text-slate-900">{gallonLabel}</p>
                  <p className="text-[12px] text-slate-400 font-semibold mt-1">Qty {quantity}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm pt-3 border-t border-slate-100">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Subtotal</span>
                  <span className="text-slate-800">{`\u20B1${subtotal.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Delivery fee</span>
                  <span className="text-slate-800">{`\u20B1${deliveryFee.toFixed(2)}`}</span>
                </div>
                {vatFee > 0 && (
                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>VAT</span>
                    <span className="text-slate-800">{`\u20B1${vatFee.toFixed(2)}`}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 text-xl pt-3">
                  <span>Total</span>
                  <span>{`\u20B1${total.toFixed(2)}`}</span>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={isProcessingPayment}
              className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-[0.22em] hover:bg-slate-800 transition-all disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isProcessingPayment ? 'Processing GCash...' : 'Confirm Order'}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default OrderFormModal;
