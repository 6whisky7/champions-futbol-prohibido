// Next.js pins sharp in the lockfile. Originals are read-only; these small PNGs feed result cards.
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
const require=createRequire(import.meta.url), sharp=require("sharp");
const root=new URL("../",import.meta.url),catalog=JSON.parse(await readFile(new URL("public/escudos/catalogo.json",root),"utf8"));
await mkdir(new URL("public/escudos-mini",root),{recursive:true});
for(const c of catalog.escudos)await sharp(await readFile(new URL("public/escudos/"+c.file,root))).resize(160,160,{fit:"contain"}).png().toFile(fileURLToPath(new URL("public/escudos-mini/"+c.id+".png",root)));
console.log("48 copies derived; original crests preserved");
