const express = require("express")
const cors = require('cors')

// Module generating JWToken as expected by Apizee's servers
const AccessToken = require("./AccessToken.js")

// Configure Express
const app = express();
app.use(express.json());
app.use(cors());

// Obtained from https://cloud.apirtc.com/enterprise/api
const apiKey = '9669e2ae3eb32307853499850770b0c3';
// Obtained from https://cloud.apirtc.com/enterprise/users-authentication
const secretKey = '0}ulE|m:[w;Do?@x2gfrux4(h4x"(2Aqm9%k>.I+k@}kn&D1';

app.post('/login', function(req, res) {
    if (true) { // USUALLY YOU SHOULD VERIFY username/password HERE
        let token = (new AccessToken(apiKey, secretKey, { apiRTC_UserAgent_Id: req.body.username, ttl: 7200 })).toJwt();
        res.status(200).send(JSON.stringify({ token: token }));
    } else {
        res.status(401).send(JSON.stringify({ error: 'Bad username/password' }));
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});