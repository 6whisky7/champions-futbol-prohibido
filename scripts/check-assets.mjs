import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const folder = path.join(root, "public", "escudos");
const catalog = JSON.parse(await readFile(path.join(folder, "catalogo.json"), "utf8"));
const pngFiles = (await readdir(folder)).filter((file) => file.endsWith(".png")).sort();
const expectedCounts = { Inglaterra: 5, Italia: 5, España: 5, Alemania: 5, Francia: 5, Brasil: 5, México: 5, Argentina: 5, MLS: 4, "Costa Rica": 4 };

assert.equal(pngFiles.length, 48, "Deben existir exactamente 48 PNG individuales.");
assert.equal(catalog.escudos.length, 48, "El catálogo debe contener 48 diseños.");
assert.equal(new Set(catalog.escudos.map((crest) => crest.id)).size, 48, "Los identificadores de diseños deben ser únicos.");
assert.deepEqual(pngFiles, catalog.escudos.map((crest) => crest.file).sort(), "Los nombres del catálogo deben coincidir con los archivos públicos.");

const counts = {};
for (const crest of catalog.escudos) {
  assert.equal(path.basename(crest.file), crest.file, "Las rutas deben ser nombres de archivo, sin directorios.");
  const png = await readFile(path.join(folder, crest.file));
  assert.ok(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `PNG inválido: ${crest.file}`);
  assert.equal(png.readUInt32BE(16), 1254, `Ancho inesperado: ${crest.file}`);
  assert.equal(png.readUInt32BE(20), 1254, `Alto inesperado: ${crest.file}`);
  assert.equal(png[25], 6, `El PNG debe conservar el canal alfa RGBA: ${crest.file}`);
  counts[crest.league] = (counts[crest.league] ?? 0) + 1;
}
assert.deepEqual(counts, expectedCounts, "Debe conservarse la selección de clubes y su reparto aprobado.");
console.log("Escudos: 48/48 PNG RGBA de 1254 × 1254; catálogo, rutas y reparto correctos.");

const trophy = await readFile(path.join(root, "public/trofeo/cfp-v03-web.glb"));
assert.equal(trophy.subarray(0, 4).toString(), "glTF");
assert.equal(trophy.readUInt32LE(8), trophy.length);
const model = JSON.parse(trophy.subarray(20, 20 + trophy.readUInt32LE(12)).toString());
assert.equal(model.materials.length, 5);
assert.equal(model.animations?.length ?? 0, 0);
assert.ok(model.meshes.every(mesh => mesh.primitives.every(primitive => primitive.material !== undefined)));
assert.ok(model.extensionsRequired.includes("KHR_draco_mesh_compression"));
for (const file of await readdir(path.join(root, "public"), { recursive: true })) {
  assert.ok(!/\.(blend|blend1|zip)$/i.test(file), `Maestro o ZIP público: ${file}`);
}
console.log(`Trofeo V03: ${trophy.length} bytes; cinco materiales, Draco y cero animaciones; maestros fuera de public.`);
