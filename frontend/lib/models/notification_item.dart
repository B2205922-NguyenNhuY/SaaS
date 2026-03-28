class NotificationItem {
  final int notificationId;
  final String title;
  final String content;
  final String? type;
  final String? targetRole;
  final String? createdAt;
  final String? expiresAt;
  final bool isRead;

  const NotificationItem({
    required this.notificationId,
    required this.title,
    required this.content,
    required this.type,
    required this.targetRole,
    required this.createdAt,
    required this.expiresAt,
    required this.isRead,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      notificationId: _toInt(json['notification_id']) ?? 0,
      title: (json['title'] ?? '').toString(),
      content: (json['content'] ?? '').toString(),
      type: json['type']?.toString(),
      targetRole: json['target_role']?.toString(),
      createdAt: json['created_at']?.toString(),
      expiresAt: json['expires_at']?.toString(),
      isRead: json['is_read'] == 1 || json['is_read'] == true,
    );
  }
}

int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse(value.toString());
}
