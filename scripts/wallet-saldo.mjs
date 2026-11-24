// Muestra la dirección y el saldo de la wallet configurada en .env.local.
// Uso: npm run wallet:saldo
import { JsonRpcProvider, Wallet, formatEther } from "ethers";

// Copia de src/lib/trazabilidad/red.ts (los scripts .mjs no pueden importar TypeScript).
const REDES = {
  amoy: {
    nombre: "Polygon Amoy (testnet)",
    chainId: 80002,
    rpcPublico: "https://polygon-amoy-bor-rpc.publicnode.com",
    explorador: "https://amoy.polygonscan.com",
    moneda: "POL de prueba",
  },
  polygon: {
    nombre: "Polygon PoS (red principal)",
    chainId: 137,
    rpcPublico: "https://polygon-bor-rpc.publicnode.com",
    explorador: "https://polygonscan.com",
    moneda: "POL (dinero real)",
  },
};

const idRed = (process.env.NEXT_PUBLIC_RED_BLOCKCHAIN ?? "").trim().toLowerCase() || "amoy";
const red = REDES[idRed];
if (!red) {
  console.error(`NEXT_PUBLIC_RED_BLOCKCHAIN="${idRed}" no es válida: usa "amoy" o "polygon".`);
  process.exit(1);
}

const rpc =
  process.env.RPC_URL?.trim() ||
  (idRed === "amoy" ? process.env.AMOY_RPC_URL?.trim() : "") ||
  red.rpcPublico;
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
console.log(`Dirección : ${wallet.address}   <- esta es la que usas para recibir POL`);
console.log(`Explorador: ${red.explorador}/address/${wallet.address}`);

if (rpc.includes("<") || rpc.includes(">")) {
  console.error(`
RPC_URL todavía tiene el texto de ejemplo (<api-key>).
Déjala vacía en .env.local (RPC_URL=) para usar el RPC público,
o reemplaza <api-key> por tu clave real.`);
  process.exit(1);
}

try {
  const proveedor = new JsonRpcProvider(rpc, red.chainId, { staticNetwork: true });
  const saldo = await proveedor.getBalance(wallet.address);

  console.log(`Red       : ${red.nombre} vía ${new URL(rpc).host}`);
  console.log(`Saldo     : ${formatEther(saldo)} ${red.moneda}`);
  if (saldo === 0n) {
    console.log(
      idRed === "polygon"
        ? "\nSin saldo: envía POL a la dirección de arriba por la red Polygon (docs/03-guia-de-instalacion.md)."
        : "\nSin saldo: pide POL de prueba en un faucet (docs/03-guia-de-instalacion.md).",
    );
  }
} catch (error) {
  const status = error?.info?.responseStatus ?? error?.shortMessage ?? error?.message;
  console.error(`\nNo se pudo consultar la red (${status}) vía ${new URL(rpc).host}.`);
  if (String(status).startsWith("401")) {
    console.error(`La clave en RPC_URL no es válida o no es de la red ${red.nombre}.`);
  }
  console.error("Prueba dejando RPC_URL vacía en .env.local para usar el RPC público.");
  process.exit(1);
}
