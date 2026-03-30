import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;

  const AppAppBar({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),

      leading: Navigator.canPop(context)
          ? IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => context.pop(),
            )
          : null,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}