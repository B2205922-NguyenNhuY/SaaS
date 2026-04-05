class FormatUtils {
  static String money(num value) {
    final negative = value < 0;
    final text = value.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      final indexFromEnd = text.length - i;
      buffer.write(text[i]);
      if (indexFromEnd > 1 && indexFromEnd % 3 == 1) {
        buffer.write('.');
      }
    }
    return '${negative ? '-' : ''}${buffer.toString()} đ';
  }

  static String dateTime(String? raw) {
    if (raw == null || raw.trim().isEmpty) return '--';
    final dt = DateTime.tryParse(raw)?.toLocal();
    if (dt == null) return raw;
    final dd = dt.day.toString().padLeft(2, '0');
    final mm = dt.month.toString().padLeft(2, '0');
    final yyyy = dt.year.toString();
    final hh = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    return '$dd/$mm/$yyyy $hh:$min';
  }
}
