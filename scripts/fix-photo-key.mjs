import fs from "node:fs";
const path = "/home/ubuntu/horta-cientifica-ufnt/server/routers.ts";
let source = fs.readFileSync(path, "utf8");
const pattern = /const stored = await storagePut\([\s\S]*?buffer, input\.mimeType\);/;
const replacement = 'const stored = await storagePut("workspaces/" + project.workspaceId + "/projects/" + project.id + "/" + Date.now() + "-" + input.filename.replace(/[^a-zA-Z0-9._-]/g, "_"), buffer, input.mimeType);';
if (!pattern.test(source)) throw new Error("photo storage expression not found");
source = source.replace(pattern, replacement);
fs.writeFileSync(path, source);
