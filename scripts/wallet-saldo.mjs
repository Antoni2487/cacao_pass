// Muestra la dirección y el saldo de la wallet configurada en .env.local.
// Uso: npm run wallet:saldo
import { JsonRpcProvider, Wallet, formatEther } from "ethers";

const RPC_PUBLICO = "https://polygon-amoy-bor-rpc.publicnode.com";
const rpc = process.env.AMOY_RPC_URL?.trim() || RPC_PUBLICO;
const clave = process.env.WALLET_PRIVATE_KEY?.trim();

if (!clave) {
  console.error("Falta WALLET_PRIVATE_KEY en .env.local. Crea una con: npm run wallet:nueva");
  process.exit(1);
}

let wallet;
try {
  wallet = new Wallet(clave);
} catch {
  console.error("WALLET_PRIVATE_KEY no es válida. Debe ser 0x seguido de 64 caracteres.");
  process.exit(1);
}

// La dirección se calcula sin conexión: se muestra aunque falle la red.
console.log(`Dirección : ${wallet.address}   <- esta es la que pegas en el faucet`);
console.log(`Explorador: https://amoy.polygonscan.com/address/${wallet.address}`);

if (rpc.includes("<") || rpc.includes(">")) {
  console.error(`
AMOY_RPC_URL todavía tiene el texto de ejemplo (<api-key>).
Déjala vacía en .env.local (AMOY_RPC_URL=) para usar el RPC público,
o reemplaza <api-key> por tu clave real de Alchemy.`);
  process.exit(1);
}

try {
  const proveedor = new JsonRpcProvider(rpc, 80002, { staticNetwork: true });
  const saldo = await proveedor.getBalance(wallet.address);

  console.log(`Red       : Polygon Amoy (testnet) vía ${new URL(rpc).host}`);
  console.log(`Saldo     : ${formatEther(saldo)} POL de prueba`);
  if (saldo === 0n) {
    console.log("\nSin saldo: pide POL de prueba en un faucet (docs/03-guia-de-instalacion.md).");
  }
} catch (error) {
  const status = error?.info?.responseStatus ?? error?.shortMessage ?? error?.message;
  console.error(`\nNo se pudo consultar la red (${status}) vía ${new URL(rpc).host}.`);
  if (String(status).startsWith("401")) {
    console.error(
      "La clave de Alchemy en AMOY_RPC_URL no es válida o no es de la red Polygon Amoy.",
    );
  }
  console.error("Prueba dejando AMOY_RPC_URL vacía en .env.local para usar el RPC público.");
  process.exit(1);
}
