const axios = require('axios');
const crypto = require('crypto');

const partnerCode = "MOMO";
const accessKey = 'F8BBA842ECF85';
const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";

exports.verifySignature = (data) => {
    const rawData =
        `accessKey=${accessKey}` +  // 🔥 FIX: dùng biến của bạn
        `&amount=${data.amount}` +
        `&extraData=${data.extraData || ""}` +
        `&message=${data.message}` +
        `&orderId=${data.orderId}` +
        `&orderInfo=${data.orderInfo}` +
        `&orderType=${data.orderType}` +
        `&partnerCode=${data.partnerCode}` +
        `&payType=${data.payType}` +
        `&requestId=${data.requestId}` +
        `&responseTime=${data.responseTime}` +
        `&resultCode=${data.resultCode}` +
        `&transId=${data.transId}`;

    const signature = crypto
        .createHmac("sha256", secretKey)
        .update(rawData)
        .digest("hex");

    console.log("RAW VERIFY:", rawData);
    console.log("SIGNATURE SERVER:", signature);
    console.log("SIGNATURE MOMO:", data.signature);

    return signature === data.signature;
};

exports.generateMomoLink = async (user, chargeIds, totalAmount, ngrokUrl) => {
    const orderId = `BILL_${Date.now()}`;
    const requestId = orderId;
    const orderInfo = `Thanh_toan_${chargeIds.length}_khoan_phi`;
    const ipnUrl = `${ngrokUrl}/api/payment/momo-webhook`;
    const redirectUrl = `${ngrokUrl}/payment-success`;

    const requestType = "payWithMethod";
    const extraData = Buffer.from(
        JSON.stringify({
            id: user.id,
            tenant_id: user.tenant_id,
            role: user.role,
            chargeIds: chargeIds
        })
    ).toString("base64");

    // 🔥 ÉP amount thành string
    const amountStr = String(totalAmount);

    // 🔥 RAW SIGNATURE (đúng thứ tự)
    const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${amountStr}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`
    ].join("&");

    const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature) // 🔥 QUAN TRỌNG
    .digest("hex");

    // 🔥 FIX: thêm accessKey
    const requestBody = {
        partnerCode,
        accessKey,
        requestId,
        amount: amountStr,
        orderId,
        orderInfo,
        redirectUrl, // dùng cùng biến
        ipnUrl,      // dùng cùng biến
        extraData,
        requestType,
        signature,
        lang: "vi"
        };

    try {
        console.log("RAW LENGTH:", rawSignature.length);
        console.log("RAW EXACT:", JSON.stringify(rawSignature));
        console.log("BODY:", JSON.stringify(requestBody, null, 2));
        const response = await axios.post(endpoint, requestBody);
        return response.data.payUrl;
    } catch (err) {
        console.log("MoMo error:", err.response?.data); // 🔥 debug
        throw err;
    }
};