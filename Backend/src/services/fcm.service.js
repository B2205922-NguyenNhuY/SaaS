exports.sendToMerchant = async (merchantId, title, body, data = {}) => {
  try {
    const message = {
      topic: `merchant_${merchantId}`,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        merchant_id: merchantId.toString(),
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ FCM sent:", response);
  } catch (err) {
    console.error("❌ FCM error:", err.message);
  }
};