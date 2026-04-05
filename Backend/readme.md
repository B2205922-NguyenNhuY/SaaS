npm install multer

# Role
Hệ thống chỉ cần 4 role: super admin, tenant admin, collector và merchant. Không cần quản lý trung gian.

const ROLES = {
  SUPER_ADMIN: "super_admin",
  TENANT_ADMIN: "tenant_admin",
  COLLECTOR: "collector",
  MERCHANT: "merchant",
};