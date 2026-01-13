const axios = require("axios");

const SIGNUP_API_URL =
  "http://api.igaming.demo/igaming-apigateway/public/api/accounts/signup";
const PAYMENT_API_URL =
  "http://api.igaming.demo/igaming-apigateway/public/api/thirdparty/initiate-payment";
const apiKey = "ChCETzHM0tvy7sij9fNsAto3fo6by7j9Cr931cdgr52AfYm1yF";
const hashKey = "cc594f39c3d5c9d523e1658ce7ac6816";
const signupHeaders = {
  apiId: "1001",
  apiKey: apiKey,
  hashKey: hashKey,
  "Content-Type": "application/x-www-form-urlencoded",
};
const playerPrefix = Date.now();
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
  for (let i = 1; i <= 2; i++) {
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
            paymentType: "Online",
            providerName: "alphapo",
            promoCode: {},
            providerId: 5,
            subProviderId: "",
            referenceType: "IMPS",
            referenceId: referenceId
          };
          
          const paymentHeaders = {
            ...signupHeaders,
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json"
          };
          
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
