import { createECDH } from "node:crypto";
const ecdh = createECDH("prime256v1");
ecdh.generateKeys();
const publicKey = ecdh.getPublicKey();
const privateKey = ecdh.getPrivateKey();
const b64 = value => value.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
console.log(JSON.stringify({ VAPID_PUBLIC_KEY: b64(publicKey), VAPID_PRIVATE_KEY: b64(privateKey) }));
