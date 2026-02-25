import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { z } from "zod";

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  },
  z.coerce.number().int("Max capacity must be a whole number").min(1, "Max capacity must be at least 1")
);

const baseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  password: z.string().optional(),
  maxCapacityGallons: optionalNumber.optional(),
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
    }
    if (data.role === "rider" && data.maxCapacityGallons === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max capacity is required for riders",
        path: ["maxCapacityGallons"],
      });
    }
  });

const createSchema = withRoleRules(
  baseSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
);

const editSchema = withRoleRules(
  baseSchema.refine((data) => !data.password || data.password.length >= 6, {
    message: "Password must be at least 6 characters",
    path: ["password"],
  })
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

const UserFormModal = ({ open, mode, initialData, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
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

  const handleChange = (key, value) => {
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
    const result = schema.safeParse(form);
    if (!result.success) {
      const mapped = {};
      result.error.errors.forEach((err) => {
        mapped[err.path[0]] = err.message;
      });
      setErrors(mapped);
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
        ? { maxCapacityGallons: result.data.maxCapacityGallons }
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
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
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
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
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
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
