// Web Crypto existe no Node >= 19 e nos navegadores; evita depender de node:crypto.
export const randomUUID = () => globalThis.crypto.randomUUID();
