const fs = require("fs");
const path = require("path");

const receiveAddressText = path.join(__dirname, "./receiveAddress.json");

const objectAddress = JSON.parse(fs.readFileSync(receiveAddressText, "utf8"));
const PublicKey = objectAddress.publicKey;
const PrivateKey = objectAddress.privateKey;
const Address = { PrivateKey, PublicKey };
// const Address = {
//   PublicKey:
//     "042eb4afea7b2597bbc780ea94610c05b9c91f23fe6d44420c2559a85ab677571e459f999242739fc2648f9dad5c469c3d920055e5c3c73e21680a3b5b58df814f",
//   PrivateKey:
//     "a5a1f670e99fb8685e8962d37850dd6091d7076e4042e87c3fd9e6b6053a889d",
// };
module.exports = Address;
