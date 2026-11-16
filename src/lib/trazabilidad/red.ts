/**
 * Redes de blockchain donde se puede sellar. Datos públicos (sin secretos):
 * se pueden usar en el servidor y en el navegador.
 *
 * Se elige con NEXT_PUBLIC_RED_BLOCKCHAIN en .env.local:
 *   - "amoy"    → Polygon Amoy, red de prueba. POL gratis de faucet, sin valor.
 *   - "polygon" → Polygon PoS, red principal. POL real: cada sello cuesta milésimas de POL.
 */

export type IdRed = "amoy" | "polygon";

export interface ConfigRed {
  id: IdRed;
  /** Nombre que ven los usuarios. */
  nombre: string;
  chainId: number;
  /** RPC público gratuito (publicnode), funciona sin cuenta. */
  rpcPublico: string;
  /** Explorador de bloques (Polygonscan). */
  explorador: string;
  /** true si la red usa POL con valor real. */
  dineroReal: boolean;
}

export const REDES: Record<IdRed, ConfigRed> = {
  amoy: {
    id: "amoy",
    nombre: "Polygon Amoy (testnet)",
    chainId: 80002,
    rpcPublico: "https://polygon-amoy-bor-rpc.publicnode.com",
    explorador: "https://amoy.polygonscan.com",
    dineroReal: false,
  },
  polygon: {
    id: "polygon",
    nombre: "Polygon PoS",
    chainId: 137,
    rpcPublico: "https://polygon-bor-rpc.publicnode.com",
    explorador: "https://polygonscan.com",
    dineroReal: true,
  },
};

/** Convierte el valor de la variable de entorno en una red. Vacío → Amoy. */
export function resolverRed(valor: string | undefined): ConfigRed {
  const id = (valor ?? "").trim().toLowerCase() || "amoy";
  if (id !== "amoy" && id !== "polygon") {
    throw new Error(`NEXT_PUBLIC_RED_BLOCKCHAIN="${valor}" no es válida: usa "amoy" o "polygon".`);
  }
  return REDES[id];
}

/** Red configurada para esta instalación. */
export const RED = resolverRed(process.env.NEXT_PUBLIC_RED_BLOCKCHAIN);
