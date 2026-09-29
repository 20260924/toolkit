// Shared by the browser and the server, so nothing here may touch DOM or Node APIs.

/** What the launcher knows about an app. `id` must equal the app's directory name under apps/. */
export type AppManifest = {
  id: string;
  name: string;
  description: string;
};
