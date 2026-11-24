// Genera una wallet nueva para sellar en Polygon (Amoy o red principal).
// Uso: npm run wallet:nueva
import { Wallet } from "ethers";

const wallet = Wallet.createRandom();

console.log(`
Wallet creada (no se guardó en ningún lado: cópiala ahora)

  Dirección pública : ${wallet.address}
  Clave privada     : ${wallet.privateKey}

Pasos:
  1. Pega la clave privada en .env.local:   WALLET_PRIVATE_KEY=${wallet.privateKey}
  2. Carga POL en la DIRECCIÓN (ver docs/03-guia-de-instalacion.md):
       - Red de prueba (amoy): POL gratis de un faucet.
       - Red principal (polygon): 1-2 POL comprados, enviados por la red Polygon.
  3. Comprueba el saldo con:  npm run wallet:saldo

Quien tenga la clave privada controla el saldo: no la compartas ni la subas a GitHub.
Usa esta wallet solo para sellar y mantén en ella solo unos pocos POL.
`);
