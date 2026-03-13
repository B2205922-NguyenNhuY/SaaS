const auditLogService = require("../services/auditlog.service");

// Hàm format thời gian sang GMT+7
const formatToGMT7 = (date) => {
    if (!date) return null;
    
    // Tạo đối tượng Date từ chuỗi ISO
    const d = new Date(date);
    
    // Format theo kiểu Việt Nam (GMT+7)
    return d.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(',', '');
};

// Hàm format mảng logs
const formatLogs = (logs) => {
    if (!logs) return [];
    
    return logs.map(log => ({
        ...log,
        // Format thời gian
        thoiGianThucHien: formatToGMT7(log.thoiGianThucHien),
        created_at: log.created_at ? formatToGMT7(log.created_at) : null,
        updated_at: log.updated_at ? formatToGMT7(log.updated_at) : null,

        giaTriCu: log.giaTriCu ? 
            (typeof log.giaTriCu === 'string' ? JSON.parse(log.giaTriCu) : log.giaTriCu) 
            : null,
        giaTriMoi: log.giaTriMoi ? 
            (typeof log.giaTriMoi === 'string' ? JSON.parse(log.giaTriMoi) : log.giaTriMoi) 
            : null
    }));
};

// Lấy log theo super admin
exports.getSuperAdminLogs = async (req, res, next) => {
    try {
        const super_admin_id = req.user.admin_id;
        const logs = await auditLogService.getSuperAdminLogs(super_admin_id);
        
        // Format thời gian trước khi trả về
        const formattedLogs = formatLogs(logs);
        
        res.json({
            success: true,
            data: formattedLogs
        });
    } catch (err) {
        next(err);
    }
};

// Lấy log theo tenant
exports.getTenantLogs = async (req, res, next) => {
    try {
        const tenant_id = req.user.tenant_id;
        const logs = await auditLogService.getTenantLogs(tenant_id);
        
        // Format thời gian trước khi trả về
        const formattedLogs = formatLogs(logs);
        
        res.json({
            success: true,
            data: formattedLogs
        });
    } catch (err) {
        next(err);
    }
};

// Lấy log theo entity
exports.getEntityLogs = async (req, res, next) => {
    try {
        const { entity_type, entity_id } = req.params;
        const tenant_id = req.user.tenant_id;

        const logs = await auditLogService.getEntityLogs(
            entity_type,
            entity_id,
            tenant_id
        );
        
        // Format thời gian trước khi trả về
        const formattedLogs = formatLogs(logs);
        
        res.json({
            success: true,
            data: formattedLogs
        });
    } catch (err) {
        next(err);
    }
};