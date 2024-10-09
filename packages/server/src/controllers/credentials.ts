import { Request, Response } from "express";
import {RegistryResult, Saider, Serder, SignifyClient} from "signify-ts";
import {Aid, issueCredential, Reg, waitAndGetDoneOp} from "../utils";
import { config } from "../config";

export async function getCredential(req: Request, res: Response) {
  const said = req.params.said;
  const client: SignifyClient = req.app.get("issuerClient");

  try {
    const data = await client.credentials().get(said);
    res.status(200).send(data);
  } catch (error: any) {
    const status = error?.message.split(" - ")[1];
    if (/404/gi.test(status)) {
      res.status(404).send();
    } else {
      throw error;
    }
  }
}

export async function createCredential(req: Request, res: Response) {
  const issuerClient: SignifyClient = req.app.get("issuerClient")
  const registry: Reg = req.app.get("registry")
  const issuer: Aid = req.app.get("issuer")
  const holder: Aid = req.app.get("holder")
  const { schemaId, data  } = req.body;

  const cred = await issueCredential(issuerClient,
      issuer.name,
      registry.regk,
      holder.prefix,
      schemaId, data)

  res.json({
    id: cred.acdc.ked.d as string
  })
}
