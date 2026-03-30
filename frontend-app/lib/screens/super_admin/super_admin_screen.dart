import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';

class SuperAdminApiService {
  static const String baseUrl = 'http://localhost:3000/api';

  static Map<String, String> _headers(String token) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  static Future<List<dynamic>> getTenants(String token) async {
    final res = await http.get(
      Uri.parse('$baseUrl/tenant'), headers: _headers(token));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data is List) return data;
      if (data is Map) return data['data'] ?? data['rows'] ?? [];
      return [];
    }
    return [];
  }

  static Future<List<dynamic>> getPlans(String token) async {
    final res = await http.get(
      Uri.parse('$baseUrl/plan'), headers: _headers(token));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data is List) return data;
      if (data is Map) return data['data'] ?? data['rows'] ?? [];
      return [];
    }
    return [];
  }

  static Future<List<dynamic>> getSubscriptions(String token) async {
    final res = await http.get(
      Uri.parse('$baseUrl/plan_subscription'), headers: _headers(token));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data is List) return data;
      if (data is Map) return data['data'] ?? data['rows'] ?? [];
      return [];
    }
    return [];
  }

  static Future<List<dynamic>> getUsers(String token) async {
    final res = await http.get(
      Uri.parse('$baseUrl/users'), headers: _headers(token));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data is List) return data;
      if (data is Map) return data['data'] ?? data['rows'] ?? [];
      return [];
    }
    return [];
  }

  static Future<List<dynamic>> getAuditLogs(String token) async {
    final res = await http.get(
      Uri.parse('$baseUrl/audit_logs'), headers: _headers(token));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data is List) return data;
      if (data is Map) return data['data'] ?? data['rows'] ?? [];
      return [];
    }
    return [];
  }
}

enum AdminPage { dashboard, tenants, plans, subscriptions, users, auditLog }


//  MAIN SCREEN
class SuperAdminScreen extends StatefulWidget {
  const SuperAdminScreen({super.key});
  @override
  State<SuperAdminScreen> createState() => _SuperAdminScreenState();
}

class _SuperAdminScreenState extends State<SuperAdminScreen> {
  AdminPage _currentPage = AdminPage.dashboard;
  List<dynamic> _tenants = [], _plans = [], _subscriptions = [],
                _users = [], _auditLogs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  Future<void> _loadData() async {
      final token = context.read<AuthProvider>().token ?? '';
      setState(() => _loading = true);
      try {
        final results = await Future.wait([
          SuperAdminApiService.getTenants(token).catchError((_) => <dynamic>[]),
          SuperAdminApiService.getPlans(token).catchError((_) => <dynamic>[]),
          SuperAdminApiService.getSubscriptions(token).catchError((_) => <dynamic>[]),
          SuperAdminApiService.getUsers(token).catchError((_) => <dynamic>[]),
          SuperAdminApiService.getAuditLogs(token).catchError((_) => <dynamic>[]),
        ]);
        setState(() {
          _tenants       = (results[0] is List) ? results[0] : [];
          _plans         = (results[1] is List) ? results[1] : [];
          _subscriptions = (results[2] is List) ? results[2] : [];
          _users         = (results[3] is List) ? results[3] : [];
          _auditLogs     = (results[4] is List) ? results[4] : [];
          _loading       = false;
        });
      } catch (e) {
        setState(() {
          _tenants = _plans = _subscriptions = _users = _auditLogs = [];
          _loading = false;
        });
      }
    }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Row(children: [
        _buildSidebar(auth),
        Expanded(child: Column(children: [
          _buildTopBar(),
          Expanded(child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _buildContent()),
        ])),
      ]),
    );
  }


  //  SIDEBAR
   Widget _buildSidebar(AuthProvider auth) {
    return Container(
      width: 256,
      decoration: const BoxDecoration(
        color: AppColors.primaryDark,
        boxShadow: [BoxShadow(color: Color(0x33000000), blurRadius: 16)],
      ),
      child: Column(children: [
        // Logo 
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 1, vertical: 1),
          width: double.infinity,
          child: Center(
            child: Image.asset(
              'assets/images/logo.png',
              height: 150,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.hub_rounded, color: Colors.white, size: 60),
            ),
          ),
        ),
        Container(height: 1, color: Colors.white12),
        const SizedBox(height: 8),

        // Badge
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.amber.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.amber.withValues(alpha: 0.4)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.star_rounded, color: Colors.amber, size: 14),
            const SizedBox(width: 6),
            Text('Super Admin', style: GoogleFonts.inter(
              color: Colors.amber, fontSize: 12, fontWeight: FontWeight.w600)),
          ]),
        ),
        const SizedBox(height: 12),

        // Menu items
        _menuItem(Icons.dashboard_rounded,      'Dashboard',      AdminPage.dashboard),
        _menuItem(Icons.business_rounded,        'Quản lý Tenant', AdminPage.tenants),
        _menuItem(Icons.card_membership_rounded, 'Gói cước',       AdminPage.plans),
        _menuItem(Icons.sync_alt_rounded,        'Subscription',   AdminPage.subscriptions),
        _menuItem(Icons.people_alt_rounded,      'Người dùng',     AdminPage.users),
        _menuItem(Icons.history_rounded,         'Audit Log',      AdminPage.auditLog),

        const Spacer(),
        const Divider(color: Colors.white12, height: 1),

        // User + logout
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            CircleAvatar(
              backgroundColor: AppColors.primaryLight,
              radius: 16,
              child: Text(
                (auth.userName?.isNotEmpty == true)
                    ? auth.userName![0].toUpperCase() : 'S',
                style: GoogleFonts.inter(
                  color: Colors.white, fontWeight: FontWeight.w700,
                  fontSize: 13)),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(auth.userName ?? 'Super Admin',
              style: GoogleFonts.inter(color: Colors.white70, fontSize: 12),
              overflow: TextOverflow.ellipsis)),
            IconButton(
              icon: const Icon(Icons.logout_rounded,
                color: Colors.white38, size: 18),
              tooltip: 'Đăng xuất',
              onPressed: () {
                context.read<AuthProvider>().logout();
                Navigator.pushReplacementNamed(context, '/');
              },
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _menuItem(IconData icon, String label, AdminPage page) {
    final isActive = _currentPage == page;
    return GestureDetector(
      onTap: () => setState(() => _currentPage = page),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isActive
              ? Colors.white.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          Icon(icon,
            color: isActive ? Colors.white : Colors.white54, size: 20),
          const SizedBox(width: 12),
          Text(label, style: GoogleFonts.inter(
            color: isActive ? Colors.white : Colors.white60,
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400)),
        ]),
      ),
    );
  }

  //  TOP BAR
  Widget _buildTopBar() {
    final titles = {
      AdminPage.dashboard:     'Dashboard',
      AdminPage.tenants:       'Quản lý Tenant',
      AdminPage.plans:         'Gói cước (Plans)',
      AdminPage.subscriptions: 'Subscription',
      AdminPage.users:         'Người dùng',
      AdminPage.auditLog:      'Audit Log',
    };
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 28),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(children: [
        Text(titles[_currentPage] ?? '', style: GoogleFonts.inter(
          fontSize: 18, fontWeight: FontWeight.w700,
          color: AppColors.textPrimary)),
        const Spacer(),
        IconButton(
          icon: const Icon(Icons.refresh_rounded,
            color: AppColors.textSecondary),
          tooltip: 'Làm mới',
          onPressed: _loadData),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20)),
          child: Row(children: [
            const Icon(Icons.circle, color: Colors.green, size: 8),
            const SizedBox(width: 6),
            Text('Online', style: GoogleFonts.inter(
              fontSize: 12, color: AppColors.primary,
              fontWeight: FontWeight.w500)),
          ]),
        ),
      ]),
    );
  }

 
  //  CONTENT ROUTER
 Widget _buildContent() {
    switch (_currentPage) {
      case AdminPage.dashboard:     return _buildDashboard();
      case AdminPage.tenants:       return _buildTenantsPage();
      case AdminPage.plans:         return _buildPlansPage();
      case AdminPage.subscriptions: return _buildSubscriptionsPage();
      case AdminPage.users:         return _buildUsersPage();
      case AdminPage.auditLog:      return _buildAuditLogPage();
      default:                      return _buildDashboard();
    }
  }


  //  DASHBOARD
  Widget _buildDashboard() {
    // THAY BẰNG
    final tenantList       = (_tenants       is List) ? List<dynamic>.from(_tenants)       : <dynamic>[];
    final planList         = (_plans         is List) ? List<dynamic>.from(_plans)         : <dynamic>[];
    final subscriptionList = (_subscriptions is List) ? List<dynamic>.from(_subscriptions) : <dynamic>[];
    final userList         = (_users         is List) ? List<dynamic>.from(_users)         : <dynamic>[];
    final logList          = (_auditLogs     is List) ? List<dynamic>.from(_auditLogs)     : <dynamic>[];

    final activeTenants = tenantList
        .where((t) => t is Map && t['trangThai'] == 'active').length;
    final activePlans = planList
        .where((p) => p is Map && p['trangThai'] == 'active').length;
    final activeSubs = subscriptionList
        .where((s) => s is Map && s['trangThai'] == 'active').length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Stat cards
        Row(children: [
          Expanded(child: _statCard('Tổng Tenant', '${tenantList.length}',
            Icons.business_rounded, AppColors.primary,
            sub: '$activeTenants đang hoạt động')),
          const SizedBox(width: 16),
          Expanded(child: _statCard('Gói cước', '${planList.length}',
            Icons.card_membership_rounded, const Color(0xFF7C3AED),
            sub: '$activePlans đang kích hoạt')),
          const SizedBox(width: 16),
          Expanded(child: _statCard('Subscription', '${subscriptionList.length}',
            Icons.sync_alt_rounded, const Color(0xFF059669),
            sub: '$activeSubs đang active')),
          const SizedBox(width: 16),
          Expanded(child: _statCard('Người dùng', '${userList.length}',
            Icons.people_alt_rounded, const Color(0xFFD97706),
            sub: 'Toàn hệ thống')),
        ]),
        const SizedBox(height: 24),

        // Recent tenants + logs
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(flex: 3, child: _card(
            title: 'Tenant gần đây',
            action: TextButton(
              onPressed: () => setState(() => _currentPage = AdminPage.tenants),
              child: Text('Xem tất cả', style: GoogleFonts.inter(
                color: AppColors.primary, fontSize: 13))),
            child: Column(children: tenantList.isEmpty
              ? [_emptyState('Chưa có tenant nào')]
              : tenantList.take(5).map((t) => _tenantListItem(t)).toList()),
          )),
          const SizedBox(width: 16),
          Expanded(flex: 2, child: _card(
            title: 'Hoạt động gần đây',
            action: TextButton(
              onPressed: () => setState(() => _currentPage = AdminPage.auditLog),
              child: Text('Xem tất cả', style: GoogleFonts.inter(
                color: AppColors.primary, fontSize: 13))),
            child: Column(children: logList.isEmpty
              ? [_emptyState('Chưa có log nào')]
              : logList.take(6).map((l) => _logListItem(l)).toList()),
          )),
        ]),
      ]),
    );
  }

  Widget _statCard(String title, String value, IconData icon, Color color,
      {String sub = ''}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(
          color: color.withValues(alpha: 0.1),
          blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(title, style: GoogleFonts.inter(
            fontSize: 13, color: AppColors.textSecondary)),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 20)),
        ]),
        const SizedBox(height: 12),
        Text(value, style: GoogleFonts.inter(
          fontSize: 28, fontWeight: FontWeight.w700,
          color: AppColors.textPrimary)),
        if (sub.isNotEmpty) Text(sub, style: GoogleFonts.inter(
          fontSize: 12, color: AppColors.textSecondary)),
      ]),
    );
  }


  //  TENANTS PAGE
  Widget _buildTenantsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: _card(
        title: 'Danh sách Tenant (${_tenants.length})',
        action: ElevatedButton.icon(
          onPressed: () => _showCreateTenantDialog(),
          icon: const Icon(Icons.add, size: 18),
          label: Text('Tạo Tenant', style: GoogleFonts.inter(fontSize: 13)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white, elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10)))),
        child: _tenants.isEmpty
          ? _emptyState('Chưa có tenant nào')
          : _buildDataTable(
              columns: ['Tên', 'Email', 'Trạng thái', 'Ngày tạo', 'Thao tác'],
              rows: _tenants.map((t) => [
                t['tenCongTy'] ?? t['tenTenant'] ?? '—',
                t['email'] ?? '—',
                t['trangThai'] ?? '—',
                _formatDate(t['created_at']),
                'action:${t['tenant_id']}',
              ]).toList()),
      ),
    );
  }

  void _showCreateTenantDialog() {
    showDialog(
      context: context,
      builder: (_) => _CreateTenantDialog(
        token: context.read<AuthProvider>().token ?? '',
        onSuccess: _loadData));
  }

 
  //  PLANS PAGE
  Widget _buildPlansPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: _card(
        title: 'Gói cước (${_plans.length})',
        action: ElevatedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.add, size: 18),
          label: Text('Tạo Plan', style: GoogleFonts.inter(fontSize: 13)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white, elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10)))),
        child: _plans.isEmpty
          ? _emptyState('Chưa có gói cước nào')
          : _buildDataTable(
              columns: ['Tên gói', 'Giá', 'Số chợ', 'Số kiosk', 'Trạng thái', 'Thao tác'],
              rows: _plans.map((p) => [
                p['tenGoi'] ?? p['ten'] ?? '—',
                _formatPrice(p['gia']),
                '${p['maxMarkets'] ?? p['soChoToiDa'] ?? '∞'}',
                '${p['maxKiosks'] ?? p['soKioskToiDa'] ?? '∞'}',
                p['trangThai'] ?? '—',
                'action:${p['plan_id']}',
              ]).toList()),
      ),
    );
  }

  //  SUBSCRIPTIONS PAGE
  Widget _buildSubscriptionsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: _card(
        title: 'Subscription (${_subscriptions.length})',
        child: _subscriptions.isEmpty
          ? _emptyState('Chưa có subscription nào')
          : _buildDataTable(
              columns: ['Tenant ID', 'Plan ID', 'Ngày bắt đầu', 'Ngày hết hạn', 'Trạng thái'],
              rows: _subscriptions.map((s) => [
                '${s['tenant_id'] ?? '—'}',
                '${s['plan_id'] ?? '—'}',
                _formatDate(s['ngayBatDau'] ?? s['start_date']),
                _formatDate(s['ngayKetThuc'] ?? s['end_date']),
                s['trangThai'] ?? '—',
              ]).toList()),
      ),
    );
  }

  //  USERS PAGE
  Widget _buildUsersPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: _card(
        title: 'Người dùng (${_users.length})',
        child: _users.isEmpty
          ? _emptyState('Chưa có người dùng nào')
          : _buildDataTable(
              columns: ['Họ tên', 'Email', 'Vai trò', 'Tenant', 'Trạng thái', 'Thao tác'],
              rows: _users.map((u) => [
                u['hoTen'] ?? '—',
                u['email'] ?? '—',
                u['tenVaiTro'] ?? u['role'] ?? '—',
                '${u['tenant_id'] ?? '—'}',
                u['trangThai'] ?? '—',
                'action:${u['user_id']}',
              ]).toList()),
      ),
    );
  }


  //  AUDIT LOG PAGE
  Widget _buildAuditLogPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: _card(
        title: 'Nhật ký hoạt động (${_auditLogs.length})',
        child: _auditLogs.isEmpty
          ? _emptyState('Chưa có log nào')
          : Column(children: _auditLogs.take(50)
              .map((l) => _logDetailItem(l)).toList()),
      ),
    );
  }

  //  SHARED WIDGETS
  Widget _card({required String title, required Widget child, Widget? action}) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(
          color: AppColors.cardShadow,
          blurRadius: 20, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(title, style: GoogleFonts.inter(
            fontSize: 15, fontWeight: FontWeight.w700,
            color: AppColors.textPrimary)),
          if (action != null) action,
        ]),
        const SizedBox(height: 4),
        const Divider(color: AppColors.divider),
        const SizedBox(height: 8),
        child,
      ]),
    );
  }

  Widget _buildDataTable({
    required List<String> columns,
    required List<List<dynamic>> rows,
  }) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowColor: WidgetStateProperty.all(AppColors.background),
        dataRowColor: WidgetStateProperty.resolveWith((s) =>
          s.contains(WidgetState.hovered)
              ? AppColors.primary.withValues(alpha: 0.04) : null),
        columnSpacing: 20,
        headingTextStyle: GoogleFonts.inter(
          fontSize: 12, fontWeight: FontWeight.w600,
          color: AppColors.textSecondary),
        dataTextStyle: GoogleFonts.inter(
          fontSize: 13, color: AppColors.textPrimary),
        columns: columns.map((c) => DataColumn(label: Text(c))).toList(),
        rows: rows.map((row) => DataRow(
          cells: row.map((cell) {
            final cellStr = cell?.toString() ?? '—';
            if (cellStr.startsWith('action:')) {
              return DataCell(Row(mainAxisSize: MainAxisSize.min, children: [
                _iconBtn(Icons.edit_outlined, AppColors.primary, () {}),
                const SizedBox(width: 4),
                _iconBtn(Icons.block_rounded, AppColors.error, () {}),
              ]));
            }
            if (['active','inactive','expired','trial','pending']
                .contains(cell)) {
              return DataCell(_statusBadge(cell));
            }
            return DataCell(Text(cell));
          }).toList(),
        )).toList(),
      ),
    );
  }

  Widget _iconBtn(IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: color, size: 16)),
    );
  }

  Widget _statusBadge(String status) {
    final map = {
      'active':   (const Color(0xFF059669), const Color(0xFFD1FAE5)),
      'inactive': (const Color(0xFFDC2626), const Color(0xFFFEE2E2)),
      'expired':  (const Color(0xFFD97706), const Color(0xFFFEF3C7)),
      'trial':    (const Color(0xFF7C3AED), const Color(0xFFEDE9FE)),
      'pending':  (AppColors.textSecondary, AppColors.background),
    };
    final c = map[status] ?? (AppColors.textSecondary, AppColors.background);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.$2, borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: GoogleFonts.inter(
        fontSize: 11, color: c.$1, fontWeight: FontWeight.w600)),
    );
  }

  Widget _tenantListItem(dynamic t) {
    final name = t['tenCongTy'] ?? t['tenTenant'] ?? 'T';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(children: [
        CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          radius: 18,
          child: Text(name.toString().substring(0,1).toUpperCase(),
            style: GoogleFonts.inter(
              color: AppColors.primary, fontWeight: FontWeight.w700))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          Text(name.toString(), style: GoogleFonts.inter(
            fontSize: 13, fontWeight: FontWeight.w600,
            color: AppColors.textPrimary)),
          Text(t['email'] ?? '—', style: GoogleFonts.inter(
            fontSize: 12, color: AppColors.textSecondary)),
        ])),
        _statusBadge(t['trangThai'] ?? 'inactive'),
      ]),
    );
  }

  Widget _logListItem(dynamic log) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        Container(width: 8, height: 8,
          decoration: const BoxDecoration(
            color: AppColors.primary, shape: BoxShape.circle)),
        const SizedBox(width: 10),
        Expanded(child: Text(log['action'] ?? '—',
          style: GoogleFonts.inter(
            fontSize: 12, color: AppColors.textPrimary))),
        Text(_formatDate(log['created_at']),
          style: GoogleFonts.inter(
            fontSize: 11, color: AppColors.textSecondary)),
      ]),
    );
  }

  Widget _logDetailItem(dynamic log) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.divider)),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(6)),
          child: Text(log['action'] ?? '—', style: GoogleFonts.inter(
            fontSize: 11, color: AppColors.primary,
            fontWeight: FontWeight.w600))),
        const SizedBox(width: 12),
        Expanded(child: Text(
          '${log['entity_type'] ?? ''} #${log['entity_id'] ?? ''}',
          style: GoogleFonts.inter(
            fontSize: 12, color: AppColors.textSecondary))),
        Text(_formatDate(log['created_at']),
          style: GoogleFonts.inter(
            fontSize: 11, color: AppColors.textSecondary)),
      ]),
    );
  }

  Widget _emptyState(String msg) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Center(child: Column(children: [
        const Icon(Icons.inbox_rounded, color: AppColors.textHint, size: 40),
        const SizedBox(height: 8),
        Text(msg, style: GoogleFonts.inter(
          color: AppColors.textSecondary, fontSize: 14)),
      ])),
    );
  }

  String _formatDate(dynamic d) {
    if (d == null) return '—';
    try {
      final dt = DateTime.parse(d.toString());
      return '${dt.day.toString().padLeft(2,'0')}/'
             '${dt.month.toString().padLeft(2,'0')}/${dt.year}';
    } catch (_) { return d.toString(); }
  }

  String _formatPrice(dynamic p) {
    if (p == null) return '—';
    try {
      final n = double.parse(p.toString());
      return '${n.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]},')}đ';
    } catch (_) { return p.toString(); }
  }
}

//  CREATE TENANT DIALOG
class _CreateTenantDialog extends StatefulWidget {
  final String token;
  final VoidCallback onSuccess;
  const _CreateTenantDialog({required this.token, required this.onSuccess});
  @override
  State<_CreateTenantDialog> createState() => _CreateTenantDialogState();
}

class _CreateTenantDialogState extends State<_CreateTenantDialog> {
  final _tenantNameCtrl = TextEditingController();
  final _emailCtrl      = TextEditingController();
  final _phoneCtrl      = TextEditingController();
  final _adminNameCtrl  = TextEditingController();
  final _adminEmailCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      final res = await http.post(
        Uri.parse('http://localhost:3000/api/tenant'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
        body: jsonEncode({
          'tenCongTy':   _tenantNameCtrl.text,
          'email':       _emailCtrl.text,
          'soDienThoai': _phoneCtrl.text,
          'admin': {
            'hoTen': _adminNameCtrl.text,
            'email': _adminEmailCtrl.text,
          },
        }),
      );
      if (res.statusCode == 201) {
        widget.onSuccess();
        if (mounted) Navigator.pop(context);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Tạo tenant thành công!')));
      } else {
        throw Exception(jsonDecode(res.body)['message'] ?? 'Lỗi');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Lỗi: $e')));
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text('Tạo Tenant mới', style: GoogleFonts.inter(
        fontWeight: FontWeight.w700, fontSize: 18)),
      content: SizedBox(width: 480, child: Column(
        mainAxisSize: MainAxisSize.min, children: [
        _field(_tenantNameCtrl, 'Tên công ty / Ban quản lý chợ'),
        const SizedBox(height: 12),
        _field(_emailCtrl, 'Email tenant'),
        const SizedBox(height: 12),
        _field(_phoneCtrl, 'Số điện thoại'),
        const Divider(height: 24),
        Text('Tài khoản Admin ban đầu', style: GoogleFonts.inter(
          fontSize: 13, fontWeight: FontWeight.w600,
          color: AppColors.textSecondary)),
        const SizedBox(height: 12),
        _field(_adminNameCtrl, 'Họ tên admin'),
        const SizedBox(height: 12),
        _field(_adminEmailCtrl, 'Email admin'),
      ])),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Huỷ', style: GoogleFonts.inter(
            color: AppColors.textSecondary))),
        ElevatedButton(
          onPressed: _loading ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10))),
          child: _loading
            ? const SizedBox(width: 18, height: 18,
                child: CircularProgressIndicator(
                  color: Colors.white, strokeWidth: 2))
            : Text('Tạo', style: GoogleFonts.inter())),
      ],
    );
  }

  Widget _field(TextEditingController ctrl, String label) {
    return TextField(
      controller: ctrl,
      style: GoogleFonts.inter(fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.inter(fontSize: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(
            color: AppColors.primary, width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14, vertical: 12)),
    );
  }

  @override
  void dispose() {
    _tenantNameCtrl.dispose(); _emailCtrl.dispose();
    _phoneCtrl.dispose(); _adminNameCtrl.dispose();
    _adminEmailCtrl.dispose();
    super.dispose();
  }
}