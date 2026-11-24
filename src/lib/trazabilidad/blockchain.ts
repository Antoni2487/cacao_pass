import "server-only";
import { JsonRpcProvider, Wallet, parseUnits, type Provider } from "ethers";

import { RED } from "./red";

/**
 * Acceso a Polygon (Amoy o la red principal, según NEXT_PUBLIC_RED_BLOCKCHAIN).
 * Ver docs/01-conceptos-blockchain.md.
 *
 * Sellar = enviar una transacción de 0 POL de nuestra wallet a sí misma con el
 * hash de la etapa en el campo `data`. No hay smart contract.
 */

/** Polygon rechaza transacciones con propina menor a ~25-30 gwei. */
const PROPINA_MINIMA = parseUnits("30", "gwei");

let proveedor: JsonRpcProvider | undefined;
let wallet: Wallet | undefined;

/** RPC_URL manda; AMOY_RPC_URL se acepta por compatibilidad solo en Amoy. */
function urlRpc(): string {
  const propia =
    process.env.RPC_URL?.trim() || (RED.id === "amoy" ? process.env.AMOY_RPC_URL?.trim() : "");
  return propia || RED.rpcPublico;
}

function obtenerProveedor(): Provider {
  if (!proveedor) {
    const url = urlRpc();
    if (/[<>]/.test(url)) {
      throw new Error("RPC_URL tiene el texto de ejemplo <api-key>: déjala vacía o pon tu clave.");
    }
    // staticNetwork evita una consulta extra en cada petición para detectar la red.
    proveedor = new JsonRpcProvider(url, RED.chainId, { staticNetwork: true });
  }
  return proveedor;
}

function obtenerWallet(): Wallet {
  if (!wallet) {
    const clave = process.env.WALLET_PRIVATE_KEY;
    if (!clave) throw new Error("Falta WALLET_PRIVATE_KEY en las variables de entorno.");
    wallet = new Wallet(clave, obtenerProveedor());
  }
  return wallet;
}

/** Dirección pública (0x…) de la wallet que sella. Se compara al verificar. */
export function direccionWallet(): string {
  return obtenerWallet().address;
}

/** Saldo de la wallet que sella, en wei (1 POL = 10^18 wei). */
export async function saldoWallet(): Promise<bigint> {
  return obtenerProveedor().getBalance(direccionWallet());
}

/** Envía el hash a la blockchain y devuelve el tx_hash sin esperar la confirmación. */
export async function sellarHash(hash: string): Promise<string> {
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error("Hash no válido.");

  const firmante = obtenerWallet();
  const [tarifas, bloque] = await Promise.all([
    firmante.provider!.getFeeData(),
    firmante.provider!.getBlock("latest"),
  ]);

  const propina =
    tarifas.maxPriorityFeePerGas && tarifas.maxPriorityFeePerGas > PROPINA_MINIMA
      ? tarifas.maxPriorityFeePerGas
      : PROPINA_MINIMA;
  // Margen x2 sobre la tarifa base por si sube en el siguiente bloque.
  const tarifaBase = bloque?.baseFeePerGas ?? parseUnits("1", "gwei");

  const tx = await firmante.sendTransaction({
    to: firmante.address,
    value: 0n,
    data: `0x${hash}`,
    maxPriorityFeePerGas: propina,
    maxFeePerGas: tarifaBase * 2n + propina,
  });
  return tx.hash;
}

/**
 * Espera a que la transacción entre en un bloque, como máximo `msMaximo`.
 * Devuelve la fecha del bloque, o null si aún no se confirma.
 */
export async function esperarConfirmacion(txHash: string, msMaximo: number): Promise<Date | null> {
  try {
    const recibo = await obtenerProveedor().waitForTransaction(txHash, 1, msMaximo);
    if (!recibo || recibo.status !== 1) return null;
    const bloque = await obtenerProveedor().getBlock(recibo.blockNumber);
    return bloque ? new Date(bloque.timestamp * 1000) : null;
  } catch {
    return null; // tiempo agotado: se confirmará más tarde
  }
}

/** Lo que dice la blockchain sobre una transacción de sellado. */
export interface SelloEnCadena {
  /** Hash grabado en el campo data (64 hex) o null si data no tiene ese formato. */
  hash: string | null;
  /** Dirección que envió la transacción. */
  emisor: string;
  /** La transacción ya está en un bloque y no falló. */
  confirmado: boolean;
  /** Fecha del bloque, si está confirmada. */
  fecha: Date | null;
}

/** Lee un sello. Devuelve null si la transacción no existe (o el RPC aún no la conoce). */
export async function leerSello(txHash: string): Promise<SelloEnCadena | null> {
  const red = obtenerProveedor();
  const [tx, recibo] = await Promise.all([
    red.getTransaction(txHash),
    red.getTransactionReceipt(txHash),
  ]);
  if (!tx) return null;

  const confirmado = recibo?.status === 1;
  const bloque = confirmado ? await red.getBlock(recibo.blockNumber) : null;
  const data = tx.data.toLowerCase();

  return {
    hash: /^0x[0-9a-f]{64}$/.test(data) ? data.slice(2) : null,
    emisor: tx.from,
    confirmado,
    fecha: bloque ? new Date(bloque.timestamp * 1000) : null,
  };
}
