class ChargeItem extends StatelessWidget {
  final Charge c;
  final VoidCallback? onTap;

  const ChargeItem({required this.c, this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text("Charge #${c.id}"),
      subtitle: Text("Còn lại: ${c.conLai}"),
      trailing: _status(),
      onTap: onTap,
    );
  }

  Widget _status() {
    if (c.isPaid) {
      return Text("Đã thu", style: TextStyle(color: Colors.green));
    }
    if (c.isDebt) {
      return Text("Nợ", style: TextStyle(color: Colors.orange));
    }
    return Text("Chưa thu");
  }
}