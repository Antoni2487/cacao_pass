// Muestra la dirección y el saldo de la wallet configurada en .env.local.
// Uso: npm run wallet:saldo
import { JsonRpcProvider, Wallet, formatEther } from "ethers";

const rpc = process.env.AMOY_RPC_URL || "https://polygon-amoy-bor-rpc.publicnode.com";
const clave = process.env.WALLET_PRIVATE_KEY;

if (!clave) {
  console.error("Falta WALLET_PRIVATE_KEY en .env.local. Crea una con: npm run wallet:nueva");
  process.exit(1);
}

const proveedor = new JsonRpcProvider(rpc, 80002, { staticNetwork: true });
const wallet = new Wallet(clave, proveedor);
const saldo = await proveedor.getBalance(wallet.address);

console.log(`Red       : Polygon Amoy (testnet) vía ${new URL(rpc).host}`);
console.log(`Dirección : ${wallet.address}`);
console.log(`Saldo     : ${formatEther(saldo)} POL de prueba`);
console.log(`Explorador: https://amoy.polygonscan.com/address/${wallet.address}`);
if (saldo === 0n)
  console.log("\nSin saldo: pide POL de prueba en un faucet antes de sellar etapas.");
