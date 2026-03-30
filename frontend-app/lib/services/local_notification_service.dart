import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class LocalNotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');

    const settings = InitializationSettings(android: android);

    await _plugin.initialize(
        const InitializationSettings(
            android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        ),
    );


  }

  static Future<void> show(String title, String body) async {
    const androidDetails = AndroidNotificationDetails(
      'channel_id',
      'General',
      importance: Importance.max,
      priority: Priority.high,
    );

    const details = NotificationDetails(android: androidDetails);

    await _plugin.show(
        0,
        title,
        body,
        const NotificationDetails(
            android: AndroidNotificationDetails(
            'channel_id',
            'channel_name',
            ),
        ),
    );
  }
}