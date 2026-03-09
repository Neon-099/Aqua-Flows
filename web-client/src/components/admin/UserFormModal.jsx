import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { z } from "zod";
import { ADDRESS_OPTIONS } from "../../utils/addressOptions";

const backendEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const baseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z
    .string()
    .email("Enter a valid email")
    .regex(backendEmailRegex, "Please provide a valid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  password: z.string().optional(),
  maxCapacityGallons: z.any().optional(),
});

const withRoleRules = (schema) =>
  schema.superRefine((data, ctx) => {
    if (data.role === "customer") {
      if (!data.phone || !data.phone.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Phone is required", path: ["phone"] });
      }
      if (!data.address || !data.address.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Address is required", path: ["address"] });
      }
      if (data.phone && !/^\d{11}$/.test(String(data.phone).trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number must be exactly 11 digits",
          path: ["phone"],
        });
      }
    }
    if (data.role === "rider" && data.maxCapacityGallons === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max capacity is required for riders",
        path: ["maxCapacityGallons"],
      });
      return;
    }
    if (data.role === "rider") {
      const parsed = Number(data.maxCapacityGallons);
      if (!Number.isFinite(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Max capacity must be a number",
          path: ["maxCapacityGallons"],
        });
        return;
      }
      if (!Number.isInteger(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Max capacity must be a whole number",
          path: ["maxCapacityGallons"],
        });
        return;
      }
      if (parsed < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Max capacity must be at least 1",
          path: ["maxCapacityGallons"],
        });
      }
    }
  });

const createSchema = withRoleRules(
  baseSchema.extend({
    password: z
      .string()
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
        "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character"
      ),
  })
);

const editSchema = withRoleRules(
  baseSchema.refine(
    (data) =>
      !data.password ||
      /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(data.password)),
    {
      message:
        "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character",
      path: ["password"],
    }
  )
);

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  maxCapacityGallons: "",
  role: "customer",
  password: "",
};

const UserFormModal = ({
  open,
  mode,
  initialData,
  onSubmit,
  onClose,
  onCancel,
  submitError,
  submitInfo,
  onClearSubmitError,
  loading,
  cancelLoading = false,
}) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError("");
    setShowPassword(false);
    if (mode === "edit" && initialData) {
      setForm({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        role: initialData.role || "customer",
        maxCapacityGallons: initialData.maxCapacityGallons ?? "",
        password: "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, mode, initialData]);

  const schema = useMemo(() => (mode === "create" ? createSchema : editSchema), [mode]);
  const hasSelectedAddressOption = useMemo(
    () => ADDRESS_OPTIONS.some((option) => option.value === form.address),
    [form.address]
  );

  const handleChange = (key, value) => {
    onClearSubmitError?.();
    setFormError("");
    if (key === "role") {
      setForm((prev) => {
        const next = { ...prev, role: value };
        if (value !== "customer") {
          next.phone = "";
          next.address = "";
        }
        if (value !== "rider") {
          next.maxCapacityGallons = "";
        }
        return next;
      });
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onClearSubmitError?.();
    setFormError("");
    const result = schema.safeParse(form);
    if (!result.success) {
      const mapped = {};
      const validationErrors = result.error?.issues || result.error?.errors || [];
      validationErrors.forEach((err) => {
        mapped[err.path[0]] = err.message;
      });
      setErrors(mapped);
      if (validationErrors[0]?.message) {
        setFormError(validationErrors[0].message);
      } else {
        setFormError("Please check the form fields and try again.");
      }
      return;
    }
    setErrors({});
    const payload = {
      name: result.data.name,
      email: result.data.email,
      role: result.data.role,
      ...(result.data.password ? { password: result.data.password } : {}),
      ...(result.data.role === "customer"
        ? { phone: result.data.phone?.trim(), address: result.data.address?.trim() }
        : {}),
      ...(result.data.role === "rider"
        ? { maxCapacityGallons: Number(result.data.maxCapacityGallons) }
        : {}),
    };
    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {mode === "create" ? "Create User" : "Edit User"}
            </h3>
            <p className="text-sm text-slate-500">
              {mode === "create" ? "Add a new team member or customer." : "Update user details."}
            </p>
          </div>
          <button
            onClick={onCancel || onClose}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-60"
            disabled={loading || cancelLoading}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {formError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {formError}
            </div>
          )}
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}
          {!submitError && submitInfo && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              {submitInfo}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Role</label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="rider">Rider</option>
                <option value="customer">Customer</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Email</label>
            <input
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          {form.role === "customer" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Phone</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={11}
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Address</label>
                <select
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select your barangay/address option</option>
                  {!hasSelectedAddressOption && form.address ? (
                    <option value={form.address}>{form.address}</option>
                  ) : null}
                  {ADDRESS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>
            </div>
          )}

          {form.role === "rider" && (
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">
                Max Gallon Capacity
              </label>
              <input
                type="number"
                min="1"
                value={form.maxCapacityGallons}
                onChange={(e) => handleChange("maxCapacityGallons", e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.maxCapacityGallons && (
                <p className="mt-1 text-xs text-red-600">{errors.maxCapacityGallons}</p>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Password {mode === "create" ? "(required)" : "(optional)"}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Show password
            </label>
            {mode === "create" && (
              <p className="mt-1 text-xs text-slate-500">
                Must be 8+ characters with 1 uppercase, 1 number, and 1 special character.
              </p>
            )}
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel || onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              disabled={loading || cancelLoading}
            >
              {cancelLoading ? "Cancelling..." : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading || cancelLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? "Saving..." : mode === "create" ? "Create User" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
