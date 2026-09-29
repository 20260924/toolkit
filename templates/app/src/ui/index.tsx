import manifest from "../manifest.ts";

export default function App() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">{manifest.name}</h1>
      <p className="text-muted">{manifest.description}</p>
    </div>
  );
}
