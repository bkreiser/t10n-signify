import {
  EventResult,
  IssueCredentialResult,
  Operation,
  randomPasscode,
  ready,
  Serder,
  SignifyClient,
  Tier
} from "signify-ts";
import {dirname} from "path";
import {existsSync, mkdirSync} from "fs";
import {readFile, writeFile} from "fs/promises";
import {config} from "./config";
import assert from "node:assert";


export interface Aid {
  name: string;
  prefix: string;
  oobi: string;
}

export interface Reg {
  name: string,
  regk: string
}

async function deleteOperations<T = any>(
    client: SignifyClient,
    op: Operation<T>
) {
  if (op.metadata?.depends) {
    await deleteOperations(client, op.metadata.depends);
  }

  await client.operations().delete(op.name);
}

export async function waitOperation<T = any>(
    client: SignifyClient,
    op: Operation<T> | string,
    signal?: AbortSignal
): Promise<Operation<T>> {
  if (typeof op === 'string') {
    op = await client.operations().get(op);
  }

  op = await client
      .operations()
      .wait(op, { signal: signal ?? AbortSignal.timeout(30000) });
  await deleteOperations(client, op);

  return op;
}

export function debugAid(aid: Aid) {
  console.log(`name=${aid.name},prefix=${aid.prefix},oobi=${aid.oobi}`)
}

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

export async function getOrCreateClient(name: String): Promise<SignifyClient> {
  await ready();

  const client = new SignifyClient(config.keriaEndpoint, await getBran(`./data/${name}-secret`), Tier.low, config.keriaBootEndpoint);
  await client.boot();
  await client.connect();

  return client;
}

export async function resolveOobi(
    client: SignifyClient,
    oobi: string,
    alias?: string
) {
  const op = await client.oobis().resolve(oobi, alias);
  await waitOperation(client, op);
  return op
}

async function getOrCreateIdentifier(client: SignifyClient, name: string): Promise<[string,string]> {
  let id: any = undefined;
  try {
    const identfier = await client.identifiers().get(name);
    id = identfier.prefix;
  } catch {
    const result: EventResult = await client
        .identifiers()
        .create(name);
    let op = await result.op();
    op = await waitOperation(client, op);
    id = op.response.i;
    await waitAndGetDoneOp(client, await (await client.identifiers().addEndRole(name, "agent", client.agent!.pre)).op());
  }

  const oobi = await client.oobis().get(name, 'agent')
  const result: [string, string] = [id, oobi.oobis[0]]
  return result
}

export async function createAid(
    client: SignifyClient,
    name: string
): Promise<Aid> {
  const [prefix, oobi] = await getOrCreateIdentifier(client, name);
  return { prefix, oobi, name };
}

export async function getOrCreateRegistry(
    client: SignifyClient,
    aidName: string,
    registryName: string
): Promise<Reg> {
  let registries = await client.registries().list(aidName);
  if (registries.length > 0) {
    assert.equal(registries.length, 1);
  } else {
    const regResult = await client
        .registries()
        .create({ name: aidName, registryName: registryName });
    await waitOperation(client, await regResult.op());
    registries = await client.registries().list(aidName);
  }
  return registries[0];
}

export async function waitAndGetDoneOp(
  client: SignifyClient,
  op: Operation,
  timeout = 10000,
  interval = 50
): Promise<Operation> {
  const startTime = new Date().getTime();
  while (!op.done && new Date().getTime() < startTime + timeout) {
    op = await client.operations().get(op.name);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  if (!op.done) {
    throw new Error(`Operation not completing: ${JSON.stringify(op, null, 2)}`);
  }
  return op;
}

export async function issueCredential(client: SignifyClient,
                                      issuerId: string,
                                      registry: string,
                                      holderId: string,
                                      schemaId: string,
                                      data: any): Promise<IssueCredentialResult> {
  const issResult = await client.credentials()
      .issue(issuerId, {
        ri: registry,
        s: schemaId,
        a: {
          i: holderId,
          ...data
        }
      })

  await waitOperation(client, issResult.op);
  return issResult;
}
