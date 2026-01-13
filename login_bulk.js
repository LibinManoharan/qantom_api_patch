const axios = require("axios");
const crypto = require("crypto");

const apiKey = "1a40846019ac8866f6347ba8b9916f1f169b3575";
const hashKey = "cc594f39c3d5c9d523e1658ce7ac681612";
const apiId = "1002";

const LOGIN_API_URL =
  "http://api.igaming.demo/igaming-apigateway/public/api/accounts/login";
const BUYIN_API_URL =
  "http://api.igaming.demo/igaming-apigateway/public/api/thirdparty/oncasino/buyIn";

const loginHeaders = {
  apiId: apiId,
  apiKey: apiKey,
  hashKey: hashKey,
  "Content-Type": "application/x-www-form-urlencoded",
};

// BuyIn API constants
const buyInApiId = 334;
const buyInApiKey = "xnuLrCeb1Hb86i96IEN6tdchfseWZ0";
const buyInHashKey = "1b17bb5fa8e54f23ca224218577726d0";

// Game IDs array
const gameIds = [
  "DS-triplemonkey",
  "DS-partynight",
  "DS-overlordconcubine",
  "DS-dancingsamba",
  "DS-worldie"
];

const playerPrefix = "user02";
const password = "Test@123";
const basePlayerId = 117555; // Starting player ID

// Generate random helpers
const randomNumber = (length) =>
  Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");

const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Get random game ID from array
const getRandomGameId = () => gameIds[Math.floor(Math.random() * gameIds.length)];

// Login users from user021 to user0250
async function loginUsers() {
  for (let i = 1; i <= 50; i++) {
    const username = `${playerPrefix}${i}`;

    const loginData = new URLSearchParams({
      type: "2",
      device_type: "DESKTOP",
      username: username,
      password: password,
      app_type: "WEB",
      channel: "1",
    });

    try {
      const response = await axios.post(LOGIN_API_URL, loginData, {
        headers: loginHeaders,
      });

      // Check if login API returned success
      if (response.data && response.data.success === true) {
        console.log(`✅ ${i} Login successful: ${username}`);
        
        // Extract autoLoginToken and userId from login response
        const autoLoginToken = response.data?.data?.userData?.autoLoginToken;
        const userId = response.data?.data?.userData?.userid;
        
        if (autoLoginToken && userId) {
          console.log(`   AutoLoginToken: ${autoLoginToken}`);
          console.log(`   UserId: ${userId}`);
          
          // Step 2: Call buyIn API
          try {
            const buyInAmount = rand(1, 2).toString(); // Random amount between 1-100
            const referenceNumber = randomNumber(12); // 12-digit random number
            const txnId = randomNumber(12); // 12-digit random number
            const timestamp = new Date().toISOString().slice(0, 19); // Format: 2025-08-12T15:44:36
            
            // Generate hashKey: MD5(apiId-apiKey-sessionKey)
            const hashString = `${buyInApiId}-${buyInApiKey}-${autoLoginToken}`;
            const generatedHashKey = crypto.createHash('md5').update(hashString).digest('hex');
            
            // Get random game ID
            const selectedGameId = getRandomGameId();
            
            console.log(`   Generated HashKey: ${generatedHashKey}`);
            console.log(`   Selected Game: ${selectedGameId}`);
            
            const buyInData = {
              apiId: buyInApiId,
              apiKey: buyInApiKey,
              sessionKey: autoLoginToken,
              hashKey: generatedHashKey,
              playerName: username,
              playerId: userId.toString(),
              timeStamp: timestamp,
              gameId: selectedGameId,
              buyInAmount: buyInAmount,
              referenceNumber: referenceNumber,
              txnId: txnId,
              tip: "0",
              completed: "0",
              device: "DESKTOP",
              currency: "USD"
            };
            
            const buyInHeaders = {
              ...loginHeaders,
              "Content-Type": "application/json"
            };
            
            const buyInResponse = await axios.post(BUYIN_API_URL, buyInData, {
              headers: buyInHeaders,
            });
            
            if (buyInResponse.data && buyInResponse.data.success === true) {
              console.log(`💰 ${i} BuyIn successful for ${username} - Amount: $${buyInAmount}, Ref: ${referenceNumber}`);
            } else {
              const errorCodes = buyInResponse.data?.code || [];
              console.error(`❌ ${i} BuyIn failed for ${username} - Error codes: [${errorCodes.join(', ')}]`);
            }
            console.log(`   BuyIn Response:`, JSON.stringify(buyInResponse.data, null, 2));
            
          } catch (buyInError) {
            console.error(`❌ ${i} BuyIn API error for ${username}:`);
            console.log(
              `   Error:`,
              JSON.stringify(buyInError.response?.data || buyInError.message, null, 2)
            );
          }
        } else {
          console.warn(`⚠️  ${i} Missing autoLoginToken or userId for ${username}`);
        }
      } else {
        // API returned success: false with error codes
        const errorCodes = response.data?.code || [];
        const firstCode = response.data?.firstCode || "N/A";
        console.error(
          `❌ ${i} Login failed for ${username} - Error codes: [${errorCodes.join(
            ", "
          )}], First code: ${firstCode}`
        );
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      // Network or HTTP error
      console.error(`❌ ${i} Network/HTTP error for ${username}:`);
      console.log(
        `   Error:`,
        JSON.stringify(error.response?.data || error.message, null, 2)
      );
    }

    console.log("---"); // Separator between users
  }
}

loginUsers();
