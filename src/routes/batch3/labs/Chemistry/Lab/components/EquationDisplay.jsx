import { FormulaText } from "../utils/formulaUtils";

export default function EquationDisplay({ equation, dimProducts = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-base font-bold">
      {equation.reactants.map((r, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
            <FormulaText formula={r} />
          </span>
          {i < equation.reactants.length - 1 && (
            <span className="text-gray-400 font-extrabold">+</span>
          )}
        </span>
      ))}
      <span className="text-gray-500 font-extrabold text-lg">{equation.arrow}</span>
      {equation.products.map((p, i) => (
        <span key={i} className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded-lg text-sm"
            style={
              dimProducts
                ? { background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#9ca3af" }
                : { background: "#ecfdf5", border: "1px solid #6ee7b7", color: "#065f46" }
            }
          >
            <FormulaText formula={p} />
          </span>
          {i < equation.products.length - 1 && (
            <span className="text-gray-400 font-extrabold">+</span>
          )}
        </span>
      ))}
    </div>
  );
}
