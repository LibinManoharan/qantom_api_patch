const axios = require("axios");
const apiKey = "1a40846019ac8866f6347ba8b9916f1f169b3575";
const hashKey = "cc594f39c3d5c9d523e1658ce7ac681612";
const apiId = "1002";
const SIGNUP_API_URL =
  "http://api.igaming.demo/igaming-apigateway/public/api/accounts/signup";
const PAYMENT_API_URL =
  "http://api.igaming.demo/igaming-apigateway/public/api/thirdparty/initiate-payment";

const PAYMENT_API_SUCCESS = `http://api.igaming.demo/igaming-apigateway/public/api/thirdparty/fetchOrderDetails/alphapo/${apiId}/${apiKey}/`;


const signupHeaders = {
  apiId: apiId,
  apiKey: apiKey,
  hashKey: hashKey,
  "Content-Type": "application/x-www-form-urlencoded",
};
const playerPrefix = "user02";
// Generate random helpers
const randomNumber = (length) =>
  Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");

const randomIP = () =>
  `${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;

const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Insert 500 records
async function insertUsers() {
  for (let i = 1; i <= 50; i++) {
    const timestamp = Date.now();

    // Keep username under 20 characters (e.g., "user1_289249" = 13 chars max)
    const shortTimestamp = timestamp.toString().slice(-6); // Last 6 digits
    const username = `${playerPrefix}${i}`;
    const email = `${playerPrefix}${i}@gmail.com`;
    const mobileNo = `9${randomNumber(9)}`; // Indian 10-digit mobile
    const ipAddress = randomIP();

    const data = new URLSearchParams({
      mobile_no: mobileNo,
      ucid: `playerinsert`,
      channel: "2",
      ip_address: ipAddress,
      username: username,
      password: "Test@123",
      type: "2",
      ageconfirm: "1",
      agree: "1",
      currency: "INR",
      country_code: "+91",
      country: "101",
      state: "21",
      email: email,
      isPromotion: "1",
    });

    try {
      // Step 1: Create user account
      const signupResponse = await axios.post(SIGNUP_API_URL, data, { headers: signupHeaders });
      
      // Check if signup API returned success
      if (signupResponse.data && signupResponse.data.success === true) {
        console.log(`✅ ${i} User created: ${username}`);
        
        // Extract auth token from signup response
        const authToken = signupResponse.data?.data?.userData?.authToken;
        
        if (authToken) {
          // Step 2: Initiate payment for the newly created user
          const orderAmount = rand(10, 500).toString(); // Random amount between 10-500
          const referenceId = randomNumber(12); // 12-digit random number
          
          const paymentData = {
            ucid: "playerinsert",
            channel: "2",
            device_type: "DESKTOP",
            app_type: "WEB",
            orderAmount: orderAmount,
            paymentType: "Offline",
            providerName: "BankTransfer",
            promoCode: {},
            providerId: 1,
            subProviderId: "",
            referenceType: "IMPS",
            referenceId: referenceId
          };
          
          const paymentHeaders = {
            ...signupHeaders,
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json"
          };
          
          // Step 2: Try to initiate payment (but continue even if it fails)
          try {
            const paymentResponse = await axios.post(PAYMENT_API_URL, paymentData, { headers: paymentHeaders });
            
            if (paymentResponse.data && paymentResponse.data.success === true) {
              console.log(`💰 ${i} Payment initiated for ${username} - Amount: ₹${orderAmount}, Ref: ${referenceId}`);
            } else {
              const errorCodes = paymentResponse.data?.code || [];
              console.error(`❌ ${i} Payment failed for ${username} - Error codes: [${errorCodes.join(', ')}]`);
            }
          } catch (paymentError) {
            console.error(
              `❌ ${i} Payment API error for ${username}:`,
              paymentError.response?.data || paymentError.message
            );
          }
          
          // Step 3: Call fetchOrderDetails API (ALWAYS called, regardless of payment success/failure)
//           try {
//             const fetchOrderUrl = `${PAYMENT_API_SUCCESS}${referenceId}`;
//             console.log("fetchOrderUrl" + fetchOrderUrl);
//             const orderDetailsPayload = {
//               "id": 131536801,
//               "type": "deposit",
//               "crypto_address": {
//                 "id": 3444872,
//                 "currency": "BTC",
//                 "address": "tb1qewlyfehlsmd92a9c8fw3c9ke3q2sqrxl9wyedc",
//                 "tag": null,
//                 "foreign_id": referenceId
//               },  
//               "transactions": [
//                 {
//                   "id": 2169449,
//                   "currency": "BTC",
//                   "transaction_type": "internal",
//                   "type": "deposit",
//                   "address": "tb1qewlyfehlsmd92a9c8fw3c9ke3q2sqrxl9wyedc",
//                   "tag": null,
//                   "amount": "0.00098500",
//                   "txid": "CP:BTCW2169448",
//                   "confirmations": "0"
//                 }
//               ],
//               "fees": [
//                 {
//                   "type": "fee_crypto_deposit_internal",
//                   "currency": "BTC",
//                   "amount": "0.00000788"
//                 }
//               ],
//               "error": "",
//               "status": "confirmed"
//             };
// console.log("orderDetailsPayload:", orderDetailsPayload);
// console.log("paymentHeaders:", paymentHeaders);
//             const orderDetailsResponse = await axios.post(fetchOrderUrl, orderDetailsPayload, { headers: paymentHeaders });
            
//             if (orderDetailsResponse.data && orderDetailsResponse.data.success === true) {
//               console.log(`✅ ${i} Order details fetched for ${username} - Ref: ${referenceId}`);
//             } else {
//               const errorCodes = orderDetailsResponse.data?.code || [];
//               console.error(`❌ ${i} Order details fetch failed for ${username} - Error codes: [${errorCodes.join(', ')}]`);
//             }
        //   } catch (orderError) {
        //     console.error(
        //       `❌ ${i} Order details API error for ${username}:`,
        //       orderError.response?.data || orderError.message
        //     );
        //   }
        } else {
          console.warn(`⚠️  ${i} No auth token received for ${username}, skipping payment`);
        }
      } else {
        // API returned success: false with error codes
        const errorCodes = signupResponse.data?.code || [];
        const firstCode = signupResponse.data?.firstCode || 'N/A';
        console.error(
          `❌ ${i} Signup failed for ${username} - Error codes: [${errorCodes.join(', ')}], First code: ${firstCode}`
        );
      }
    } catch (error) {
      // Network or HTTP error
      console.error(
        `❌ ${i} Network/HTTP error for ${username}:`,
        error.response?.data || error.message
      );
    }
  }
}

insertUsers();
