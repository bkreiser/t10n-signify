import "dotenv/config";

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment configuration for property ${name}`);
  }
  return value;
}

export const config = {
  keriaEndpoint: getRequired("KERIA_ENDPOINT"),
  keriaBootEndpoint: getRequired("KERIA_BOOT_ENDPOINT"),
  schemaURL: "http://192.168.10.186:3000/oobi/EGQVFrfFAmYfAtVoWonLkNkhD-vYk_e3cBHGneg0GCu2",
}
