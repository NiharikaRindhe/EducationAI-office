import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, ToggleLeft, ShieldAlert, BookOpen, Trash2, RotateCcw, 
  HelpCircle, Compass, CheckCircle2, AlertTriangle, ArrowRight,
  ChevronDown, ChevronUp, BarChart2, Settings, Flame, Activity, RefreshCw
} from "lucide-react";
import { CLR } from "../constants/hubConstants";
import LabCanvas from "./LabCanvas";
import HubSection from "./HubSection";
import HubSliderRow from "./HubSliderRow";
import { gridToPixel, drawGridNodes, drawComponent, drawVoltmeter, parseNode } from "../utils/circuitDrawing";
import { solveCircuit } from "../hooks/useCircuitSolver";
import FormulaOverlay from "../../FormulaOverlay";

// Grid dimensions are now managed dynamically inside the component state
// const GRID_W = 9;
// const GRID_H = 7;

// Default start circuit: Single battery, switch, resistor, and bulb in a loop (strictly length-1 segments)
const INITIAL_COMPONENTS = [
  { id: "bat-1", type: "battery", nodeA: "1,2", nodeB: "1,3", value: 9 },
  { id: "w-top-1", type: "wire", nodeA: "1,1", nodeB: "1,2" },
  { id: "w-top-2", type: "wire", nodeA: "1,1", nodeB: "2,1" },
  { id: "w-top-3", type: "wire", nodeA: "2,1", nodeB: "3,1" },
  { id: "sw-1", type: "switch", nodeA: "3,1", nodeB: "4,1", state: { open: false } },
  { id: "w-top-4", type: "wire", nodeA: "4,1", nodeB: "5,1" },
  { id: "w-top-5", type: "wire", nodeA: "5,1", nodeB: "5,2" },
  { id: "res-1", type: "resistor", nodeA: "5,2", nodeB: "5,3", value: 10 },
  { id: "w-bot-1", type: "wire", nodeA: "5,3", nodeB: "5,4" },
  { id: "w-bot-2", type: "wire", nodeA: "5,4", nodeB: "5,5" },
  { id: "w-bot-3", type: "wire", nodeA: "4,5", nodeB: "5,5" },
  { id: "bulb-1", type: "bulb", nodeA: "3,5", nodeB: "4,5", value: 5 },
  { id: "w-bot-4", type: "wire", nodeA: "2,5", nodeB: "3,5" },
  { id: "w-bot-5", type: "wire", nodeA: "1,5", nodeB: "2,5" },
  { id: "w-bot-6", type: "wire", nodeA: "1,4", nodeB: "1,5" },
  { id: "w-bot-7", type: "wire", nodeA: "1,3", nodeB: "1,4" }
];

export default function CircuitBuilder({ active }) {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 480 });
  const [gridW, setGridW] = useState(9);
  const [gridH, setGridH] = useState(7);
  const [components, setComponents] = useState(INITIAL_COMPONENTS);
  const [selectedTool, setSelectedTool] = useState(null); // 'wire', 'battery', 'resistor', etc., 'eraser', 'voltmeter'
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [voltmeterProbes, setVoltmeterProbes] = useState({ red: null, black: null });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [showFormulas, setShowFormulas] = useState(true);

  // Click & Drag states for drawing wires
  const [dragStartNode, setDragStartNode] = useState(null);
  const [dragCurrentNode, setDragCurrentNode] = useState(null);
  const [dragCurrentMouse, setDragCurrentMouse] = useState(null);

  // Click & Drag states for moving components
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [dragStartLink, setDragStartLink] = useState(null);
  const [draggedWires, setDraggedWires] = useState([]);

  // Resize handler for Grid Columns
  const handleGridWChange = (newW) => {
    setGridW(newW);
    // Remove out-of-bounds components
    setComponents(prev => prev.filter(c => {
      const nA = parseNode(c.nodeA);
      const nB = parseNode(c.nodeB);
      return nA.x < newW && nB.x < newW;
    }));
    // Remove out-of-bounds voltmeter probes
    setVoltmeterProbes(prev => {
      let red = prev.red;
      let black = prev.black;
      if (red && parseNode(red).x >= newW) red = null;
      if (black && parseNode(black).x >= newW) black = null;
      return { red, black };
    });
  };

  // Resize handler for Grid Rows
  const handleGridHChange = (newH) => {
    setGridH(newH);
    // Remove out-of-bounds components
    setComponents(prev => prev.filter(c => {
      const nA = parseNode(c.nodeA);
      const nB = parseNode(c.nodeB);
      return nA.y < newH && nB.y < newH;
    }));
    // Remove out-of-bounds voltmeter probes
    setVoltmeterProbes(prev => {
      let red = prev.red;
      let black = prev.black;
      if (red && parseNode(red).y >= newH) red = null;
      if (black && parseNode(black).y >= newH) black = null;
      return { red, black };
    });
  };

  // Solve circuit whenever components state changes
  const solverResults = useMemo(() => {
    return solveCircuit(components);
  }, [components]);

  const { voltages, currents, powers, isShortCircuit } = solverResults;

  // Burnout light bulbs if current exceeds 2.5A safety capacity
  useEffect(() => {
    let updated = false;
    const nextComps = components.map(c => {
      if (c.type === "bulb" && !c.state?.burnt) {
        const I = currents[c.id] || 0;
        if (Math.abs(I) > 2.5) {
          updated = true;
          return { ...c, state: { ...c.state, burnt: true } };
        }
      }
      return c;
    });
    if (updated) {
      setComponents(nextComps);
    }
  }, [currents, components]);

  // Selected component reference
  const selectedComponent = components.find(c => c.id === selectedCompId);

  // Voltmeter reading
  const voltmeterVoltage = useMemo(() => {
    if (!voltmeterProbes.red || !voltmeterProbes.black) return 0;
    const vRed = voltages[voltmeterProbes.red] || 0;
    const vBlack = voltages[voltmeterProbes.black] || 0;
    return vRed - vBlack;
  }, [voltmeterProbes, voltages]);

  // Find closest node or link based on mouse position
  const getMouseInteractions = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { node: null, link: null };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Mouse coords in canvas pixel space
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // 1. Find closest node
    let closestNode = null;
    let minNodeDist = 18;
    for (let gx = 0; gx < gridW; gx++) {
      for (let gy = 0; gy < gridH; gy++) {
        const p = gridToPixel(gx, gy, canvas.width, canvas.height, gridW, gridH);
        const dist = Math.hypot(mx - p.x, my - p.y);
        if (dist < minNodeDist) {
          minNodeDist = dist;
          closestNode = `${gx},${gy}`;
        }
      }
    }

    // 2. Find closest link
    let closestLink = null;
    let minLinkDist = 24;
    for (let gx = 0; gx < gridW; gx++) {
      for (let gy = 0; gy < gridH; gy++) {
        const pA = gridToPixel(gx, gy, canvas.width, canvas.height, gridW, gridH);
        
        // Horizontal link
        if (gx < gridW - 1) {
          const pB = gridToPixel(gx + 1, gy, canvas.width, canvas.height, gridW, gridH);
          const midX = (pA.x + pB.x) / 2;
          const midY = (pA.y + pB.y) / 2;
          const dist = Math.hypot(mx - midX, my - midY);
          if (dist < minLinkDist && mx >= pA.x - 4 && mx <= pB.x + 4 && Math.abs(my - pA.y) < 16) {
            minLinkDist = dist;
            closestLink = { nodeA: `${gx},${gy}`, nodeB: `${gx + 1},${gy}` };
          }
        }

        // Vertical link
        if (gy < gridH - 1) {
          const pB = gridToPixel(gx, gy + 1, canvas.width, canvas.height, gridW, gridH);
          const midX = (pA.x + pB.x) / 2;
          const midY = (pA.y + pB.y) / 2;
          const dist = Math.hypot(mx - midX, my - midY);
          if (dist < minLinkDist && my >= pA.y - 4 && my <= pB.y + 4 && Math.abs(mx - pA.x) < 16) {
            minLinkDist = dist;
            closestLink = { nodeA: `${gx},${gy}`, nodeB: `${gx},${gy + 1}` };
          }
        }
      }
    }

    return { node: closestNode, link: closestLink, mx, my };
  }, [gridW, gridH]);

  const handleMouseDown = useCallback((e) => {
    const { node, link, mx, my } = getMouseInteractions(e);

    // Right click resets selected tool and drag-states OR deletes clicked component
    if (e.button === 2) {
      e.preventDefault();
      setSelectedTool(null);
      setDragStartNode(null);
      setDraggedComponent(null);
      
      if (link) {
        const clicked = components.find(c => 
          (c.nodeA === link.nodeA && c.nodeB === link.nodeB) || 
          (c.nodeA === link.nodeB && c.nodeB === link.nodeA)
        );
        if (clicked) {
          setComponents(prev => prev.filter(c => c.id !== clicked.id));
          if (selectedCompId === clicked.id) {
            setSelectedCompId(null);
          }
        }
      }
      return;
    }

    if (selectedTool === "voltmeter") {
      if (node) {
        setVoltmeterProbes(prev => {
          if (!prev.red) return { ...prev, red: node };
          if (!prev.black) return { ...prev, black: node };
          return { red: node, black: null }; // Reset to first lead placed
        });
      }
      return;
    }

    if (selectedTool === "eraser") {
      if (link) {
        setComponents(prev => prev.filter(c => 
          !((c.nodeA === link.nodeA && c.nodeB === link.nodeB) || 
            (c.nodeA === link.nodeB && c.nodeB === link.nodeA))
        ));
      }
      return;
    }

    // Place a component on click
    if (selectedTool && link) {
      // Find if component exists in this slot and remove it
      const newComponents = components.filter(c => 
        !((c.nodeA === link.nodeA && c.nodeB === link.nodeB) || 
          (c.nodeA === link.nodeB && c.nodeB === link.nodeA))
      );

      // Create new component
      const id = `${selectedTool}-${Date.now()}`;
      let value = 10;
      let state = undefined;
      
      if (selectedTool === "battery") value = 9;
      if (selectedTool === "bulb") value = 5;
      if (selectedTool === "switch") state = { open: false, burnt: false };

      const newComp = {
        id,
        type: selectedTool,
        nodeA: link.nodeA,
        nodeB: link.nodeB,
        value,
        state
      };

      setComponents([...newComponents, newComp]);
      setSelectedCompId(id);
      
      // Auto reset tool for one-shot placement except wires
      if (selectedTool !== "wire") {
        setSelectedTool(null);
      }
      return;
    }

    // If pointer mode, click to select/toggle or start drag operations
    if (!selectedTool) {
      // 1. Snapped to a node -> Start wire-drawing drag
      if (node) {
        setDragStartNode(node);
        setDragCurrentMouse({ x: mx, y: my });
        setSelectedCompId(null);
        return;
      }

      // 2. Clicked on a component link -> Start component-move drag
      if (link) {
        const clicked = components.find(c => 
          (c.nodeA === link.nodeA && c.nodeB === link.nodeB) || 
          (c.nodeA === link.nodeB && c.nodeB === link.nodeA)
        );

        if (clicked) {
          setDraggedComponent(clicked);
          setDragStartLink({ nodeA: clicked.nodeA, nodeB: clicked.nodeB });
          setSelectedCompId(clicked.id);

          // Find all wires directly connected to this component's terminal nodes
          const connectedWires = components.filter(c => 
            c.type === "wire" && 
            (c.nodeA === clicked.nodeA || c.nodeB === clicked.nodeA || 
             c.nodeA === clicked.nodeB || c.nodeB === clicked.nodeB)
          );
          setDraggedWires(connectedWires);

          // Temporarily remove component AND its connected wires while dragging
          const connectedWireIds = new Set(connectedWires.map(w => w.id));
          setComponents(prev => prev.filter(c => c.id !== clicked.id && !connectedWireIds.has(c.id)));
        } else {
          setSelectedCompId(null);
        }
      } else {
        // Clicked outside any component boundary -> unselect
        setSelectedCompId(null);
      }
    }
  }, [selectedTool, components, getMouseInteractions]);

  const handleMouseMove = useCallback((e) => {
    const { node, link, mx, my } = getMouseInteractions(e);

    // If dragging to draw a wire
    if (dragStartNode) {
      setDragCurrentMouse({ x: mx, y: my });
      setHoveredNode(node);
      
      if (node && node !== dragStartNode) {
        const nA = parseNode(dragStartNode);
        const nB = parseNode(node);
        // Only snap to adjacent nodes
        const isAdjacent = Math.abs(nA.x - nB.x) + Math.abs(nA.y - nB.y) === 1;
        if (isAdjacent) {
          setDragCurrentNode(node);
        } else {
          setDragCurrentNode(null);
        }
      } else {
        setDragCurrentNode(null);
      }
      return;
    }

    // If dragging to move a component
    if (draggedComponent) {
      setHoveredLink(link);
      return;
    }

    // Normal hover states
    setHoveredNode(node);
    setHoveredLink(link);
  }, [dragStartNode, draggedComponent, getMouseInteractions]);

  const handleMouseUp = useCallback((e) => {
    const { node, link } = getMouseInteractions(e);

    // 1. Finish wire drag
    if (dragStartNode) {
      if (node && node !== dragStartNode) {
        const nA = parseNode(dragStartNode);
        const nB = parseNode(node);
        const isAdjacent = Math.abs(nA.x - nB.x) + Math.abs(nA.y - nB.y) === 1;

        if (isAdjacent) {
          // Clear any component in this slot
          const cleanComponents = components.filter(c => 
            !((c.nodeA === dragStartNode && c.nodeB === node) || 
              (c.nodeA === node && c.nodeB === dragStartNode))
          );

          const id = `wire-${Date.now()}`;
          const newWire = {
            id,
            type: "wire",
            nodeA: dragStartNode,
            nodeB: node
          };
          setComponents([...cleanComponents, newWire]);
          setSelectedCompId(id);
        }
      }
      setDragStartNode(null);
      setDragCurrentNode(null);
      setDragCurrentMouse(null);
      return;
    }

    // 2. Finish component drag move
    if (draggedComponent) {
      if (link) {
        const isSameSlot = link.nodeA === dragStartLink.nodeA && link.nodeB === dragStartLink.nodeB;

        if (isSameSlot) {
          // Put the component back
          let finalComp = draggedComponent;
          if (draggedComponent.type === "switch") {
            finalComp = {
              ...draggedComponent,
              state: {
                ...draggedComponent.state,
                open: !draggedComponent.state?.open
              }
            };
          }
          setComponents(prev => [...prev, finalComp, ...draggedWires]);
        } else {
          // Dragged to a new slot!
          const oldA = parseNode(dragStartLink.nodeA);
          const newA = parseNode(link.nodeA);
          const dx = newA.x - oldA.x;
          const dy = newA.y - oldA.y;

          // Filter out any component existing in the new target slot
          let cleanComponents = components.filter(c => 
            !((c.nodeA === link.nodeA && c.nodeB === link.nodeB) || 
              (c.nodeA === link.nodeB && c.nodeB === link.nodeA))
          );

          const movedComp = {
            ...draggedComponent,
            nodeA: link.nodeA,
            nodeB: link.nodeB
          };
          cleanComponents.push(movedComp);

          // Shift and place the connected wires relative to the move displacement
          draggedWires.forEach(w => {
            const wA = parseNode(w.nodeA);
            const wB = parseNode(w.nodeB);
            
            const nxA = wA.x + dx;
            const nyA = wA.y + dy;
            const nxB = wB.x + dx;
            const nyB = wB.y + dy;

            // Only place if shifted wire falls within grid bounds
            if (nxA >= 0 && nxA < gridW && nyA >= 0 && nyA < gridH &&
                nxB >= 0 && nxB < gridW && nyB >= 0 && nyB < gridH) {
              
              const newNodeA = `${nxA},${nyA}`;
              const newNodeB = `${nxB},${nyB}`;

              // Overwrite any component existing in this wire's new target slot
              cleanComponents = cleanComponents.filter(c => 
                !((c.nodeA === newNodeA && c.nodeB === newNodeB) || 
                  (c.nodeA === newNodeB && c.nodeB === newNodeA))
              );

              cleanComponents.push({
                ...w,
                nodeA: newNodeA,
                nodeB: newNodeB
              });
            }
          });

          setComponents(cleanComponents);
          setSelectedCompId(movedComp.id);
        }
      } else {
        // Drop failed, return both component and wires to original slots
        setComponents(prev => [...prev, draggedComponent, ...draggedWires]);
      }
      setDraggedComponent(null);
      setDraggedWires([]);
      setDragStartLink(null);
    }
  }, [dragStartNode, draggedComponent, draggedWires, components, gridW, gridH, getMouseInteractions]);

  // Continuous animation frame loop for rendering
  useEffect(() => {
    let animationId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const ctx = canvas.getContext("2d");
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = CLR.bg;
      ctx.fillRect(0, 0, W, H);

      // 1. Draw breadboard grid nodes
      drawGridNodes(ctx, W, H, gridW, gridH, voltmeterProbes, hoveredNode);

      // 2. Draw placed components
      components.forEach(c => {
        const cur = currents[c.id] || 0;
        const pwr = powers[c.id] || 0;
        drawComponent(ctx, c, W, H, gridW, gridH, cur, pwr, selectedCompId === c.id);
      });

      // 3. Draw hover preview of component to place
      if (selectedTool && hoveredLink && selectedTool !== "voltmeter" && selectedTool !== "eraser") {
        const previewComp = {
          type: selectedTool,
          nodeA: hoveredLink.nodeA,
          nodeB: hoveredLink.nodeB,
          value: selectedTool === "battery" ? 9 : (selectedTool === "bulb" ? 5 : 10),
          state: selectedTool === "switch" ? { open: false } : undefined
        };
        ctx.globalAlpha = 0.45;
        drawComponent(ctx, previewComp, W, H, gridW, gridH, 0, 0, false);
        ctx.globalAlpha = 1.0;
      }

      // 3b. Draw hover preview of dragged component being moved
      if (draggedComponent && hoveredLink) {
        const previewComp = {
          ...draggedComponent,
          nodeA: hoveredLink.nodeA,
          nodeB: hoveredLink.nodeB
        };
        ctx.globalAlpha = 0.45;
        drawComponent(ctx, previewComp, W, H, gridW, gridH, 0, 0, false);
        ctx.globalAlpha = 1.0;
      }

      // 3c. Draw wire drag preview rubber-band line
      if (dragStartNode && dragCurrentMouse) {
        const start = parseNode(dragStartNode);
        const pStart = gridToPixel(start.x, start.y, W, H, gridW, gridH);
        
        ctx.save();
        ctx.strokeStyle = CLR.wire;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(dragCurrentMouse.x, dragCurrentMouse.y);
        ctx.stroke();

        // Snap target node highlight
        if (dragCurrentNode) {
          const end = parseNode(dragCurrentNode);
          const pEnd = gridToPixel(end.x, end.y, W, H, gridW, gridH);
          ctx.fillStyle = CLR.accent;
          ctx.beginPath();
          ctx.arc(pEnd.x, pEnd.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3d. Draw hover preview of dragged wires being moved relative to component
      if (draggedComponent && draggedWires.length > 0 && hoveredLink) {
        const oldA = parseNode(dragStartLink.nodeA);
        const newA = parseNode(hoveredLink.nodeA);
        const dx = newA.x - oldA.x;
        const dy = newA.y - oldA.y;

        draggedWires.forEach(w => {
          const wA = parseNode(w.nodeA);
          const wB = parseNode(w.nodeB);
          
          const nxA = wA.x + dx;
          const nyA = wA.y + dy;
          const nxB = wB.x + dx;
          const nyB = wB.y + dy;

          if (nxA >= 0 && nxA < gridW && nyA >= 0 && nyA < gridH &&
              nxB >= 0 && nxB < gridW && nyB >= 0 && nyB < gridH) {
            const previewWire = {
              ...w,
              nodeA: `${nxA},${nyA}`,
              nodeB: `${nxB},${nyB}`
            };
            ctx.globalAlpha = 0.45;
            drawComponent(ctx, previewWire, W, H, gridW, gridH, 0, 0, false);
            ctx.globalAlpha = 1.0;
          }
        });
      }

      // 4. Draw voltmeter leads and voltmeter body
      drawVoltmeter(ctx, W, H, gridW, gridH, voltmeterProbes, voltmeterVoltage);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [components, selectedTool, hoveredNode, hoveredLink, selectedCompId, voltmeterProbes, voltmeterVoltage, currents, powers, gridW, gridH, dragStartNode, dragCurrentNode, dragCurrentMouse, draggedComponent, draggedWires]);

  // Update selected component value (resistance or battery voltage)
  const handleValueChange = (v) => {
    if (!selectedCompId) return;
    setComponents(prev => prev.map(c => 
      c.id === selectedCompId ? { ...c, value: v } : c
    ));
  };

  // Reset circuit board
  const handleClearBoard = () => {
    setComponents([]);
    setSelectedCompId(null);
    setVoltmeterProbes({ red: null, black: null });
  };

  // Preset loading helper
  const loadPreset = (presetName) => {
    handleClearBoard();
    if (presetName === "simple") {
      setComponents(INITIAL_COMPONENTS);
    } else if (presetName === "parallel") {
      setComponents([
        { id: "bat-1", type: "battery", nodeA: "1,3", nodeB: "1,4", value: 9 },
        { id: "p-w1", type: "wire", nodeA: "1,2", nodeB: "1,3" },
        { id: "p-w2", type: "wire", nodeA: "1,2", nodeB: "2,2" },
        { id: "p-w3", type: "wire", nodeA: "2,2", nodeB: "3,2" },
        { id: "p-w4", type: "wire", nodeA: "1,4", nodeB: "1,5" },
        { id: "p-w5", type: "wire", nodeA: "1,5", nodeB: "2,5" },
        { id: "p-w6", type: "wire", nodeA: "2,5", nodeB: "3,5" },
        // Parallel Branch 1: Bulb
        { id: "p-b1", type: "wire", nodeA: "3,2", nodeB: "3,3" },
        { id: "bulb-1", type: "bulb", nodeA: "3,3", nodeB: "3,4", value: 10 },
        { id: "p-b2", type: "wire", nodeA: "3,4", nodeB: "3,5" },
        // Parallel Branch 2: Resistor
        { id: "p-r1", type: "wire", nodeA: "3,2", nodeB: "4,2" },
        { id: "p-r2", type: "wire", nodeA: "4,2", nodeB: "5,2" },
        { id: "p-r3", type: "wire", nodeA: "3,5", nodeB: "4,5" },
        { id: "p-r4", type: "wire", nodeA: "4,5", nodeB: "5,5" },
        { id: "p-r5", type: "wire", nodeA: "5,2", nodeB: "5,3" },
        { id: "res-1", type: "resistor", nodeA: "5,3", nodeB: "5,4", value: 10 },
        { id: "p-r6", type: "wire", nodeA: "5,4", nodeB: "5,5" }
      ]);
    } else if (presetName === "ammeter-check") {
      setComponents([
        { id: "bat-1", type: "battery", nodeA: "1,3", nodeB: "1,4", value: 12 },
        { id: "a-w1", type: "wire", nodeA: "1,2", nodeB: "1,3" },
        { id: "a-w2", type: "wire", nodeA: "1,2", nodeB: "2,2" },
        { id: "amm-1", type: "ammeter", nodeA: "2,2", nodeB: "3,2" },
        { id: "a-w3", type: "wire", nodeA: "3,2", nodeB: "4,2" },
        { id: "a-w4", type: "wire", nodeA: "4,2", nodeB: "5,2" },
        { id: "a-w5", type: "wire", nodeA: "5,2", nodeB: "5,3" },
        { id: "res-1", type: "resistor", nodeA: "5,3", nodeB: "5,4", value: 10 },
        { id: "a-w6", type: "wire", nodeA: "5,4", nodeB: "5,5" },
        { id: "a-w7", type: "wire", nodeA: "4,5", nodeB: "5,5" },
        { id: "bulb-1", type: "bulb", nodeA: "3,5", nodeB: "4,5", value: 5 },
        { id: "a-w8", type: "wire", nodeA: "2,5", nodeB: "3,5" },
        { id: "a-w9", type: "wire", nodeA: "1,5", nodeB: "2,5" },
        { id: "a-w10", type: "wire", nodeA: "1,4", nodeB: "1,5" }
      ]);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" onContextMenu={e => e.preventDefault()}>
      
      {/* ── LEFT PANEL: INVENTORY ───────────────────────────────────────────── */}
      <div 
        className="w-48 shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: CLR.panel, borderColor: CLR.border }}
      >
        <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: CLR.border }}>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(57,211,83,0.12)" }}
            >
              <Zap size={14} style={{ color: CLR.neon }} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none" style={{ color: CLR.text }}>Circuit Sandbox</p>
              <p className="text-[9px] mt-0.5" style={{ color: CLR.muted }}>Breadboard Grid</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-3 flex-1">
          {/* Inventory list */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>
              Components
            </p>
            {[
              { id: "wire", label: "Connecting Wire", icon: "🔌" },
              { id: "battery", label: "Battery Cell", icon: "🔋" },
              { id: "resistor", label: "Resistor", icon: "🧱" },
              { id: "bulb", label: "Light Bulb", icon: "💡" },
              { id: "switch", label: "Switch", icon: "⚡" },
              { id: "ammeter", label: "Ammeter", icon: "⏱️" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setSelectedTool(selectedTool === item.id ? null : item.id); setSelectedCompId(null); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left"
                style={{
                  borderColor: selectedTool === item.id ? CLR.neon : CLR.border,
                  background: selectedTool === item.id ? "rgba(57,211,83,0.08)" : "transparent",
                  color: selectedTool === item.id ? CLR.neon : CLR.text
                }}
              >
                <span className="text-sm leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Diagnostic tools */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>
              Diagnostic Tools
            </p>
            <button
              onClick={() => { setSelectedTool(selectedTool === "voltmeter" ? null : "voltmeter"); setSelectedCompId(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left"
              style={{
                borderColor: selectedTool === "voltmeter" ? CLR.amber : CLR.border,
                background: selectedTool === "voltmeter" ? "rgba(227,179,65,0.08)" : "transparent",
                color: selectedTool === "voltmeter" ? CLR.amber : CLR.text
              }}
            >
              <span className="text-sm leading-none">🧪</span>
              <div className="flex flex-col">
                <span>Voltmeter</span>
                <span className="text-[8px] font-normal" style={{ color: CLR.muted }}>Clip parallel leads</span>
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 mt-auto">
            <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>
              Actions
            </p>
            <button
              onClick={() => setSelectedTool(selectedTool === "eraser" ? null : "eraser")}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left"
              style={{
                borderColor: selectedTool === "eraser" ? CLR.warn : CLR.border,
                background: selectedTool === "eraser" ? "rgba(244,112,103,0.08)" : "transparent",
                color: selectedTool === "eraser" ? CLR.warn : CLR.muted
              }}
            >
              <Trash2 size={13} />
              <span>Eraser</span>
            </button>
            <button
              onClick={handleClearBoard}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left"
              style={{ borderColor: CLR.border, color: CLR.muted }}
            >
              <RotateCcw size={13} />
              <span>Clear Board</span>
            </button>
          </div>

          {/* View toggle */}
          <div className="flex flex-col gap-1.5 mt-2">
            <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: CLR.muted }}>View</p>
            <button
              onClick={() => setShowFormulas(!showFormulas)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs border transition-all"
              style={{
                borderColor: showFormulas ? "rgba(57,211,83,0.5)" : CLR.border,
                background: showFormulas ? "rgba(57,211,83,0.07)" : "transparent",
                color: showFormulas ? CLR.neon : CLR.muted,
              }}>
              <span>Formulas (∑)</span>
              <span className="text-[9px] font-mono">{showFormulas ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CENTER PANEL: CANVAS & ALERTS ───────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 p-3 gap-2 relative">
        <FormulaOverlay
          type="power"
          isOpen={showFormulas}
          onClose={() => setShowFormulas(false)}
          data={{ solverResults, components }}
        />
        <div className="flex items-center justify-end px-1">
          

          {/* Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: CLR.muted }}>Presets:</span>
            {["simple", "parallel", "ammeter-check"].map(name => (
              <button
                key={name}
                onClick={() => loadPreset(name)}
                className="px-2 py-0.5 rounded border text-[9px] font-bold uppercase transition-all"
                style={{ borderColor: CLR.border, color: CLR.muted }}
                onMouseEnter={e => e.currentTarget.style.borderColor = CLR.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = CLR.border}
              >
                {name.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <LabCanvas
          canvasRef={canvasRef}
          canvasSize={canvasSize}
          onResize={setCanvasSize}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        {/* Warnings & alerts */}
        <AnimatePresence>
          {components.length > 0 && !solverResults.success && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 border shrink-0"
              style={{ borderColor: CLR.warn, background: "rgba(244,112,103,0.07)" }}
            >
              <AlertTriangle size={16} style={{ color: CLR.warn }} />
              <span className="text-xs font-bold" style={{ color: CLR.warn }}>
                ELECTRICAL CONFLICT! The circuit cannot be simulated. This happens if batteries of different voltages are in parallel, or if a loop contains conflicting ideal elements. Check your nodes.
              </span>
            </motion.div>
          )}
          {solverResults.success && isShortCircuit && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 border shrink-0"
              style={{ borderColor: CLR.warn, background: "rgba(244,112,103,0.07)" }}
            >
              <ShieldAlert size={16} style={{ color: CLR.warn }} />
              <span className="text-xs font-bold" style={{ color: CLR.warn }}>
                SHORT CIRCUIT DETECTED! Circuit values have been tripped. Place resistors/bulbs in series to limit flow.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Telemetry Panel */}
        <CircuitTelemetry 
          components={components} 
          solverResults={solverResults} 
          currents={currents} 
          powers={powers} 
        />
      </div>

      {/* ── RIGHT PANEL: INSPECTOR & THEORY ─────────────────────────────────── */}
      <div 
        className="w-64 shrink-0 border-l flex flex-col overflow-y-auto"
        style={{ borderColor: CLR.border, background: CLR.panel }}
      >
        <div className="flex flex-col gap-3 p-4 flex-1">
          {selectedComponent ? (
            // Component Inspector View
            <HubSection 
              title="Component Inspector" 
              icon={<Compass size={13} style={{ color: CLR.neon }} />}
            >
              <div className="pt-3 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: CLR.border }}>
                  <span className="text-xs font-bold uppercase" style={{ color: CLR.text }}>
                    {selectedComponent.type}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: CLR.muted }}>
                    ID: {selectedCompId}
                  </span>
                </div>

                {/* Battery Sliders */}
                {selectedComponent.type === "battery" && (
                  <HubSliderRow
                    label="EMF Voltage (V)"
                    value={selectedComponent.value}
                    min={1.5}
                    max={24}
                    step={0.5}
                    unit="V"
                    onChange={handleValueChange}
                    accentColor={CLR.neon}
                  />
                )}

                {/* Resistor Sliders */}
                {selectedComponent.type === "resistor" && (
                  <HubSliderRow
                    label="Resistance (R)"
                    value={selectedComponent.value}
                    min={1}
                    max={100}
                    step={1}
                    unit="Ω"
                    onChange={handleValueChange}
                    accentColor={CLR.accent}
                  />
                )}

                {/* Bulb Sliders & Burnt Controls */}
                {selectedComponent.type === "bulb" && (
                  <div className="flex flex-col gap-3">
                    <HubSliderRow
                      label="Filament resistance (R)"
                      value={selectedComponent.value}
                      min={1}
                      max={50}
                      step={1}
                      unit="Ω"
                      onChange={handleValueChange}
                      accentColor={CLR.bulb}
                      disabled={selectedComponent.state?.burnt}
                    />
                    
                    {selectedComponent.state?.burnt ? (
                      <div className="flex flex-col gap-2 p-2 border rounded-lg" style={{ borderColor: CLR.warn, background: "rgba(244,112,103,0.05)" }}>
                        <span className="text-xs font-bold text-center" style={{ color: CLR.warn }}>
                          🔥 BULB BURNT OUT!
                        </span>
                        <p className="text-[9px] text-center" style={{ color: CLR.muted }}>
                          Current exceeded the 2.5 A safety capacity.
                        </p>
                        <button
                          onClick={() => setComponents(prev => prev.map(c => 
                            c.id === selectedComponent.id ? { ...c, state: { ...c.state, burnt: false } } : c
                          ))}
                          className="w-full text-center py-1.5 rounded border text-xs font-bold uppercase transition-all"
                          style={{ borderColor: CLR.warn, color: CLR.warn, background: "rgba(244,112,103,0.08)" }}
                        >
                          Replace Bulb
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px]" style={{ color: CLR.muted }}>
                        <span>Bulb Capacity:</span>
                        <span className="font-bold font-mono text-emerald-400">Max 2.50 A</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Switch Inspector */}
                {selectedComponent.type === "switch" && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: CLR.muted }}>Switch State:</span>
                    <button
                      onClick={() => setComponents(prev => prev.map(c => 
                        c.id === selectedComponent.id ? { ...c, state: { open: !c.state?.open } } : c
                      ))}
                      className="px-2.5 py-1 rounded text-xs font-bold border transition-all"
                      style={{ 
                        borderColor: selectedComponent.state?.open ? CLR.warn : CLR.neon,
                        color: selectedComponent.state?.open ? CLR.warn : CLR.neon,
                        background: "transparent"
                      }}
                    >
                      {selectedComponent.state?.open ? "OPEN (Off)" : "CLOSED (On)"}
                    </button>
                  </div>
                )}

                {/* Live physics readout for this component */}
                <div className="rounded-lg p-2.5 border" style={{ borderColor: CLR.border, background: "rgba(0,0,0,0.15)" }}>
                  <p className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: CLR.muted }}>
                    Live Branch Metrics
                  </p>
                  
                  <div className="flex flex-col gap-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span style={{ color: CLR.muted }}>Current:</span>
                      <span style={{ color: CLR.accent }}>
                        {(currents[selectedCompId] || 0).toFixed(3)} A
                      </span>
                    </div>

                    {selectedComponent.type === "bulb" && (
                      <div className="flex items-center justify-between">
                        <span style={{ color: CLR.muted }}>Power drop:</span>
                        <span style={{ color: CLR.bulb }}>
                          {(powers[selectedCompId] || 0).toFixed(2)} W
                        </span>
                      </div>
                    )}

                    {selectedComponent.type !== "battery" && (
                      <div className="flex items-center justify-between">
                        <span style={{ color: CLR.muted }}>Voltage Drop:</span>
                        <span style={{ color: CLR.neon }}>
                          {selectedComponent.type === "switch" && selectedComponent.state?.open ? (
                            <span>{voltmeterVoltage.toFixed(2)} V (floating)</span>
                          ) : (
                            <span>{((currents[selectedCompId] || 0) * (selectedComponent.value || 0.02)).toFixed(2)} V</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Help tip */}
                <div className="flex gap-2 text-[10px] leading-relaxed" style={{ color: CLR.muted }}>
                  <HelpCircle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Change component values using the sliders. Changes are simulated instantly on the breadboard layout.
                  </span>
                </div>
              </div>
            </HubSection>
          ) : (
            // Default Theory & Grid Settings View
            <div className="flex flex-col gap-4 flex-1">
              
              {/* Grid Settings Section */}
              <HubSection title="Grid Dimensions" icon={<Settings size={13} style={{ color: CLR.accent }} />}>
                <div className="pt-3 flex flex-col gap-4">
                  <HubSliderRow
                    label="Grid Columns"
                    value={gridW}
                    min={5}
                    max={15}
                    step={1}
                    unit=""
                    onChange={handleGridWChange}
                    accentColor={CLR.accent}
                  />
                  <HubSliderRow
                    label="Grid Rows"
                    value={gridH}
                    min={5}
                    max={12}
                    step={1}
                    unit=""
                    onChange={handleGridHChange}
                    accentColor={CLR.accent}
                  />
                  <p className="text-[10px]" style={{ color: CLR.muted }}>
                    Adjusting dimensions dynamically resizes the breadboard grid. 
                    Components outside the new limits will be automatically cleared.
                  </p>
                </div>
              </HubSection>

              <HubSection 
                title="Lab Theory Guide" 
                icon={<BookOpen size={13} style={{ color: CLR.accent }} />}
              >
                <div className="pt-3 flex flex-col gap-3 text-xs leading-relaxed" style={{ color: CLR.muted }}>
                  <p>
                    A circuit is a **continuous closed loop** that allows electric charge to flow. Ohm's Law regulates the relationship between Voltage, Current, and Resistance:
                  </p>
                  
                  <div className="p-2 font-mono text-[11px] rounded text-center font-bold" style={{ background: "rgba(0,0,0,0.2)", color: CLR.text }}>
                    V = I × R &nbsp;&nbsp;|&nbsp;&nbsp; I = V / R
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-emerald-400" />
                      <span>
                        **Ammeter**: Spliced directly in series. It measures the rate of charge flow through a single branch.
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-emerald-400" />
                      <span>
                        **Voltmeter**: Clipped in parallel across a load. It measures the difference in electrical potential.
                      </span>
                    </div>
                  </div>
                </div>
              </HubSection>

              <HubSection 
                title="How to Build" 
                icon={<HelpCircle size={13} style={{ color: CLR.amber }} />}
              >
                <div className="pt-3 flex flex-col gap-2.5 text-xs text-left" style={{ color: CLR.muted }}>
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 text-[9px] rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">1</span>
                    <span>Select a component from the Left Inventory.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 text-[9px] rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">2</span>
                    <span>Click on any link between two dots to place it.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 text-[9px] rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">3</span>
                    <span>Make sure to connect a Battery, Wires, and a Resistor/Bulb to form a loop.</span>
                  </div>
                </div>
              </HubSection>
            </div>
          )}

          {/* Voltmeter display readouts */}
          {voltmeterProbes.red || voltmeterProbes.black ? (
            <div 
              className="mt-auto border rounded-xl p-3 flex flex-col gap-2 transition-all"
              style={{ borderColor: CLR.amber, background: "rgba(227,179,65,0.05)" }}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: CLR.amber }}>
                <Compass size={13} />
                <span>Voltmeter Leads</span>
              </div>
              <div className="flex flex-col gap-1 text-[11px] font-mono" style={{ color: CLR.muted }}>
                <div className="flex justify-between">
                  <span>Red Probe (+):</span>
                  <span style={{ color: "#ff5555" }}>{voltmeterProbes.red || "Not connected"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Black Probe (-):</span>
                  <span style={{ color: CLR.text }}>{voltmeterProbes.black || "Not connected"}</span>
                </div>
                {voltmeterProbes.red && voltmeterProbes.black && (
                  <div className="flex justify-between border-t pt-1 mt-1.5 font-bold" style={{ borderColor: CLR.border }}>
                    <span style={{ color: CLR.text }}>Potential Difference:</span>
                    <span style={{ color: CLR.neon }}>{voltmeterVoltage.toFixed(2)} V</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setVoltmeterProbes({ red: null, black: null })}
                className="w-full text-center py-1 mt-1 rounded border text-[9px] font-bold uppercase transition-all"
                style={{ borderColor: CLR.border, color: CLR.muted }}
                onMouseEnter={e => e.currentTarget.style.borderColor = CLR.warn}
                onMouseLeave={e => e.currentTarget.style.borderColor = CLR.border}
              >
                Remove Probes
              </button>
            </div>
          ) : null}
        </div>
      </div>

    </div>
  );
}

// ─── Compact metric card for circuit telemetry ──────────────────────────────
function CompactTelemetryMetric({ label, value, unit, accent }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px]"
      style={{ background: CLR.bg, borderColor: CLR.border }}
    >
      <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: CLR.muted }}>
        {label}:
      </span>
      <span className="font-mono font-bold tabular-nums" style={{ color: accent || CLR.text }}>
        {value}
      </span>
      {unit && (
        <span className="text-[9px] ml-0.5" style={{ color: CLR.muted }}>
          {unit}
        </span>
      )}
    </div>
  );
}

// ─── Circuit Telemetry Sub-component ──────────────────────────────────────────
function CircuitTelemetry({ components, solverResults, currents, powers }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { voltages, success, isShortCircuit } = solverResults;

  // Accumulated Energy (E) and Per-component Heat (Q) tracking
  const [energyJoules, setEnergyJoules] = useState(0);
  const [heatJoules, setHeatJoules] = useState({});
  const lastTickRef = useRef(Date.now());

  // Calculate global electrical metrics
  const batteries = components.filter(c => c.type === "battery");
  const vSource = batteries.length > 0 ? (batteries[0].value || 9.0) : 0;
  
  // Total current leaving battery positive terminals
  const iTotal = success ? batteries.reduce((sum, b) => sum + Math.abs(currents[b.id] || 0), 0) : 0;
  const pSupplied = success ? batteries.reduce((sum, b) => sum + (powers[b.id] || 0), 0) : 0;
  
  // Load dissipation (useful power in resistors, bulbs, wires)
  const loads = components.filter(c => c.type !== "battery");
  const pLoads = success ? loads.reduce((sum, c) => sum + (powers[c.id] || 0), 0) : 0;
  const pTotal = success ? components.reduce((sum, c) => sum + (powers[c.id] || 0), 0) : 0;

  const rEq = (success && iTotal > 0.005) ? (vSource / iTotal) : null;
  const isClosedLoop = success && iTotal > 0.005;
  const isOvercurrent = isShortCircuit || (rEq !== null && rEq < 0.1);

  // Circuit efficiency η = (Power dissipated in loads / Total power supplied) * 100%
  const efficiency = pSupplied > 0 ? Math.min(100, Math.max(0, (pLoads / pSupplied) * 100)) : 0;

  // Active loads count (resistors or bulbs drawing current > 1mA)
  const activeLoadsCount = components.filter(c => 
    (c.type === "resistor" || c.type === "bulb") && Math.abs(currents[c.id] || 0) > 0.001
  ).length;

  // Continuous Energy & Heat Accumulation loop
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      if (success && isClosedLoop && pTotal > 0 && dt > 0 && dt < 1) {
        setEnergyJoules(prev => prev + pLoads * dt);

        setHeatJoules(prev => {
          const next = { ...prev };
          components.forEach(c => {
            const p = powers[c.id] || 0;
            if (c.type !== "battery" && p > 0) {
              next[c.id] = (next[c.id] || 0) + p * dt;
            }
          });
          return next;
        });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [success, isClosedLoop, pLoads, pTotal, components, powers]);

  const handleResetEnergy = () => {
    setEnergyJoules(0);
    setHeatJoules({});
  };

  return (
    <div
      className="rounded-xl border p-2.5 transition-all flex flex-col gap-2 shrink-0"
      style={{ background: CLR.panel, borderColor: CLR.border }}
    >
      {/* Top Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 overflow-hidden flex-1 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <BarChart2 size={13} style={{ color: CLR.accent }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CLR.text }}>
              Circuit Telemetry
            </span>
          </div>

          {/* Quick status badges */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className={`px-2 py-0.5 rounded font-bold border ${
              isClosedLoop 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}>
              {isClosedLoop ? "🟢 CLOSED (Complete)" : "🔴 OPEN (Broken)"}
            </span>

            {isOvercurrent ? (
              <span className="px-2 py-0.5 rounded font-bold border bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse flex items-center gap-1">
                <span>⚠️</span> OVERCURRENT
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded font-bold border bg-slate-900 border-slate-700 text-slate-300">
                ✓ NORMAL
              </span>
            )}
          </div>

          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-wrap items-center gap-1.5"
            >
              <CompactTelemetryMetric 
                label="Voltage" 
                value={vSource.toFixed(1)} 
                unit="V" 
                accent={CLR.neon} 
              />
              <CompactTelemetryMetric 
                label="Current" 
                value={iTotal.toFixed(3)} 
                unit="A" 
                accent={CLR.accent} 
              />
              <CompactTelemetryMetric 
                label="Power" 
                value={pLoads.toFixed(2)} 
                unit="W" 
                accent={CLR.bulb} 
              />
              <CompactTelemetryMetric 
                label="Energy (E)" 
                value={energyJoules >= 1000 ? `${(energyJoules / 1000).toFixed(2)} k` : energyJoules.toFixed(1)} 
                unit="J" 
                accent={CLR.amber} 
              />
              <CompactTelemetryMetric 
                label="Efficiency" 
                value={`${efficiency.toFixed(1)}`} 
                unit="%" 
                accent="#38bdf8" 
              />
            </motion.div>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all shrink-0"
          style={{
            borderColor: CLR.border,
            color: CLR.text,
            background: CLR.bg,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = CLR.accent;
            e.currentTarget.style.color = CLR.accent;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = CLR.border;
            e.currentTarget.style.color = CLR.text;
          }}
        >
          <span>{isExpanded ? "Hide Logs" : "Detailed Log"}</span>
          {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      </div>

      {/* Expanded panel contents */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-2.5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 mt-1 text-xs">
              
              {/* Detailed Global Stats Panel */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                    Global Stats & Safety
                  </p>
                  <button
                    onClick={handleResetEnergy}
                    title="Reset energy accumulator"
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-all"
                  >
                    <RefreshCw size={10} /> Reset E
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border rounded-lg flex flex-col" style={{ background: CLR.bg, borderColor: CLR.border }}>
                    <span className="text-[8px] uppercase font-semibold text-slate-400">EMF Voltage</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">{vSource.toFixed(1)} V</span>
                  </div>
                  <div className="p-2 border rounded-lg flex flex-col" style={{ background: CLR.bg, borderColor: CLR.border }}>
                    <span className="text-[8px] uppercase font-semibold text-slate-400">Total Current</span>
                    <span className="text-sm font-bold font-mono text-cyan-400">{iTotal.toFixed(3)} A</span>
                  </div>
                  <div className="p-2 border rounded-lg flex flex-col" style={{ background: CLR.bg, borderColor: CLR.border }}>
                    <span className="text-[8px] uppercase font-semibold text-slate-400">Power Dissipation</span>
                    <span className="text-sm font-bold font-mono text-amber-300">{pLoads.toFixed(2)} W</span>
                  </div>
                  <div className="p-2 border rounded-lg flex flex-col" style={{ background: CLR.bg, borderColor: CLR.border }}>
                    <span className="text-[8px] uppercase font-semibold text-slate-400">Total Load R</span>
                    <span className="text-sm font-bold font-mono text-amber-400">
                      {rEq !== null ? `${rEq.toFixed(2)} Ω` : "∞ (Open)"}
                    </span>
                  </div>
                  <div className="p-2 border rounded-lg flex flex-col" style={{ background: CLR.bg, borderColor: CLR.border }}>
                    <span className="text-[8px] uppercase font-semibold text-slate-400">Energy Consumed (E)</span>
                    <span className="text-sm font-bold font-mono text-purple-400">
                      {energyJoules >= 1000 ? `${(energyJoules / 1000).toFixed(2)} kJ` : `${energyJoules.toFixed(1)} J`}
                    </span>
                  </div>
                  <div className="p-2 border rounded-lg flex flex-col" style={{ background: CLR.bg, borderColor: CLR.border }}>
                    <span className="text-[8px] uppercase font-semibold text-slate-400">Circuit Efficiency</span>
                    <span className="text-sm font-bold font-mono text-sky-400">{efficiency.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Status Badges box */}
                <div className="p-2 border rounded-lg flex flex-col gap-1.5 mt-0.5" style={{ background: CLR.bg, borderColor: CLR.border }}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-semibold">Continuity:</span>
                    <span className={`font-bold ${isClosedLoop ? "text-emerald-400" : "text-rose-400"}`}>
                      {isClosedLoop ? "CLOSED (Complete)" : "OPEN (Broken)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-semibold">Safety State:</span>
                    <span className={`font-bold ${isOvercurrent ? "text-rose-400" : "text-emerald-400"}`}>
                      {isOvercurrent ? "⚠️ OVERCURRENT (<0.1Ω)" : "✓ NORMAL LOAD"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Placed Component Breakdown Table */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                    Placed Component Breakdown
                  </p>
                  <span className="text-[9px] font-mono text-slate-400">
                    {components.length} Items Placed
                  </span>
                </div>

                <div 
                  className="border rounded-lg overflow-y-auto max-h-56 font-mono"
                  style={{ background: CLR.bg, borderColor: CLR.border }}
                >
                  <table className="w-full text-[10px] text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-900 border-b" style={{ borderColor: CLR.border, color: CLR.muted }}>
                      <tr className="font-semibold">
                        <th className="p-1.5 px-2">Component</th>
                        <th className="p-1.5 text-center">Health / State</th>
                        <th className="p-1.5 text-center">Direction</th>
                        <th className="p-1.5 text-right">Setting</th>
                        <th className="p-1.5 text-right">Current (I)</th>
                        <th className="p-1.5 text-right">V Drop</th>
                        <th className="p-1.5 text-right">Signed Power</th>
                        <th className="p-1.5 text-right">Heat (Q)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800" style={{ borderColor: CLR.border }}>
                      {components.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-3 text-center text-slate-400">
                            No components on the breadboard. Select components from the left menu to build a circuit.
                          </td>
                        </tr>
                      ) : (
                        components.map(c => {
                          const iSigned = success ? (currents[c.id] || 0) : 0;
                          const iMag = Math.abs(iSigned);
                          const pAbs = success ? (powers[c.id] || 0) : 0;
                          const qHeat = heatJoules[c.id] || 0;
                          
                          // Calculate voltage drop V = I * R (or EMF directly for battery)
                          let r = 0;
                          if (c.type === "resistor" || c.type === "bulb") r = c.value || 10;
                          else if (c.type === "wire" || c.type === "ammeter") r = 0.02;
                          else if (c.type === "switch") r = c.state?.open ? 1e9 : 0.02;

                          const vDrop = c.type === "battery" ? (c.value || 9.0) : iMag * r;

                          // Current direction string
                          let dirText = `${c.nodeA} ↔ ${c.nodeB}`;
                          if (iSigned > 0.0001) dirText = `${c.nodeA} → ${c.nodeB}`;
                          else if (iSigned < -0.0001) dirText = `${c.nodeB} → ${c.nodeA}`;

                          // Component health / status badge
                          let statusBadge = null;
                          if (c.type === "bulb") {
                            if (c.state?.burnt) statusBadge = <span className="text-rose-400 font-bold">🔥 BLOWN</span>;
                            else if (iMag > 0.001) statusBadge = <span className="text-amber-300 font-bold">💡 LIT</span>;
                            else statusBadge = <span className="text-slate-500">UNLIT</span>;
                          } else if (c.type === "switch") {
                            if (c.state?.open) statusBadge = <span className="text-rose-400 font-bold">🔓 OPEN</span>;
                            else statusBadge = <span className="text-emerald-400 font-bold">🔒 CLOSED</span>;
                          } else if (c.type === "battery") {
                            statusBadge = iMag > 0.001 ? <span className="text-emerald-400 font-bold">🔋 SUPPLY</span> : <span className="text-slate-500">IDLE</span>;
                          } else if (c.type === "resistor") {
                            statusBadge = iMag > 0.001 ? <span className="text-cyan-300 font-bold">⚡ ACTIVE</span> : <span className="text-slate-500">IDLE</span>;
                          } else {
                            statusBadge = <span className="text-slate-400">✓ OK</span>;
                          }

                          // Signed Power Convention: +P for supply (battery), -P for load (resistors, bulbs, etc.)
                          const isSupply = c.type === "battery";
                          const signedPowerStr = pAbs > 0.001 
                            ? (isSupply ? `+${pAbs.toFixed(2)} W` : `-${pAbs.toFixed(2)} W`)
                            : "0.00 W";

                          return (
                            <tr key={c.id} className="hover:bg-slate-800/40 transition-colors" style={{ color: CLR.text }}>
                              {/* Component Type */}
                              <td className="p-1.5 px-2 font-semibold capitalize flex items-center gap-1" 
                                style={{ color: c.type === "battery" ? CLR.neon : (c.type === "bulb" ? CLR.bulb : CLR.text) }}>
                                <span>{c.type === "battery" ? "🔋" : c.type === "bulb" ? "💡" : c.type === "resistor" ? "🧱" : c.type === "switch" ? "⚡" : "🔌"}</span>
                                <span>{c.type}</span>
                              </td>

                              {/* Health / State */}
                              <td className="p-1.5 text-center">
                                {statusBadge}
                              </td>

                              {/* Node Direction */}
                              <td className="p-1.5 text-center text-slate-400 text-[9px]">
                                {dirText}
                              </td>

                              {/* Setting */}
                              <td className="p-1.5 text-right">
                                {c.type === "battery" ? `${c.value}V` : (c.type === "resistor" || c.type === "bulb" ? `${c.value}Ω` : (c.type === "switch" ? (c.state?.open ? "Open" : "Closed") : "0.02Ω"))}
                              </td>

                              {/* Current */}
                              <td className="p-1.5 text-right font-bold" style={{ color: CLR.accent }}>
                                {iMag.toFixed(3)} A
                              </td>

                              {/* Voltage drop */}
                              <td className="p-1.5 text-right" style={{ color: CLR.neon }}>
                                {vDrop.toFixed(2)} V
                              </td>

                              {/* Signed Power */}
                              <td className="p-1.5 text-right font-bold" style={{ color: isSupply ? CLR.neon : CLR.amber }}>
                                {signedPowerStr}
                              </td>

                              {/* Heat / Energy Q */}
                              <td className="p-1.5 text-right text-rose-300">
                                {isSupply ? "—" : `${qHeat.toFixed(1)} J`}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Footer */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border text-[10px] font-mono mt-1"
                  style={{ background: CLR.bg, borderColor: CLR.border }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-emerald-400">
                      {isOvercurrent ? "⚠️ Short Circuit" : isClosedLoop ? "🟢 Closed Loop" : "🔴 Open Circuit"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Heat Generation Rate:</span>
                    <span className="font-bold text-amber-300">{pLoads.toFixed(2)} J/s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Active Load Count:</span>
                    <span className="font-bold text-cyan-300">{activeLoadsCount}</span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


