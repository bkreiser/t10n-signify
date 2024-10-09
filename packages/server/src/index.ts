import express, { Request, Response, NextFunction } from "express";
import {
  SignifyClient,
  Operation
} from "signify-ts";
import { join } from "path";
import {
  createAid,
  debugAid,
  getOrCreateClient,
  getOrCreateRegistry,
  resolveOobi,
} from "./utils";
import {createCredential, getCredential} from "./controllers/credentials";
import { config } from "./config";

export async function loadSchemas(req: Request, res: Response) {
  const issuerClient: SignifyClient = req.app.get("issuerClient")
  const holderClient: SignifyClient = req.app.get("holderClient")
  const vLEIServerHostUrl = `http://localhost:3000/oobi`;
  const QVI_SCHEMA_SAID = config.schemaSaid
  const QVI_SCHEMA_URL = `${vLEIServerHostUrl}/${QVI_SCHEMA_SAID}`;

  console.info(QVI_SCHEMA_URL)

  await resolveOobi(holderClient, QVI_SCHEMA_URL)
  await resolveOobi(issuerClient, QVI_SCHEMA_URL)
}

async function startServer(): Promise<[SignifyClient,SignifyClient]> {
  const app = express();
  const router = express.Router();

  app.use(express.json())
  app.use(router);
  app.use("/oobi", express.static(join(__dirname, "schemas"), { setHeaders: (res, path) => {
    res.setHeader("Content-Type", "application/schema+json");
  }}));
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  });

  const issuerClient = await getOrCreateClient("issuer")
  const holderClient = await getOrCreateClient("holder")
  const issuer = await createAid(issuerClient, "issuer")
  const holder = await createAid(holderClient, "holder")
 // const QVI_SCHEMA_URL = 'https://cred-issuance.stg.cf-idw.global.metadata.dev.cf-deployments.org/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao'
  const TEST_REGISTRY = "t10n-test-registry"
  const registry = await getOrCreateRegistry(issuerClient, issuer.name, TEST_REGISTRY)

  app.listen(3000, async () => {
    console.info(`Web server started on port 3000, static content (OOBIs) ready... launching Signify client`)

    app.set("issuerClient", issuerClient)
    app.set("holderClient", holderClient)
    app.set("issuer", issuer)
    app.set("holder", holder)
    app.set("registry", registry)

    router.get("/credentials/:said", getCredential);
    router.post("/credentials", createCredential)
    router.get("/schemas", loadSchemas)

    console.info(`Server ready`);
  });

  console.log("All done")

  return [issuerClient,holderClient]
}

void startServer().then(clients=>async () => {

})

