import { useState } from "react";
import ModelSelector from "./components/ModelSelector";
import ChartGrid from "./components/ChartGrid";

type Model = "ecmwf" | "gfs";

export default function App() {
  const [model, setModel] = useState<Model>("ecmwf");

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Weather Dashboard</h1>
        <ModelSelector selected={model} onChange={setModel} />
      </header>
      <ChartGrid model={model} />
    </div>
  );
}
