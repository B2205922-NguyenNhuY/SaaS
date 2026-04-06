import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/merchant_provider.dart';
import '../../core/utils/ui_helpers.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {

  final _formKey = GlobalKey<FormState>();

  final nameCtrl = TextEditingController();
  final phoneCtrl = TextEditingController();
  final addressCtrl = TextEditingController();
  final taxCtrl = TextEditingController();
  final joinDateCtrl = TextEditingController();
    DateTime? selectedDate;
    String? errorMessage;

  @override
  void initState() {
    super.initState();

    final profile = context.read<MerchantProvider>().profile;

    if (profile != null) {
      nameCtrl.text = profile['hoTen'] ?? '';
      phoneCtrl.text = profile['soDienThoai'] ?? '';
      addressCtrl.text = profile['diaChiThuongTru'] ?? '';
      taxCtrl.text = profile['maSoThue'] ?? '';
      final dateStr = profile['ngayThamGiaKinhDoanh'];

        if (dateStr != null) {
            selectedDate = DateTime.tryParse(dateStr.toString());
            if (selectedDate != null) {
                joinDateCtrl.text =  UIHelpers.formatDateFromDateTime(selectedDate!);
            }
        }
    }

    
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MerchantProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text("Chỉnh sửa thông tin")),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [

              TextFormField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: "Họ tên"),
                validator: (v) => v!.isEmpty ? "Không được bỏ trống" : null,
              ),

              TextFormField(
                controller: phoneCtrl,
                decoration: const InputDecoration(labelText: "SĐT"),
              ),

              TextFormField(
                controller: addressCtrl,
                decoration: const InputDecoration(labelText: "Địa chỉ"),
              ),

              TextFormField(
                controller: taxCtrl,
                decoration: const InputDecoration(labelText: "Mã số thuế"),
              ),

              TextFormField(
                controller: joinDateCtrl,
                readOnly: true,
                decoration: const InputDecoration(
                    labelText: "Ngày tham gia kinh doanh",
                    suffixIcon: Icon(Icons.calendar_today),
                ),
                onTap: () async {
                    final picked = await showDatePicker(
                    context: context,
                    initialDate: selectedDate ?? DateTime.now(),
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                    );

                    if (picked != null) {
                    setState(() {
                        selectedDate = picked;
                        joinDateCtrl.text = UIHelpers.formatDateFromDateTime(picked);
                    });
                    }
                },
                ),

              const SizedBox(height: 30),

              if (errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      errorMessage!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),

              ElevatedButton(
                onPressed: () async {
                  if (!_formKey.currentState!.validate()) return;

                  setState(() {
                    errorMessage = null; // reset lỗi cũ
                  });

                  try {
                    await provider.updateProfile({
                      "hoTen": nameCtrl.text,
                      "soDienThoai": phoneCtrl.text,
                      "diaChiThuongTru": addressCtrl.text,
                      "maSoThue": taxCtrl.text,
                      "ngayThamGiaKinhDoanh": selectedDate != null
                                    ? UIHelpers.formatDateForApi(selectedDate!)
                                    : null,
                    });

                    if (context.mounted) {
                      Navigator.pop(context);

                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Cập nhật thành công")),
                      );
                    }
                  } catch (e) {
                    setState(() {
                      errorMessage =
                          e.toString().replaceAll("Exception: ", ""); // ✅ bỏ Exception
                    });

                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(errorMessage!)),
                    );
                  }
                },
                  
                child: provider.isLoading
                    ? const CircularProgressIndicator()
                    : const Text("Lưu thay đổi"),
              )
            ],
          ),
        ),
      ),
    );
  }
}