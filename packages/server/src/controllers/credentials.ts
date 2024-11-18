import {Request, Response} from "express";
import {Matter, MtrDex, SignifyClient} from "signify-ts";
import {Aid, issueCredential, Reg} from "../utils";

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

export function toSAID(hex: String): string {
  return (new Matter({raw: Buffer.from(hex, "hex"), code: MtrDex.Blake3_256})).qb64
}

export async function createClaim(req: Request, res: Response) {
  const { schemaId, data } = req.body
  const client: SignifyClient = req.app.get("issuerClient");

  const jsonStr = JSON.stringify(data, (key, value) =>
    key == "hash" ? toSAID(value) : value
  )
  const newData = JSON.parse(jsonStr)

  const issuerClient: SignifyClient = req.app.get("issuerClient")
  const registry: Reg = req.app.get("registry")
  const issuer: Aid = req.app.get("issuer")
  const holder: Aid = req.app.get("holder")

  const cred = await issueCredential(issuerClient,
      issuer.name,
      registry.regk,
      holder.prefix,
      schemaId, newData)

  const said = cred.acdc.ked.d as string
  const issSaid = cred.iss.ked.d as string

  const credential = await client.credentials().get(said)

  const vv = Buffer.from(JSON.stringify({...credential.sad,
    d: "############################################"}))
  const vv2 = Buffer.from(JSON.stringify({...cred.iss.ked,
    d: "############################################"}))

  const obj = {
    id: said,
    data: vv.toString("hex"),
    issId: issSaid,
    issData: vv2.toString("hex")
  }
  res.json(obj)
}

export async function createCredential(req: Request, res: Response) {
  console.log(req)

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
