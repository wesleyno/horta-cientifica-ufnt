import { createApp } from "./server/_core/index";

const { server } = await createApp();
server.listen();
