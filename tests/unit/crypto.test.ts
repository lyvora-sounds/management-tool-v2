import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { encrypt, decrypt, maskApiKey } from "@/lib/crypto";

// La clave se deriva de process.env en cada llamada, así que fijamos un
// secreto conocido para que los tests no dependan del entorno de quien los corra.
const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.ENCRYPTION_SECRET = "secreto-de-test-para-cifrado-aes-256";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("encrypt / decrypt", () => {
  it("devuelve el texto original tras cifrar y descifrar", () => {
    const original = "sk-proj-clave-de-api-secreta-123";
    expect(decrypt(encrypt(original))).toBe(original);
  });

  it("produce un cifrado distinto cada vez para el mismo texto (IV aleatorio)", () => {
    const a = encrypt("mismo texto");
    const b = encrypt("mismo texto");
    expect(a).not.toBe(b);
    // pero ambos descifran a lo mismo
    expect(decrypt(a)).toBe(decrypt(b));
  });

  it("soporta unicode y cadenas largas", () => {
    const original = "clave-ñ-áé-日本語-🔐-" + "x".repeat(5000);
    expect(decrypt(encrypt(original))).toBe(original);
  });

  it("trata la cadena vacía como vacía en ambos sentidos", () => {
    expect(encrypt("")).toBe("");
    expect(decrypt("")).toBe("");
  });

  it("rechaza un cifrado manipulado en vez de devolver datos corruptos", () => {
    // El auth tag de AES-GCM debe detectar la manipulación.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const valid = encrypt("dato sensible");
    const bytes = Buffer.from(valid, "base64");
    bytes[bytes.length - 1] ^= 0xff; // altera el último byte del ciphertext
    expect(decrypt(bytes.toString("base64"))).toBe("");
  });

  it("devuelve vacío si la entrada es más corta que IV + auth tag", () => {
    expect(decrypt(Buffer.from("corto").toString("base64"))).toBe("");
  });

  it("no descifra con un secreto distinto", () => {
    // Documenta el riesgo real: si cambia ENCRYPTION_SECRET (o el
    // CLERK_SECRET_KEY del que hace fallback), lo ya cifrado deja de leerse.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const cifrado = encrypt("clave-de-api");
    process.env.ENCRYPTION_SECRET = "otro-secreto-completamente-distinto";
    expect(decrypt(cifrado)).toBe("");
  });
});

describe("maskApiKey", () => {
  it("muestra los 4 primeros y los 4 últimos caracteres", () => {
    expect(maskApiKey("sk-1234567890abcd")).toBe("sk-1••••••••abcd");
  });

  it("oculta por completo las claves de 8 caracteres o menos", () => {
    expect(maskApiKey("12345678")).toBe("••••••••");
    expect(maskApiKey("abc")).toBe("••••••••");
  });

  it("devuelve vacío si no hay clave", () => {
    expect(maskApiKey("")).toBe("");
  });

  it("nunca deja ver el centro de la clave", () => {
    const secreto = "sk-INICIOsecretoENMEDIOsecretoFINAL";
    const masked = maskApiKey(secreto);
    expect(masked).not.toContain("ENMEDIO");
    expect(masked).not.toContain("secreto");
  });
});
