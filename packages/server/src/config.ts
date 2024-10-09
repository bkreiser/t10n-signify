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
  schemaURL: "https://raw.githubusercontent.com/bkreiser/t10n-signify/refs/heads/main/packages/server/src/oobi/EGQVFrfFAmYfAtVoWonLkNkhD-vYk_e3cBHGneg0GCu2",
  t10nUser: "admin",
  t10nPass: "admin"
}
