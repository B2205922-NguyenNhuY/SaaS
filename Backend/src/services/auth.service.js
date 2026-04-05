const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const admin  = require("firebase-admin");

const authModel = require("../models/auth.model");
const userModel = require("../models/users.model");

const SALT_ROUNDS = 10;

function normalizeRole(tenVaiTro) {
  switch (tenVaiTro) {
    case "super_admin":  return "super_admin";
    case "tenant_admin": return "tenant_admin";
    case "collector":    return "collector";
    case "merchant":     return "merchant";
    default:             return "unknown";
  }
}

exports.register = async (body) => {
  const { email, password, hoTen, soDienThoai, tenant_id, role_id } = body;

  if (!email || !password || !hoTen || !soDienThoai || !tenant_id || !role_id) {
    throw Object.assign(new Error("Missing required fields"), { statusCode: 400 });
  }

  const duplicate = await userModel.checkDuplicate(null, email, soDienThoai, tenant_id);
  if (duplicate.length > 0) {
    throw Object.assign(new Error("Email hoặc Số điện thoại đã tồn tại"), { statusCode: 400 });
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await authModel.createUser({ email, password_hash, hoTen, soDienThoai, tenant_id, role_id });

  return { user_id: result.insertId };
};

exports.login = async (body) => {
  const { email, password } = body;

  if (!email || !password) {
    throw Object.assign(new Error("Email and password are required"), { statusCode: 400 });
  }

        const superAdmin = await authModel.findSuperAdminByEmail(email);

        if(superAdmin) {
            if(superAdmin.trangThai !== 'active') {
                throw Object.assign(new Error("Account is not active"),{ statusCode: 403 });
            }
            
            const isMatch = await bcrypt.compare(password,superAdmin.password_hash);

            if(!isMatch) {
                throw Object.assign(new Error("Password is wrong"),{ statusCode: 401 });
            }

            const token = jwt.sign(
                {
                    id: superAdmin.admin_id,
                    role: "super_admin",
                    name: superAdmin.hoTen,
                    tenant_id: null,
                    trangThai: superAdmin.trangThai
                },
                process.env.JWT_SECRET, 
                { expiresIn: "60d" }
            );

            return {
                message: "Super admin login successful",
                token,
                user: {
                    id: superAdmin.admin_id,
                    email: superAdmin.email,
                    name: superAdmin.hoTen,
                    soDienThoai: superAdmin.soDienThoai,
                    tenant_id: null,
                    role: "super_admin",
                    trangThai: superAdmin.trangThai
                },
            };
        }
        
    const user = await authModel.findUserByEmail(email);
        
    if(user){
        if(user.trangThai !== 'active') {
            throw Object.assign(new Error("Account is not active"),{ statusCode: 403 });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if(!isMatch) {
            throw Object.assign(new Error("Password is wrong"),{ statusCode: 401 });
        }

        const token = jwt.sign(
            {
                id: user.user_id,
                role: user.tenVaiTro,
                hoTen: user.hoTen,
                tenant_id: user.tenant_id,
                trangThai: user.trangThai
            },
            process.env.JWT_SECRET, 
            { expiresIn: "60d" }
        );

        return {
            message: "User login successful",
            token,
            user: {
                id: user.user_id,
                email: user.email,
                hoTen: user.hoTen,
                soDienThoai: user.soDienThoai,
                tenant_id: user.tenant_id,
                role: user.tenVaiTro,
                trangThai: user.trangThai
            },
        };
    }

        const merchant = await authModel.findMerchantByPhone(email);

        if (merchant) {
            if (merchant.trangThai !== "active") {
                throw Object.assign(new Error("Account is not active"), { statusCode: 403 });
            }

            const isMatch = await bcrypt.compare(password, merchant.password_hash);

            if (!isMatch) {
                throw Object.assign(new Error("Password is wrong"), { statusCode: 401 });
            }

            const token = jwt.sign(
                {
                    id: merchant.merchant_id,
                    role: "merchant",
                    name: merchant.hoTen,
                    tenant_id: merchant.tenant_id,
                    trangThai: merchant.trangThai,
                },
                process.env.JWT_SECRET,
                { expiresIn: "60d" }
            );

            return {
                message: "Merchant login successful",
                token,
                user: {
                    id: merchant.merchant_id,
                    hoTen: merchant.hoTen,
                    tenant_id: merchant.tenant_id,
                    role: "merchant",
                    trangThai: merchant.trangThai,
                },
            };
        }

        throw Object.assign(new Error("Account not found"), { statusCode: 401 });

};

exports.googleLogin = async (body) => {
  const { idToken } = body;

  const decoded = await admin.auth().verifyIdToken(idToken);
  const email   = decoded.email;

  if (!email) {
    throw Object.assign(new Error("Không lấy được email từ Google"), { statusCode: 400 });
  }

  const superAdmin = await authModel.findSuperAdminByEmail(email);
  if (superAdmin) {
    if (superAdmin.trangThai !== "active") {
      throw Object.assign(new Error("Tài khoản không hoạt động"), { statusCode: 403 });
    }
    const token = jwt.sign(
      { id: superAdmin.admin_id, role: "super_admin", tenant_id: null, trangThai: superAdmin.trangThai },
      process.env.JWT_SECRET,
      { expiresIn: "60d" }
    );
    return {
      token,
      user: { id: superAdmin.admin_id, email: superAdmin.email, hoTen: superAdmin.hoTen, role: "super_admin", tenant_id: null },
    };
  }

  const user = await authModel.findUserByEmail(email);
  if (user) {
    if (user.trangThai !== "active") {
      throw Object.assign(new Error("Tài khoản không hoạt động"), { statusCode: 403 });
    }
    const role  = normalizeRole(user.tenVaiTro);
    const token = jwt.sign(
      { id: user.user_id, role, tenant_id: user.tenant_id, trangThai: user.trangThai },
      process.env.JWT_SECRET,
      { expiresIn: "60d" }
    );
    return {
      token,
      user: { id: user.user_id, email: user.email, hoTen: user.hoTen, role, tenant_id: user.tenant_id },
    };
  }

  throw Object.assign(
    new Error("Email này chưa được đăng ký trong hệ thống. Vui lòng liên hệ quản trị viên."),
    { statusCode: 404 }
  );
}