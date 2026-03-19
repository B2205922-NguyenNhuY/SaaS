import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';

class TenantAdminScreen extends StatelessWidget {
  const TenantAdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Row(
        children: [
          _buildSidebar(context, auth),
          Expanded(
            child: Column(
              children: [
                _buildTopBar(auth),
                Expanded(
                  child: Center(
                    child: Text(
                      'Tenant Admin Dashboard',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSidebar(BuildContext context, AuthProvider auth) {
    return Container(
      width: 240,
      color: AppColors.primary,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                const Icon(Icons.hub_rounded, color: Colors.white, size: 28),
                const SizedBox(width: 10),
                Text('MarketHub',
                  style: GoogleFonts.inter(
                    color: Colors.white, fontSize: 18,
                    fontWeight: FontWeight.w700,
                  )),
              ],
            ),
          ),
          Container(height: 1, color: Colors.white12),
          const SizedBox(height: 8),
          // Badge role
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.business_rounded, color: Colors.white, size: 14),
                const SizedBox(width: 6),
                Text('Tenant Admin',
                  style: GoogleFonts.inter(
                    color: Colors.white, fontSize: 12,
                    fontWeight: FontWeight.w600,
                  )),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _buildMenuItem(Icons.dashboard_rounded,   'Dashboard',      true),
          _buildMenuItem(Icons.store_rounded,       'Chợ / Khu vực',  false),
          _buildMenuItem(Icons.grid_view_rounded,   'Kiosk',          false),
          _buildMenuItem(Icons.people_alt_rounded,  'Tiểu thương',    false),
          _buildMenuItem(Icons.receipt_long_rounded,'Thu phí',        false),
          _buildMenuItem(Icons.bar_chart_rounded,   'Báo cáo',        false),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextButton.icon(
              onPressed: () {
                context.read<AuthProvider>().logout();
                Navigator.pushReplacementNamed(context, '/');
              },
              icon: const Icon(Icons.logout_rounded, color: Colors.white54, size: 18),
              label: Text('Đăng xuất',
                style: GoogleFonts.inter(color: Colors.white54, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String label, bool isActive) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      decoration: BoxDecoration(
        color: isActive ? Colors.white.withValues(alpha: 0.15) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        leading: Icon(icon,
          color: isActive ? Colors.white : Colors.white60, size: 20),
        title: Text(label,
          style: GoogleFonts.inter(
            color: isActive ? Colors.white : Colors.white60,
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          )),
        dense: true,
        onTap: () {},
      ),
    );
  }

  Widget _buildTopBar(AuthProvider auth) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        children: [
          Text('Dashboard', style: GoogleFonts.inter(
            fontSize: 18, fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          )),
          const Spacer(),
          CircleAvatar(
            backgroundColor: AppColors.primary,
            radius: 18,
            child: Text(
              (auth.userName?.isNotEmpty == true)
                ? auth.userName![0].toUpperCase()
                : 'T',
              style: GoogleFonts.inter(
                color: Colors.white, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 10),
          Text(auth.userName ?? 'Tenant Admin',
            style: GoogleFonts.inter(
              fontSize: 14, color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
            )),
        ],
      ),
    );
  }
}