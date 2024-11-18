import {Matter, MtrDex} from "signify-ts";

const hex = "a0e99e3275392d716d519ea73826d99ea50bb9b70e7152f66e853c1e0dadb125";
const attachQb64 = (new Matter({ raw: Buffer.from(hex, "hex"), code: MtrDex.Blake3_256 })).qb64;

console.log(attachQb64)

export function toSAID(hex: String): string {
    return (new Matter({raw: Buffer.from(hex, "hex"), code: MtrDex.Blake3_256})).qb64
}
const obj = {"obj":{"hash":hex}}
const jsonStr = JSON.stringify(obj, (key, value) =>
    key == "hash" ? toSAID(value) : value
)


console.log(jsonStr)

