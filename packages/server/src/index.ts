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
import {createClaim, createCredential, getCredential} from "./controllers/credentials";
import { config } from "./config";

async function startServer() {
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

  app.listen(3000, async () => {
    const issuerClient = await getOrCreateClient("issuer")
    const holderClient = await getOrCreateClient("holder")
    const issuer = await createAid(issuerClient, "issuer")
    const holder = await createAid(holderClient, "holder")
    const TEST_REGISTRY = "t10n-test-registry"
    const registry = await getOrCreateRegistry(issuerClient, issuer.name, TEST_REGISTRY)

    console.info(`Web server started on port 3000, static content (OOBIs) ready... launching Signify client`)

    app.set("issuerClient", issuerClient)
    app.set("holderClient", holderClient)
    app.set("issuer", issuer)
    app.set("holder", holder)
    app.set("registry", registry)

    router.get("/credentials/:said", getCredential)
    router.post("/credentials", createCredential)
    router.post("/claim", createClaim)

    console.log("Before Resolve")
    await resolveOobi(holderClient, "http://192.168.10.227:3000/oobi/EA3NRCtGF0czMPeiG5-CWbgCnmcpBDpPo2mYlxoGkk0j")
    await resolveOobi(issuerClient, "http://192.168.10.227:3000/oobi/EA3NRCtGF0czMPeiG5-CWbgCnmcpBDpPo2mYlxoGkk0j")
    console.log("After Resolve")

    console.info(`Server ready`);
  });
}

void startServer()

