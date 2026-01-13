const axios = require("axios");
const crypto = require("crypto");

const apiKey = "1a40846019ac8866f6347ba8b9916f1f169b3575";
const hashKey = "cc594f39c3d5c9d523e1658ce7ac681612";
const apiId = "1002";

const LOGIN_API_URL =
  "http://api.igaming.demo/igaming-apigateway/public/api/accounts/login";
const BUYIN_API_URL =
  "http://api.igaming.demo/igaming-apigateway/public/api/thirdparty/oncasino/buyIn";
const BUYOUT_API_URL =
  "http://api.igaming.demo/igaming-apigateway/public/api/thirdparty/oncasino/buyOut";

const loginHeaders = {
  apiId: apiId,
  apiKey: apiKey,
  hashKey: hashKey,
  "Content-Type": "application/x-www-form-urlencoded",
};
// Need change the api based on live and casino
// BuyIn API constants
const buyInApiId = 334;
const buyInApiKey = "xnuLrCeb1Hb86i96IEN6tdchfseWZ0";
const buyInHashKey = "1b17bb5fa8e54f23ca224218577726d0";
// Live casino 
// const buyInApiId = 335;
// const buyInApiKey = "Zr7iF9QjkGA9gn89PWb6d7mhbyBoAL";
// const buyInHashKey = "1b17bb5fa8e54f23ca224218577726d0";

// Game IDs array
// casino game id
const gameIds = [
  "DS-triplemonkey",
  "DS-partynight",
  "DS-overlordconcubine",
  "DS-dancingsamba",
  "DS-worldie",
];

// live game id
// const gameIds = [
//   "SWL-liverushroulette",
//   "SWL-blackjackmax",
//   "SWL-redroulette",
//   "DSSWL-yellowatomroulette",
//   "SWL-baccarata01nc",
// ];

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
          // console.log(`   AutoLoginToken: ${autoLoginToken}`);
          // console.log(`   UserId: ${userId}`);
          
          // Step 2: Call buyIn API
          try {
            const buyInAmount = rand(1, 2).toString(); // Random amount between 1-2
            const referenceNumber = randomNumber(12); // 12-digit random number
            const txnId = randomNumber(12); // 12-digit random number
            const timestamp = new Date().toISOString().slice(0, 19);
            
            // Generate hashKey: MD5(apiId-apiKey-sessionKey)
            const hashString = `${buyInApiId}-${buyInApiKey}-${autoLoginToken}`;
            const generatedHashKey = crypto.createHash('md5').update(hashString).digest('hex');
            
            // Get random game ID
            const selectedGameId = getRandomGameId();
            
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
            
            // Casino API returns success when errorDetails is null
            if (buyInResponse.data && buyInResponse.data.errorDetails === null) {
              console.log(`💰 ${i} BuyIn successful for ${username} - Game: ${selectedGameId}, Amount: $${buyInAmount}, Balance: ${buyInResponse.data.balance}`);
              
              // Step 3: Call buyOut API (Only if BuyIn succeeded)
              try {
                const buyOutAmount = rand(2, 100).toString(); // Random amount between 2-100
                const buyOutTxnId = randomNumber(12);
                const buyOutTimestamp = new Date().toISOString().slice(0, 19);

                const buyOutData = {
                  apiId: buyInApiId.toString(),
                  apiKey: buyInApiKey,
                  sessionKey: autoLoginToken,
                  hashKey: generatedHashKey,
                  timeStamp: buyOutTimestamp,
                  playerName: username,
                  playerId: userId.toString(),
                  gameId: selectedGameId,
                  buyOutAmount: buyOutAmount,
                  referenceNumber: referenceNumber, // Same referenceNumber
                  txnId: buyOutTxnId,
                  completed: "1",
                  device: "DESKTOP",
                  currency: "INR",
                  partialAmount: "0"
                };

                const buyOutResponse = await axios.post(BUYOUT_API_URL, buyOutData, {
                  headers: buyInHeaders,
                });

                if (buyOutResponse.data && buyOutResponse.data.errorDetails === null) {
                  console.log(`💸 ${i} BuyOut successful for ${username} - Amount: ₹${buyOutAmount}, Final Balance: ${buyOutResponse.data.balance}`);
                } else {
                  console.error(`❌ ${i} BuyOut failed for ${username}:`, buyOutResponse.data?.errorDetails?.errorMsg || "Unknown Error");
                  console.log(`   BuyOut Response:`, JSON.stringify(buyOutResponse.data, null, 2));
                }

              } catch (buyOutError) {
                console.error(`❌ ${i} BuyOut API error for ${username}:`, buyOutError.message);
              }

            } else {
              console.error(`❌ ${i} BuyIn failed for ${username}:`, buyInResponse.data?.errorDetails?.errorMsg || "Unknown Error");
              console.log(`   BuyIn Response:`, JSON.stringify(buyInResponse.data, null, 2));
            }
            
          } catch (buyInError) {
            console.error(`❌ ${i} BuyIn API error for ${username}:`, buyInError.message);
          }
        } else {
          console.warn(`⚠️  ${i} Missing autoLoginToken or userId for ${username}`);
        }
      } else {
        // API returned success: false with error codes
        const errorCodes = response.data?.code || [];
        console.error(`❌ ${i} Login failed for ${username} - Error codes: [${errorCodes.join(", ")}]`);
      }
    } catch (error) {
      console.error(`❌ ${i} Network/HTTP error for ${username}:`, error.message);
    }

    console.log("---");
  }
}

loginUsers();
