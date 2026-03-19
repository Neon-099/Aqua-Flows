import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CreditCard, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ToastStack from "../../components/admin/ToastStack";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../contexts/AuthProvider";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import {
  cancelAdminOrder,
  fetchAdminConfig,
  fetchAdminExceptions,
  fetchAdminOrders,
  fetchAdminOverviewToday,
  fetchAdminPayments,
  recheckAdminPayment,
  reopenAdminOrder,
  resolveAdminPayment,
} from "../../utils/adminApi";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "orders", label: "Orders", icon: ShieldCheck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "exceptions", label: "Exceptions", icon: AlertTriangle },
  { id: "users", label: "Users", icon: Users },
];

const statusClass = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  PENDING: "bg-amber-100 text-amber-700",
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  FAILED: "bg-orange-100 text-orange-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

const Chip = ({ value }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[value] || "bg-slate-100 text-slate-700"}`}>
    {value || "UNKNOWN"}
  </span>
);

const AdminConsole = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [config, setConfig] = useState({
    timezone: { default: "Asia/Manila", alt: "Asia/Singapore" },
    flags: {},
    pendingSlaMinutes: 30,
  });
  const [tz, setTz] = useState("Asia/Manila");
  const [dateScope, setDateScope] = useState("today");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateScope, setAppliedDateScope] = useState("today");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [exceptions, setExceptions] = useState([]);

  const pushToast = (toast) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetchAdminConfig();
        const data = res?.data || {};
        setConfig((prev) => ({ ...prev, ...data }));
        if (data?.timezone?.default) setTz(data.timezone.default);
      } catch (err) {
        pushToast({ type: "error", title: "Config load failed", message: err.message });
      }
    };
    loadConfig();
  }, []);


  useEffect(() => {
    if (dateScope === "custom") return;
    setAppliedDateScope(dateScope);
    setAppliedDateFrom("");
    setAppliedDateTo("");
  }, [dateScope]);

  const query = useMemo(
    () => ({
      tz,
      dateScope: appliedDateScope,
      dateFrom: appliedDateScope === "custom" ? appliedDateFrom : undefined,
      dateTo: appliedDateScope === "custom" ? appliedDateTo : undefined,
      search: debouncedSearch.trim(),
      limit: 50,
    }),
    [tz, appliedDateScope, appliedDateFrom, appliedDateTo, debouncedSearch]
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        if (tab === "overview") {
          const res = await fetchAdminOverviewToday({
            tz,
            dateScope: query.dateScope,
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
          });
          setOverview(res?.data || null);
        } else if (tab === "orders") {
          const res = await fetchAdminOrders(query);
          setOrders(res?.items || []);
        } else if (tab === "payments") {
          const res = await fetchAdminPayments(query);
          setPayments(res?.items || []);
        } else if (tab === "exceptions") {
          const res = await fetchAdminExceptions({ limit: 100 });
          setExceptions(res?.items || []);
        }
      } catch (err) {
        pushToast({ type: "error", title: `Failed to load ${tab}`, message: err.message });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tab, query, tz]);

  const applyCustomDate = () => {
    if (dateScope !== "custom") return;
    if (!dateFrom || !dateTo) {
      pushToast({ type: "error", title: "Custom date required", message: "Please select both start and end dates." });
      return;
    }
    if (dateFrom > dateTo) {
      pushToast({ type: "error", title: "Invalid date range", message: "Start date cannot be later than end date." });
      return;
    }
    setAppliedDateScope("custom");
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    pushToast({ type: "success", title: "Custom date saved" });
  };

  const customDateDirty =
    dateScope === "custom" &&
    (appliedDateScope !== "custom" || appliedDateFrom !== dateFrom || appliedDateTo !== dateTo);

  const rangeLabel =
    appliedDateScope === "today"
      ? "Today"
      : appliedDateScope === "yesterday"
      ? "Yesterday"
      : appliedDateFrom && appliedDateTo
      ? `${appliedDateFrom} to ${appliedDateTo}`
      : "Custom";

  const onOrderAction = async (order, action) => {
    const reason = window.prompt(`Reason for ${action.toLowerCase()} action:`);
    if (!reason) return;
    try {
      if (action === "CANCEL") {
        await cancelAdminOrder(order._id, { reason });
      } else {
        await reopenAdminOrder(order._id, { reason });
      }
      pushToast({ type: "success", title: `Order ${action === "CANCEL" ? "cancelled" : "reopened"}` });
      const res = await fetchAdminOrders(query);
      setOrders(res?.items || []);
    } catch (err) {
      pushToast({ type: "error", title: "Order action failed", message: err.message });
    }
  };

  const onPaymentRecheck = async (payment) => {
    const reason = window.prompt("Recheck reason (optional):") || "";
    try {
      await recheckAdminPayment(payment._id, { reason });
      pushToast({ type: "success", title: "Payment rechecked" });
      const res = await fetchAdminPayments(query);
      setPayments(res?.items || []);
    } catch (err) {
      pushToast({ type: "error", title: "Recheck failed", message: err.message });
    }
  };

  const onPaymentResolve = async (payment, action) => {
    const reason = window.prompt(`Reason for ${action}:`);
    if (!reason) return;
    try {
      await resolveAdminPayment(payment._id, { action, reason });
      pushToast({ type: "success", title: `Payment ${action} applied` });
      const [payRes, excRes] = await Promise.all([fetchAdminPayments(query), fetchAdminExceptions({ limit: 100 })]);
      setPayments(payRes?.items || []);
      setExceptions(excRes?.items || []);
    } catch (err) {
      pushToast({ type: "error", title: "Resolve failed", message: err.message });
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate("/admin/auth", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ToastStack toasts={toasts} />
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin Operations</p>
              <h1 className="text-2xl font-bold text-slate-900">Payments and Daily Fulfillment</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={dateScope} onChange={(e) => setDateScope(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="custom">Custom</option>
              </select>
              {dateScope === "custom" && (
                <>
                    <div className="flex">
                      <p className="top-">To</p>
                      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div className="flex">
                      <p>From</p>
                      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                  <button
                    type="button"
                    onClick={applyCustomDate}
                    disabled={!customDateDirty}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save
                  </button>
                </>
              )}
              <select value={tz} onChange={(e) => setTz(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value={config.timezone.default}>{config.timezone.default}</option>
                <option value={config.timezone.alt}>{config.timezone.alt}</option>
              </select>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order code or id"
                className="min-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    tab === item.id ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6 lg:px-8">
        {loading ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading {tab}...</p> : null}

        {tab === "overview" && overview && (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [`Orders (${rangeLabel})`, overview.kpis?.ordersToday],
                [`Completed (${rangeLabel})`, overview.kpis?.completedToday],
                [`Cancelled (${rangeLabel})`, overview.kpis?.cancelledToday],
                ["Pending Payment", overview.kpis?.pendingPayment],
                [`GCash Paid (${rangeLabel})`, `PHP ${Number(overview.kpis?.gcashPaidAmountToday || 0).toFixed(2)}`],
                [`COD Paid (${rangeLabel})`, `PHP ${Number(overview.kpis?.codPaidAmountToday || 0).toFixed(2)}`],
                ["Payment Success", overview.kpis?.paymentSuccessCount],
                ["Payment Failures", overview.kpis?.paymentFailureCount],
              ].map(([label, value]) => (
                <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                </article>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Hourly Completed vs Cancelled</p>
              <div className="mt-3 grid grid-cols-6 gap-2 text-xs sm:grid-cols-12">
                {overview.hourlyTrend?.length ? (
                  overview.hourlyTrend.map((row) => (
                    <div key={`${row.hour}-${row.status}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="font-semibold">{row.hour}:00</p>
                      <p className="text-slate-600">{row.status}</p>
                      <p className="text-slate-900">{row.count}</p>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-slate-500">No trend data for selected day.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Order</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Payment</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-semibold text-slate-900">{order.order_code || order._id}</td>
                      <td className="px-3 py-3 text-slate-700">{order.customer?.name || "—"}</td>
                      <td className="px-3 py-3"><Chip value={order.status} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Chip value={order.payment_status} />
                          <span className="text-xs text-slate-500">{order.payment_method}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">PHP {Number(order.total_amount || 0).toFixed(2)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => onOrderAction(order, "CANCEL")}
                            disabled={order.status === "CANCELLED" || order.status === "COMPLETED"}
                            className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                          >
                            Cancel Override
                          </button>
                          <button
                            onClick={() => onOrderAction(order, "REOPEN")}
                            disabled={order.status !== "CANCELLED"}
                            className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700 disabled:opacity-50"
                          >
                            Reopen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "payments" && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Order</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Provider Ref</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-semibold">{payment.order?.orderCode || payment.order_id}</td>
                      <td className="px-3 py-3">{payment.method}</td>
                      <td className="px-3 py-3"><Chip value={payment.status} /></td>
                      <td className="px-3 py-3">PHP {Number(payment.amount || 0).toFixed(2)}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">{payment.paymongo_payment_intent_id || payment.paymongo_source_id || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => onPaymentRecheck(payment)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
                            <span className="inline-flex items-center gap-1"><RefreshCw size={12} /> Recheck</span>
                          </button>
                          <button onClick={() => onPaymentResolve(payment, "MARK_PAID")} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700">Mark Paid</button>
                          <button onClick={() => onPaymentResolve(payment, "MARK_FAILED")} className="rounded-lg border border-orange-200 px-2 py-1 text-xs font-semibold text-orange-700">Mark Failed</button>
                          <button onClick={() => onPaymentResolve(payment, "CONVERT_TO_COD")} className="rounded-lg border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-700">Convert COD</button>
                          <button onClick={() => onPaymentResolve(payment, "RESEND_LINK")} className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700">Resend Link</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>No payments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "exceptions" && (
          <section className="grid gap-3">
            {exceptions.map((item, idx) => (
              <article key={`${item.payment?._id || idx}-${item.type}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Chip value={item.type} />
                    <p className="text-sm font-semibold text-slate-900">Order: {item.order?.order_code || item.order?._id || "Unknown"}</p>
                  </div>
                  <p className="text-xs text-slate-500">Payment: {item.payment?.paymongo_payment_intent_id || item.payment?._id || "—"}</p>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  Customer: {item.order?.customer?.name || "—"} | Method: {item.payment?.method || item.order?.payment_method || "—"} | Status: {item.payment?.status || "—"}
                </p>
              </article>
            ))}
            {exceptions.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No payment exceptions found.</p>}
          </section>
        )}

        {tab === "users" && (
          <section>
            <AdminDashboard embedded />
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminConsole;
