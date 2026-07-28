import { useMemo } from "react";

// Resistance constants
const R_WIRE = 0.02; // Small resistance for wires to allow current solving
const R_AMMETER = 0.02; // Ammeter internal resistance
const R_CLOSED_SWITCH = 0.02;
const R_OPEN_SWITCH = 1e9; // Open switch is practically infinite resistance
const R_GMIN = 1e-9; // Ground conductance to prevent singular matrices (SPICE style GMIN)

/**
 * Solves the linear system Ax = B using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A, B) {
  const n = A.length;
  // Create augmented matrix
  const M = new Array(n);
  for (let i = 0; i < n; i++) {
    M[i] = new Array(n + 1);
    for (let j = 0; j < n; j++) {
      M[i][j] = A[i][j];
    }
    M[i][n] = B[i];
  }

  for (let i = 0; i < n; i++) {
    // Search for maximum in this column
    let maxEl = Math.abs(M[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxEl) {
        maxEl = Math.abs(M[k][i]);
        maxRow = k;
      }
    }

    // Swap maximum row with current row
    const temp = M[maxRow];
    M[maxRow] = M[i];
    M[i] = temp;

    // Make all rows below this one 0 in current column
    if (Math.abs(M[i][i]) < 1e-12) {
      // Singular matrix
      return null;
    }

    for (let k = i + 1; k < n; k++) {
      const c = -M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) {
        if (i === j) {
          M[k][j] = 0;
        } else {
          M[k][j] += c * M[i][j];
        }
      }
    }
  }

  // Solve equation Mx = B for an upper triangular matrix M
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n] / M[i][i];
    for (let k = i - 1; k >= 0; k--) {
      M[k][n] -= M[k][i] * x[i];
    }
  }
  return x;
}

/**
 * Solves a circuit grid using Modified Nodal Analysis (MNA).
 * 
 * @param {Array} components List of components placed on the grid.
 * Each component is: { id, type, nodeA: "x,y", nodeB: "x,y", value, state }
 * @returns {Object} { voltages, currents, powers, isShortCircuit, success }
 */
export function solveCircuit(components) {
  if (!components || components.length === 0) {
    return { voltages: {}, currents: {}, powers: {}, isShortCircuit: false, success: false };
  }

  // 1. Find all active nodes (grid coordinates that have components connected)
  const nodeSet = new Set();
  components.forEach(c => {
    nodeSet.add(c.nodeA);
    nodeSet.add(c.nodeB);
  });

  const activeNodes = Array.from(nodeSet);
  const N = activeNodes.length;
  if (N === 0) {
    return { voltages: {}, currents: {}, powers: {}, isShortCircuit: false, success: false };
  }

  // Mapping from node coordinate string "x,y" to node index
  const nodeMap = new Map();
  activeNodes.forEach((node, index) => {
    nodeMap.set(node, index);
  });

  // 2. Identify batteries (voltage sources)
  const batteries = components.filter(c => c.type === "battery");
  const M = batteries.length; // Number of voltage sources

  // Linear system size is N (node voltages) + M (battery currents)
  const size = N + M;
  const A = Array.from({ length: size }, () => new Array(size).fill(0));
  const Z = new Array(size).fill(0);

  // Apply ground conductance GMIN to prevent singular matrices
  for (let i = 0; i < N; i++) {
    A[i][i] += R_GMIN;
  }

  // 3. Stamp passive components (Resistors, Bulbs, Wires, Switches, Ammeters)
  components.forEach(c => {
    if (c.type === "battery") return;

    const u = nodeMap.get(c.nodeA);
    const w = nodeMap.get(c.nodeB);

    let R = 10; // Default resistance
    if (c.type === "resistor" || c.type === "bulb") {
      R = c.value || 10;
      if (c.type === "bulb" && c.state?.burnt) {
        R = R_OPEN_SWITCH;
      }
    } else if (c.type === "wire") {
      R = R_WIRE;
    } else if (c.type === "ammeter") {
      R = R_AMMETER;
    } else if (c.type === "switch") {
      R = c.state?.open ? R_OPEN_SWITCH : R_CLOSED_SWITCH;
    }

    const g = 1.0 / R;

    // Add stamp to conductance matrix G (upper-left NxN part of A)
    A[u][u] += g;
    A[w][w] += g;
    A[u][w] -= g;
    A[w][u] -= g;
  });

  // 4. Stamp active components (Batteries)
  batteries.forEach((bat, index) => {
    const p = nodeMap.get(bat.nodeA); // Positive terminal
    const n = nodeMap.get(bat.nodeB); // Negative terminal
    const V = bat.value || 9.0; // Battery voltage

    const vIdx = N + index; // Battery current variable index in matrix

    // Battery constraint: Vp - Vn = V
    A[vIdx][p] = 1;
    A[vIdx][n] = -1;
    Z[vIdx] = V;

    // Add current term to KCL equations of nodes p and n
    A[p][vIdx] = 1;  // Current flows out of positive terminal
    A[n][vIdx] = -1; // Current flows into negative terminal
  });

  // 5. Establish a reference node (Ground)
  // We locate the negative terminal of the first battery as ground, or node 0
  let groundNodeIdx = 0;
  if (M > 0) {
    groundNodeIdx = nodeMap.get(batteries[0].nodeB); // Node B of battery is negative terminal
  }
  
  // Enforce V_ground = 0 by replacing ground's KCL row
  for (let j = 0; j < size; j++) {
    A[groundNodeIdx][j] = 0;
  }
  A[groundNodeIdx][groundNodeIdx] = 1;
  Z[groundNodeIdx] = 0;

  // 6. Solve the linear system
  const X = solveLinearSystem(A, Z);
  if (!X) {
    // If solve fails, return empty result
    return { voltages: {}, currents: {}, powers: {}, isShortCircuit: false, success: false };
  }

  // 7. Extract values
  const voltages = {};
  activeNodes.forEach(node => {
    const idx = nodeMap.get(node);
    voltages[node] = X[idx];
  });

  const currents = {};
  const powers = {};
  let maxCurrent = 0;

  components.forEach(c => {
    const uVal = voltages[c.nodeA] || 0;
    const wVal = voltages[c.nodeB] || 0;

    let I = 0;
    let P = 0;

    if (c.type === "battery") {
      // Find battery index
      const batIdx = batteries.findIndex(b => b.id === c.id);
      if (batIdx !== -1) {
        // Battery current variable is solved directly
        // Conventional current flows from positive terminal (nodeA) to negative (nodeB) externally
        I = X[N + batIdx];
        P = Math.abs(I) * (c.value || 9.0);
      }
    } else {
      let R = 10;
      if (c.type === "resistor" || c.type === "bulb") {
        R = c.value || 10;
        if (c.type === "bulb" && c.state?.burnt) {
          R = R_OPEN_SWITCH;
        }
      } else if (c.type === "wire") {
        R = R_WIRE;
      } else if (c.type === "ammeter") {
        R = R_AMMETER;
      } else if (c.type === "switch") {
        R = c.state?.open ? R_OPEN_SWITCH : R_CLOSED_SWITCH;
      }

      // Signed current: positive if flowing from nodeA to nodeB
      I = (uVal - wVal) / R;
      P = I * I * R;
    }

    currents[c.id] = I;
    powers[c.id] = P;
    
    // Ignore switches in open state for short circuit checks
    if (!(c.type === "switch" && c.state?.open)) {
      maxCurrent = Math.max(maxCurrent, Math.abs(I));
    }
  });

  // Short circuit detection: if current through a low-resistance path (wire/switch/ammeter)
  // is unreasonably high, e.g. > 15A
  const isShortCircuit = maxCurrent > 15.0;

  return {
    voltages,
    currents,
    powers,
    isShortCircuit,
    success: true
  };
}

/**
 * Custom React hook to manage circuit builder state and invoke solver.
 */
export function useCircuitSolver(components) {
  return useMemo(() => {
    return solveCircuit(components);
  }, [components]);
}
