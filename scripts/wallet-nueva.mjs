// Genera una wallet nueva SOLO para pruebas en Polygon Amoy.
// Uso: npm run wallet:nueva
import { Wallet } from "ethers";

const wallet = Wallet.createRandom();

console.log(`
Wallet de prueba creada (no se guardó en ningún lado: cópiala ahora)

  Dirección pública : ${wallet.address}
  Clave privada     : ${wallet.privateKey}

Pasos:
  1. Pega la clave privada en .env.local:   WALLET_PRIVATE_KEY=${wallet.privateKey}
  2. Pide POL de prueba para la DIRECCIÓN en un faucet de Polygon Amoy
     (ver docs/03-guia-de-instalacion.md).
  3. Comprueba el saldo con:  npm run wallet:saldo

No compartas la clave privada ni la subas a GitHub. Nunca envíes dinero real a esta wallet.
`);
