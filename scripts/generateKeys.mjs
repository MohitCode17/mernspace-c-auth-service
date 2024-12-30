import fs from "fs";
import crypto from "crypto";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048, // Corrected property name
  publicKeyEncoding: {
    type: "pkcs1", // Type of encoding to be used
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs1", // Type of encoding to be used
    format: "pem",
  },
});

// console.log("Public Key: ", publicKey);
// console.log("Private Key: ", privateKey);

fs.writeFileSync("certs/public.pem", publicKey);
fs.writeFileSync("certs/private.pem", privateKey);
