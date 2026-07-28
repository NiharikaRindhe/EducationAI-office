import { CLR } from "../constants/hubConstants";

/**
 * Converts grid coordinates (gx, gy) to canvas pixel coordinates.
 */
export function gridToPixel(gx, gy, W, H, gridW = 9, gridH = 7) {
  const padX = 64;
  const padY = 64;
  const stepX = (W - padX * 2) / (gridW - 1);
  const stepY = (H - padY * 2) / (gridH - 1);
  return {
    x: padX + gx * stepX,
    y: padY + gy * stepY,
    stepX,
    stepY
  };
}

/**
 * Parses node coordinates e.g. "3,2" into {x: 3, y: 2}
 */
export function parseNode(nodeStr) {
  const [x, y] = nodeStr.split(",").map(Number);
  return { x, y };
}

/**
 * Draws the breadboard dot grid.
 */
export function drawGridNodes(ctx, W, H, gridW, gridH, voltmeterProbes, hoveredNode) {
  ctx.save();
  for (let gx = 0; gx < gridW; gx++) {
    for (let gy = 0; gy < gridH; gy++) {
      const { x, y } = gridToPixel(gx, gy, W, H, gridW, gridH);
      
      const nodeStr = `${gx},${gy}`;
      const isRedProbe = voltmeterProbes.red === nodeStr;
      const isBlackProbe = voltmeterProbes.black === nodeStr;
      const isHovered = hoveredNode === nodeStr;

      ctx.beginPath();
      ctx.shadowBlur = 0; // Reset shadow settings to prevent leaks on subsequent nodes in loop
      ctx.shadowColor = "transparent";

      if (isRedProbe) {
        ctx.fillStyle = "#ff4444";
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.shadowColor = "#ff4444";
        ctx.shadowBlur = 8;
      } else if (isBlackProbe) {
        ctx.fillStyle = "#111111";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 4;
      } else if (isHovered) {
        ctx.fillStyle = CLR.accent;
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.shadowColor = CLR.accent;
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = CLR.border;
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      }
      ctx.fill();
      if (isBlackProbe) ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Draws a circuit component on the canvas.
 */
export function drawComponent(ctx, c, W, H, gridW, gridH, current = 0, power = 0, isSelected = false) {
  // Real coordinates from parsed nodes
  const nA = parseNode(c.nodeA);
  const nB = parseNode(c.nodeB);
  const pixelA = gridToPixel(nA.x, nA.y, W, H, gridW, gridH);
  const pixelB = gridToPixel(nB.x, nB.y, W, H, gridW, gridH);

  const angle = Math.atan2(pixelB.y - pixelA.y, pixelB.x - pixelA.x);
  const len = Math.hypot(pixelB.y - pixelA.y, pixelB.x - pixelA.x);

  ctx.save();
  ctx.shadowBlur = 0; // Reset shadow settings to prevent leaks between components
  ctx.shadowColor = "transparent";
  ctx.translate(pixelA.x, pixelA.y);
  ctx.rotate(angle);

  // Set selection glow
  if (isSelected) {
    ctx.shadowColor = CLR.accent;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 4;
  } else {
    ctx.lineWidth = 2.5;
  }

  // Draw electron flow dots if current flows
  const hasCurrent = Math.abs(current) > 0.005;
  
  // Determine standard color of the component line
  let componentColor = CLR.muted;
  if (hasCurrent) {
    componentColor = CLR.wire;
  }

  switch (c.type) {
    case "wire":
      ctx.strokeStyle = componentColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();
      break;

    case "resistor":
      ctx.strokeStyle = componentColor;
      // Straight lead wires
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len / 3, 0);
      ctx.moveTo(len * 2/3, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();

      // Zigzag resistor body
      ctx.beginPath();
      const zSteps = 6;
      const zWidth = len / 3;
      const zStepSize = zWidth / zSteps;
      ctx.moveTo(len / 3, 0);
      for (let i = 0; i <= zSteps; i++) {
        const rx = len / 3 + i * zStepSize;
        const ry = i === 0 || i === zSteps ? 0 : (i % 2 === 1 ? -6 : 6);
        ctx.lineTo(rx, ry);
      }
      ctx.stroke();

      // Label value
      ctx.fillStyle = CLR.text;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${c.value} Ω`, len / 2, -14);
      break;

    case "battery":
      ctx.strokeStyle = CLR.text; // Battery stands out
      // Leads
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len / 2 - 4, 0);
      ctx.moveTo(len / 2 + 4, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();

      // Long positive plate (at nodeA side)
      ctx.strokeStyle = "#ff5555";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(len / 2 - 4, -12);
      ctx.lineTo(len / 2 - 4, 12);
      ctx.stroke();

      // Short negative plate (at nodeB side)
      ctx.strokeStyle = CLR.text;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(len / 2 + 4, -7);
      ctx.lineTo(len / 2 + 4, 7);
      ctx.stroke();

      // + and - labels
      ctx.fillStyle = "#ff5555";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText("+", len / 2 - 14, -8);
      ctx.fillStyle = CLR.muted;
      ctx.fillText("-", len / 2 + 10, -8);

      // EMF value
      ctx.fillStyle = CLR.neon;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${c.value} V`, len / 2, -18);
      break;

    case "bulb":
      const isBurnt = c.state?.burnt;
      // Leads
      ctx.strokeStyle = isBurnt ? "#444444" : componentColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len / 2 - 12, 0);
      ctx.moveTo(len / 2 + 12, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();

      // Glow circle background based on power (disabled if burnt)
      if (hasCurrent && !isBurnt) {
        const glowFactor = Math.min(1.0, power / 12); // Cap glow scale
        const radGlow = 14 + glowFactor * 12;
        const bulbGlow = ctx.createRadialGradient(len / 2, 0, 2, len / 2, 0, radGlow);
        bulbGlow.addColorStop(0, `rgba(255, 224, 102, ${0.4 + 0.6 * glowFactor})`);
        bulbGlow.addColorStop(1, "rgba(255, 224, 102, 0)");
        ctx.fillStyle = bulbGlow;
        ctx.beginPath();
        ctx.arc(len / 2, 0, radGlow, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bulb housing circle
      ctx.strokeStyle = isBurnt ? "#555555" : (hasCurrent ? CLR.bulb : CLR.muted);
      ctx.beginPath();
      ctx.arc(len / 2, 0, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Filament (Omega loop / arch)
      ctx.strokeStyle = isBurnt ? "#444444" : (hasCurrent ? CLR.bulb : CLR.text);
      if (isBurnt) {
        // Broken filament - draw left and right sides with a gap at the top
        ctx.beginPath();
        ctx.arc(len / 2, 3, 5, Math.PI, Math.PI * 1.3, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(len / 2, 3, 5, Math.PI * 1.7, 0, false);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(len / 2, 3, 5, Math.PI, 0, false);
        ctx.stroke();
      }

      // Filament supports
      ctx.beginPath();
      ctx.moveTo(len / 2 - 5, 0);
      ctx.lineTo(len / 2 - 5, 3);
      ctx.moveTo(len / 2 + 5, 0);
      ctx.lineTo(len / 2 + 5, 3);
      ctx.stroke();

      // Label value
      ctx.fillStyle = isBurnt ? "#555555" : CLR.text;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(isBurnt ? "BURNT" : `${c.value} Ω`, len / 2, -18);
      break;

    case "switch":
      ctx.strokeStyle = componentColor;
      // Leads
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len / 3, 0);
      ctx.moveTo(len * 2/3, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();

      // Terminals
      ctx.fillStyle = componentColor;
      ctx.beginPath();
      ctx.arc(len / 3, 0, 3, 0, Math.PI * 2);
      ctx.arc(len * 2/3, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      // Switch blade
      ctx.beginPath();
      ctx.moveTo(len / 3, 0);
      if (c.state?.open) {
        // Rotated up by 35 degrees
        const bladeLen = len / 3 + 2;
        const bx = len / 3 + bladeLen * Math.cos(-35 * Math.PI / 180);
        const by = bladeLen * Math.sin(-35 * Math.PI / 180);
        ctx.lineTo(bx, by);
      } else {
        ctx.lineTo(len * 2/3, 0);
      }
      ctx.stroke();

      // State label
      ctx.fillStyle = CLR.muted;
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.state?.open ? "OPEN" : "CLOSED", len / 2, -12);
      break;

    case "ammeter":
      ctx.strokeStyle = componentColor;
      // Leads
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len / 2 - 12, 0);
      ctx.moveTo(len / 2 + 12, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();

      // Ammeter circle
      ctx.fillStyle = CLR.panel;
      ctx.beginPath();
      ctx.arc(len / 2, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // "A" inside
      ctx.fillStyle = hasCurrent ? CLR.accent : CLR.muted;
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("A", len / 2, 4);

      // Value label
      ctx.fillStyle = hasCurrent ? CLR.accent : CLR.muted;
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${current.toFixed(3)} A`, len / 2, -18);
      break;
  }

  // Render electron flow animation
  const currentMagnitude = Math.abs(current);
  const hasCurrentFlow = currentMagnitude > 0.005;

  if (hasCurrentFlow) {
    ctx.save();
    // Speed proportional to current magnitude
    const speedFactor = Math.min(2.5, 0.4 + currentMagnitude * 0.4);
    const timeTerm = (Date.now() * speedFactor / 120) % 24;
    const flowDirection = current >= 0 ? 1 : -1;
    
    ctx.fillStyle = "#ffd700";
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 4;
    
    // Draw flowing dots along the branch line
    for (let x = 0; x < len; x += 24) {
      let dotX;
      if (flowDirection === 1) {
        // Flowing forward (left to right)
        dotX = (x + timeTerm) % len;
      } else {
        // Flowing backward (right to left)
        dotX = (x - timeTerm) % len;
        if (dotX < 0) dotX += len;
      }
      
      // Don't draw dots inside battery plates or ammeter faces for aesthetics
      if (c.type === "battery" && dotX > len / 2 - 8 && dotX < len / 2 + 8) continue;
      if (c.type === "ammeter" && dotX > len / 2 - 10 && dotX < len / 2 + 10) continue;
      
      ctx.beginPath();
      ctx.arc(dotX, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws the voltmeter leads and voltmeter display panel.
 */
export function drawVoltmeter(ctx, W, H, gridW, gridH, probes, voltageDiff) {
  if (!probes.red && !probes.black) return;

  ctx.save();

  // 1. Locate probe coordinates in pixels
  let redPx = null;
  let blackPx = null;

  if (probes.red) {
    const node = parseNode(probes.red);
    redPx = gridToPixel(node.x, node.y, W, H, gridW, gridH);
  }

  if (probes.black) {
    const node = parseNode(probes.black);
    blackPx = gridToPixel(node.x, node.y, W, H, gridW, gridH);
  }

  // 2. Draw voltmeter box at a fixed bottom-right position
  const boxW = 120;
  const boxH = 48;
  const bx = W - boxW - 16;
  const by = H - boxH - 16;

  // Draw box background
  ctx.fillStyle = "rgba(22, 27, 34, 0.9)";
  ctx.strokeStyle = "#ffe3b341";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Socket circles (connection points)
  const redSocket = { x: bx + 24, y: by + boxH - 8 };
  const blackSocket = { x: bx + boxW - 24, y: by + boxH - 8 };

  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.arc(redSocket.x, redSocket.y, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111111";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(blackSocket.x, blackSocket.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // LCD display
  ctx.fillStyle = "#0c1511";
  ctx.beginPath();
  ctx.roundRect(bx + 12, by + 8, boxW - 24, 18, 3);
  ctx.fill();

  // LCD Text
  ctx.fillStyle = "#39d353";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  let vText = "L.E.A.D.S";
  if (probes.red && probes.black) {
    vText = `${voltageDiff.toFixed(2)} V`;
  } else if (probes.red) {
    vText = "CONNECT -";
  } else if (probes.black) {
    vText = "CONNECT +";
  }
  ctx.fillText(vText, bx + boxW / 2, by + 21);

  // Voltmeter Label
  ctx.fillStyle = CLR.muted;
  ctx.font = "bold 7px Inter, sans-serif";
  ctx.fillText("VOLTMETER", bx + boxW / 2, by + boxH - 12);

  // 3. Draw curved lead wires from sockets to probes
  const drawLead = (socket, target, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    // Bezier control points for natural droop
    const cp1x = socket.x;
    const cp1y = socket.y + 40;
    const cp2x = target.x - 30;
    const cp2y = target.y + 40;

    ctx.beginPath();
    ctx.moveTo(socket.x, socket.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y);
    ctx.stroke();
  };

  if (redPx) {
    drawLead(redSocket, redPx, "#ff4444");
  }
  if (blackPx) {
    drawLead(blackSocket, blackPx, "#444444"); // Dark grey wire
  }

  ctx.restore();
}
