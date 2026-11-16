import { describe, expect, it } from "vitest";
import { resolverRed } from "./red";

describe("resolverRed", () => {
  it("usa Amoy si la variable está vacía", () => {
    expect(resolverRed(undefined).chainId).toBe(80002);
    expect(resolverRed("  ").id).toBe("amoy");
  });

  it("acepta la red principal de Polygon sin importar mayúsculas", () => {
    const red = resolverRed(" Polygon ");
    expect(red.chainId).toBe(137);
    expect(red.explorador).toBe("https://polygonscan.com");
    expect(red.dineroReal).toBe(true);
  });

  it("rechaza valores desconocidos", () => {
    expect(() => resolverRed("ethereum")).toThrow(/no es válida/);
  });
});
