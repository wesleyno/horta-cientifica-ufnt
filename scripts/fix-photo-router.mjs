import fs from "node:fs";
const path = "/home/ubuntu/horta-cientifica-ufnt/server/routers.ts";
let source = fs.readFileSync(path, "utf8");
source = source.replaceAll("acktick", "`");
fs.writeFileSync(path, source);
