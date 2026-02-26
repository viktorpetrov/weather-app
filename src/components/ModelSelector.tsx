type Model = "ecmwf" | "gfs";

interface ModelSelectorProps {
  selected: Model;
  onChange: (model: Model) => void;
}

const MODELS: { value: Model; label: string }[] = [
  { value: "ecmwf", label: "ECMWF" },
  { value: "gfs", label: "GFS" },
];

export default function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  return (
    <div className="flex gap-2">
      {MODELS.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            selected === m.value
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
