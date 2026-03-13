const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authModel = require("../models/auth.model");
const userModel = require("../models/users.model");
const role = require("../constants/role");
// const admin = require("../config/firebase");

const SALT_ROUNDS = 10;

//Đăng ký
exports.register = async (req, res) => {
    try{
        const {
            email,
            password,
            hoTen,
            soDienThoai,
            tenant_id,
            role_id
        } = req.body;

        if (!email || !password || !hoTen || !soDienThoai || !tenant_id || !role_id) {
            return res.status(400).json({
                message: "Missing required fields",
            });
        }
        
        const duplicate = await userModel.checkDuplicate(email, soDienThoai);

        if (duplicate.length>0) {
            return res.status(400).json({
                message: "Email hoặc Số điện thoại đã tồn tại"
            });
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await authModel.createUser({email, password_hash, hoTen, soDienThoai, tenant_id, role_id});

        res.status(201).json({
            message: "Register successfully",
            user_id: result.insertId
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Email hoặc số điện thoại đã tồn tại"});
        }

        res.status(500).json({error: error.message});
    }
};

//login
exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const superAdmin = await authModel.findSuperAdminByEmail(email);
        if(superAdmin) {
            if(superAdmin.trangThai !== 'active') {
                return res.status(403).json({message: "Account is not active"});
            }
            
            const isMatch = await bcrypt.compare(password, superAdmin.password_hash);
            if(!isMatch) {
                return res.status(401).json({message: "Password is wrong"});
            }

            const token = jwt.sign(
                {
                    id: superAdmin.admin_id,
                    role: "super_admin",
                    tenant_id: null,
                },
                process.env.JWT_SECRET, 
                { expiresIn: "1h" }
            );

            return res.json({
                message: "Super admin login successful",
                token,
                user: {
                    id: superAdmin.admin_id,
                    email: superAdmin.email,
                    tenant_id: null,
                    role: "super_admin",
                },
            });
        }
        
        const user = await authModel.findUserByEmail(email);
        if(user) {
            if(user.trangThai !== 'active') {
                return res.status(403).json({message: "Account is not active"});
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if(!isMatch) {
                return res.status(401).json({message: "Password is wrong"});
            }

            const token = jwt.sign(
                {
                    id: user.user_id,
                    role: user.tenVaiTro,
                    tenant_id: user.tenant_id
                },
                process.env.JWT_SECRET, 
                { expiresIn: "1h" }
            );

            return res.json({
                message: "User login successful",
                token,
                user: {
                    id: user.user_id,
                    email: user.email,
                    tenant_id: user.tenant_id,
                    role: user.tenVaiTro
                },
            });
        }
        
        const tenant = await authModel.findTenantByEmail(email);
        if(tenant) {
            if(tenant.trangThai !== 'active') {
                return res.status(403).json({message: "Tenant account is not active"});
            }
            
            const isMatch = await bcrypt.compare(password, tenant.password_hash);
            if(!isMatch) {
                return res.status(401).json({message: "Password is wrong"});
            }

            const token = jwt.sign(
                {
                    id: tenant.tenant_id,
                    role: "TENANT_ADMIN",
                    tenant_id: tenant.tenant_id
                },
                process.env.JWT_SECRET, 
                { expiresIn: "1h" }
            );

            return res.json({
                message: "Tenant login successful",
                token,
                user: {
                    id: tenant.tenant_id,
                    email: tenant.email,
                    tenBanQuanLy: tenant.tenBanQuanLy,
                    tenant_id: tenant.tenant_id,
                    role: "TENANT_ADMIN"
                },
            });
        }

        return res.status(401).json({message: "Email not found"});
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Server error"});
    }
};


// exports.googleLogin = async (req, res) => {
//   try {
//     const { idToken } = req.body;

//     const decoded = await admin.auth().verifyIdToken(idToken);

//     console.log(decoded);

//   } catch (err) {
//     return res.status(401).json({ message: "Invalid token" });
//   }
// };

// exports.logout = async (req, res) => {
//   return res.status(200).json({
//     message: "Logout successful - please remove token on client",
//   });
// };