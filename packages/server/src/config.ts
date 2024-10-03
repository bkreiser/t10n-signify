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
  schemaSaid: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao"
}
