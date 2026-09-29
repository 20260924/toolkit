// Loopback only: app APIs can read files and run commands, so they must never be reachable from the network.
export const HOST = "127.0.0.1";

export const API_PORT = Number(process.env.TOOLKIT_PORT ?? 4600);
export const WEB_DEV_PORT = API_PORT + 1;
