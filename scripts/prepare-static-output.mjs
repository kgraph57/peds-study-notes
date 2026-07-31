import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "public");
const publicDirectories = ["assets", "atlas", "data"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const directory of publicDirectories) {
  await cp(path.join(root, directory), path.join(output, directory), {
    recursive: true,
  });
}

const rootFiles = await readdir(root, { withFileTypes: true });
const publicFiles = rootFiles
  .filter(
    (entry) =>
      entry.isFile() &&
      [".html", ".js", ".css"].includes(path.extname(entry.name)),
  )
  .map((entry) => entry.name);

for (const file of publicFiles) {
  await cp(path.join(root, file), path.join(output, file));
}

console.log(
  `Prepared ${publicFiles.length} root files and ${publicDirectories.length} asset directories in public/.`,
);
