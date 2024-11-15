import {Matter, MtrDex} from "signify-ts";

const hex = "dd7e8183bc7ef36487b86540d370722f8210fe10a9ce77896738d00c8d6ad474";
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

