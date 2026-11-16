import { RED } from "./red";

/** Datos públicos de la red (sin secretos): se pueden usar en cualquier componente. */
export const RED_BLOCKCHAIN = RED.nombre;

export function urlExplorador(txHash: string) {
  return `${RED.explorador}/tx/${txHash}`;
}

export function urlDireccion(direccion: string) {
  return `${RED.explorador}/address/${direccion}`;
}

/** "5041366202b8…3bcb" para mostrar hashes largos. */
export function abreviarHash(hash: string, inicio = 6, fin = 4) {
  return hash.length > inicio + fin ? `${hash.slice(0, inicio)}…${hash.slice(-fin)}` : hash;
}
