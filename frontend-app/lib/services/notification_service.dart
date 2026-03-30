import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();

  /// 🔥 INIT
  static Future<void> init() async {
    await _fcm.requestPermission();

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');

    const settings = InitializationSettings(android: android);

    // ✅ dùng named parameter
    await _local.initialize(
      settings: settings,
    );

    FirebaseMessaging.onMessage.listen((RemoteMessage msg) {
      final title = msg.notification?.title ?? '';
      final body = msg.notification?.body ?? '';

      _showLocal(title, body);
    });
  }

  /// 🔥 subscribe topic
  static Future<void> subscribeMerchant(int merchantId) async {
    await _fcm.subscribeToTopic("merchant_$merchantId");
  }

  /// 🔔 show notification
  static Future<void> _showLocal(String title, String body) async {
    const androidDetails = AndroidNotificationDetails(
      'channel_id',
      'channel_name',
      importance: Importance.max,
      priority: Priority.high,
    );

    const details = NotificationDetails(android: androidDetails);

    // ✅ dùng named parameters
    await _local.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      notificationDetails: details,
    );
  }
}