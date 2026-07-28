/** Parse a formula string into segments for superscript/subscript rendering.
 *  Numbers become subscripts; ↑/↓ become superscripts; everything else is normal.
 *  A leading digit sequence is treated as a coefficient (normal), not a subscript,
 *  when the formula starts with digits (e.g. "2H2O" → "2" normal, "H" normal, "2" sub, "O" normal).
 */
export function parseFormula(formula) {
  const parts = [];
  let i = 0;

  // Detect a leading coefficient (digits before the first letter)
  let leadingCoeff = "";
  while (i < formula.length && /\d/.test(formula[i])) {
    leadingCoeff += formula[i];
    i++;
  }
  // Only treat as coefficient if followed by a letter (i.e. not a bare number)
  if (leadingCoeff && i < formula.length && /[A-Za-z]/.test(formula[i])) {
    parts.push({ text: leadingCoeff, type: "coeff" });
  } else {
    // Not a coefficient — back up and re-parse as subscripts
    i = 0;
  }

  while (i < formula.length) {
    if (formula[i] === "↓" || formula[i] === "↑") {
      parts.push({ text: formula[i], type: "sup" });
      i++;
    } else if (/\d/.test(formula[i])) {
      let num = "";
      while (i < formula.length && /\d/.test(formula[i])) { num += formula[i]; i++; }
      parts.push({ text: num, type: "sub" });
    } else {
      parts.push({ text: formula[i], type: "normal" });
      i++;
    }
  }
  return parts;
}

/** Renders a chemical formula with proper sub/superscripts.
 *  Leading coefficient (e.g. "2" in "2H2O") is rendered at normal size.
 */
export function FormulaText({ formula, className = "" }) {
  return (
    <span className={className}>
      {parseFormula(formula).map((p, i) =>
        p.type === "sub" ? <sub key={i} className="text-[0.8em]">{p.text}</sub>
          : p.type === "sup" ? <sup key={i} className="text-[0.8em]">{p.text}</sup>
            : p.type === "coeff" ? <span key={i} className="mr-[1px]">{p.text}</span>
              : <span key={i} className="font-bold text-xl">{p.text}</span>
      )}
    </span>
  );
}

/**
 * Build a formula string from crafting-beaker items + molecule count.
 * e.g. items = [{symbol:"H", atomCount:2}, {symbol:"O", atomCount:1}], moleculeCount = 2
 *   → "2H2O"
 */
export function buildFormulaString(craftingBeaker, moleculeCount = 1) {
  if (!craftingBeaker || craftingBeaker.length === 0) return "";
  const prefix = moleculeCount > 1 ? String(moleculeCount) : "";
  const body = craftingBeaker
    .map(el => `${el.symbol || el.id}${el.atomCount > 1 ? el.atomCount : ""}`)
    .join("");
  return prefix + body;
}

/** Check whether the beaker contents match the correct reactants (order-independent). */
export function checkAnswer(beaker, correctReactants) {
  if (beaker.length !== correctReactants.length) return false;
  const sorted = [...beaker].sort().join(",");
  const correct = [...correctReactants].sort().join(",");
  return sorted === correct;
}

/** Parses balanced reactants from the equation string, e.g. "2H₂ + O₂ → 2H₂O" → ["2H2", "O2"] */
export function getBalancedReactants(balancedEquation) {
  if (!balancedEquation) return [];
  const reactantsPart = balancedEquation.split("→")[0].trim();
  return reactantsPart.split("+").map(part => {
    return part.trim()
      .replace(/[\u2080-\u2089]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x2080 + 48)) // Unicode subscripts to normal numbers
      .replace(/\s+/g, "");
  });
}


