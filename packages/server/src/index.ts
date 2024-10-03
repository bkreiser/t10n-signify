import express, { Request, Response, NextFunction } from "express";
import {SignifyClient, Tier, randomPasscode, ready, Operation, HabState} from "signify-ts";
import { join, dirname } from "path";
import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { waitAndGetDoneOp } from "./utils";
import { getCredential, verifyCredential } from "./controllers/credentials";
import { query } from "./controllers/queries";
import { config } from "./config";

async function getBran(path: string): Promise<string> {
  const dirPath = dirname(path);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
  if (!existsSync(path)) {
    await writeFile(path, "");
  }

  const contents = await readFile(path, "utf8");
  if (!contents) {
    const bran = randomPasscode();
    await writeFile(path, bran);
    return bran;
  }
  return contents;
}

async function getClient(): Promise<SignifyClient> {
  await ready();
  const client = new SignifyClient(config.keriaEndpoint, await getBran("./data/secret"), Tier.low, config.keriaBootEndpoint);
  await client.boot();
  await client.connect();
  
  return client;
}

async function getSingleSigId(client: SignifyClient): Promise<HabState> {
  if (await client.identifiers().get("issuer") == null) {
    await waitAndGetDoneOp(client, await (await client.identifiers().create("issuer")).op());
    await waitAndGetDoneOp(client, await (await client.identifiers().addEndRole("issuer", "agent", client.agent!.pre)).op());
  }

  return client.identifiers().get("issuer");
}

async function startServer(): Promise<void> {
  const app = express();
  const router = express.Router();
  
  app.use(router);
  app.use("/oobi", express.static(join(__dirname, "schemas"), { setHeaders: (res, path) => {
    res.setHeader("Content-Type", "application/schema+json");
  }}));
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  });

  app.listen(3000, async () => {
    console.info(`Web server started on port 3000, static content (OOBIs) ready... launching Signify client`);
    const client = await getClient();
    const issuerState = await getSingleSigId(client);

    console.log(issuerState)

    app.set("client", client);
    app.set("issuer", issuerState)

    router.get("/credentials/:said", getCredential);
    router.post("/credentials/verify", verifyCredential);
    router.post("/query", query);

    console.info(`Server ready`);
  });
}

void startServer();