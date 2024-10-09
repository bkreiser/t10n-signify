import express, { Request, Response, NextFunction } from "express";
import {
  SignifyClient,
  Operation, Saider, MtrDex, Serials
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
import * as fs from "node:fs";

async function getSAID<T = any>() {
  const v = fs.readFileSync('schemas/s-template', 'utf-8')
  const obj = JSON.parse(v)
  const [i,j] = Saider.saidify(obj, MtrDex.Blake3_256, Serials.JSON, "$id")
  console.log(j)
}

getSAID()

