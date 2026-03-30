const axios = require("axios");

async function sendToMerchant(merchantId, title, body, extraData = {}) {
  await axios.post(
    "https://fcm.googleapis.com/fcm/send",
    {
      /// 🔥 gửi theo topic merchant
      to: `/topics/merchant_${merchantId}`,

      notification: {
        title: title,
        body: body,
      },

      data: {
        merchant_id: merchantId.toString(),
        ...extraData,
      },
    },
    {
      headers: {
        Authorization: "key=YOUR_SERVER_KEY",
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = { sendToMerchant };