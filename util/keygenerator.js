const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

// generate a key pair
const key = ec.genKeyPair();

// generate a public key
const publicKey = key.getPublic("hex");

// generate a private key
const privateKey = key.getPrivate("hex");

// log to console
console.log("publicKey: ", publicKey);
console.log("privateKey: ", privateKey);
