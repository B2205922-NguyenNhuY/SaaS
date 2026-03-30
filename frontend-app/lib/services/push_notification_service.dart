import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';
import '../providers/notification_provider.dart';
import 'local_notification_service.dart';

class PushNotificationService {
  static void init(context) {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      print("🔥 Có thông báo Firebase");

      final noti =
          await context.read<NotificationProvider>().fetchLatest();

      if (noti != null) {
        await LocalNotificationService.show(
          noti['title'],
          noti['content'],
        );
      }
    });
  }
}