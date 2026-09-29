import { appPath } from "@toolkit/shell";

import manifest from "../manifest.ts";

export const indexPath = () => appPath(manifest.id);
export const listPath = (id: string) => appPath(manifest.id, id);
