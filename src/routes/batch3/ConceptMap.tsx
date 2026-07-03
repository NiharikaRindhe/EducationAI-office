import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Download, Sparkles, AlertCircle } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  def: string;
  related: string[];
}

interface Link {
  source: string;
  target: string;
  label: string;
}

export const Batch3ConceptMap: React.FC = () => {
  const [subject, setSubject] = useState<'Maths' | 'Science'>('Science');
  const [chapter, setChapter] = useState('Light Reflection');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Concept maps data
  const conceptMaps: Record<string, { nodes: Node[]; links: Link[] }> = {
    'Light Reflection': {
      nodes: [
        { id: 'n1', label: 'Reflection', x: 200, y: 150, def: 'The bouncing back of light rays when they hit a polished surface like a mirror.', related: ['Plane Mirror', 'Spherical Mirrors'] },
        { id: 'n2', label: 'Incidence Ray', x: 80, y: 80, def: 'A ray of light that strikes the reflecting surface.', related: ['Angle of Incidence'] },
        { id: 'n3', label: 'Reflected Ray', x: 320, y: 80, def: 'A ray of light sent back by the reflecting surface.', related: ['Angle of Reflection'] },
        { id: 'n4', label: 'Normal Line', x: 200, y: 50, def: 'An imaginary line perpendicular to the reflecting surface at the point of incidence.', related: ['Reflection Laws'] },
        { id: 'n5', label: 'Spherical Mirrors', x: 200, y: 260, def: 'Mirrors with curved reflecting surfaces (Concave or Convex Mirrors).', related: ['Concave Mirror', 'Convex Mirror', 'Mirror Formula'] }
      ],
      links: [
        { source: 'n2', target: 'n1', label: 'strikes' },
        { source: 'n1', target: 'n3', label: 'produces' },
        { source: 'n4', target: 'n1', label: 'normal to' },
        { source: 'n1', target: 'n5', label: 'applies to' }
      ]
    },
    'Triangles': {
      nodes: [
        { id: 'm1', label: 'Similarity', x: 200, y: 150, def: 'Two triangles are similar if their corresponding angles are equal and corresponding sides are proportional.', related: ['Congruence', 'Thales Theorem'] },
        { id: 'm2', label: 'AAA Criterion', x: 80, y: 90, def: 'Angle-Angle-Angle similarity criterion.', related: ['Similarity'] },
        { id: 'm3', label: 'SAS Criterion', x: 320, y: 90, def: 'Side-Angle-Side similarity criterion.', related: ['Similarity'] },
        { id: 'm4', label: 'Thales Theorem', x: 200, y: 260, def: 'Basic Proportionality Theorem (BPT) of parallel lines in triangles.', related: ['Similarity'] }
      ],
      links: [
        { source: 'm2', target: 'm1', label: 'proves' },
        { source: 'm3', target: 'm1', label: 'proves' },
        { source: 'm4', target: 'm1', label: 'linked with' }
      ]
    }
  };

  const currentMap = conceptMaps[chapter] || conceptMaps['Light Reflection'];

  const handleZoomIn = () => setZoomScale(prev => Math.min(2, prev + 0.1));
  const handleZoomOut = () => setZoomScale(prev => Math.max(0.5, prev - 0.1));

  const handleExportSimulate = () => {
    alert('Concept map exported as PNG image successfully!');
  };

  return (
    <div className="grid grid-cols-12 gap-6 font-sans select-none anim-fade-up">
      {/* Top Filter Header */}
      <div className="col-span-12 bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-xs text-slate-700">Subject:</span>
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value as any);
              setChapter(e.target.value === 'Maths' ? 'Triangles' : 'Light Reflection');
              setSelectedNode(null);
            }}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-semibold outline-none"
          >
            <option value="Science">Science</option>
            <option value="Maths">Mathematics</option>
          </select>

          <span className="font-display font-bold text-xs text-slate-700 ml-2">Chapter:</span>
          <select
            value={chapter}
            onChange={(e) => {
              setChapter(e.target.value);
              setSelectedNode(null);
            }}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-semibold outline-none"
          >
            {subject === 'Science' ? (
              <option value="Light Reflection">Light Reflection</option>
            ) : (
              <option value="Triangles">Triangles</option>
            )}
          </select>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 select-none">
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-bold text-slate-400 w-12 text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <ZoomIn size={16} />
          </button>
          
          <button
            onClick={handleExportSimulate}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer ml-2"
          >
            <Download size={14} />
            Export Image
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="col-span-12 lg:col-span-8 bg-slate-50 border border-slate-100 rounded-3xl relative overflow-hidden h-96 shadow-inner flex items-center justify-center">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 400 320"
          style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.15s ease-out' }}
          className="origin-center"
        >
          {/* Arrows */}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 10 5 L 0 8 z" fill="#cbd5e1" />
            </marker>
          </defs>

          {/* Links lines */}
          {currentMap.links.map((link, idx) => {
            const srcNode = currentMap.nodes.find(n => n.id === link.source);
            const tgtNode = currentMap.nodes.find(n => n.id === link.target);
            if (!srcNode || !tgtNode) return null;

            return (
              <g key={idx}>
                <line 
                  x1={srcNode.x} 
                  y1={srcNode.y} 
                  x2={tgtNode.x} 
                  y2={tgtNode.y} 
                  stroke="#cbd5e1" 
                  strokeWidth="2" 
                  markerEnd="url(#arrow)"
                />
                {/* Labeled text in center */}
                <text 
                  x={(srcNode.x + tgtNode.x) / 2} 
                  y={(srcNode.y + tgtNode.y) / 2 - 5}
                  fontSize="7" 
                  fontWeight="bold"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  {link.label}
                </text>
              </g>
            );
          })}

          {/* Nodes circles */}
          {currentMap.nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <g 
                key={node.id} 
                className="cursor-pointer group"
                onClick={() => setSelectedNode(node)}
              >
                <circle 
                  cx={node.x} 
                  cy={node.y} 
                  r="26" 
                  fill={isSelected ? '#0ea5e9' : 'white'} 
                  stroke={isSelected ? '#0284c7' : '#e2e8f0'}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all shadow-xs"
                />
                <text 
                  x={node.x} 
                  y={node.y + 2} 
                  fontSize="8" 
                  fontWeight="bold"
                  fill={isSelected ? 'white' : '#1e293b'}
                  textAnchor="middle"
                  className="font-display select-none"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Detail Sidebar Card */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
        {selectedNode ? (
          <div className="bento-card border border-sky-100 bg-white p-6 flex flex-col gap-4 animate-fade-up">
            <div className="flex justify-between items-center select-none">
              <span className="font-label-caps text-[9px] font-black text-sky-700">CONCEPT DETAILS</span>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-800">{selectedNode.label}</h3>
              <p className="font-sans text-[10px] text-slate-400 mt-0.5">NCERT Terminology Definition</p>
            </div>
            <div className="w-full h-[1px] bg-slate-100"></div>
            <div>
              <span className="font-sans text-xs text-slate-600 font-medium leading-relaxed block">
                {selectedNode.def}
              </span>
            </div>
            
            <div className="w-full h-[1px] bg-slate-100 mt-1"></div>
            <div>
              <span className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-wide block mb-2">
                RELATED CONCEPTS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.related.map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-semibold px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bento-card border border-dashed border-slate-200 bg-white/50 p-6 flex flex-col items-center justify-center text-center gap-3 h-full min-h-[300px]">
            <span className="text-3xl select-none">🗺️</span>
            <span className="font-sans font-bold text-xs text-slate-400">Click any bubble concept</span>
            <span className="text-[10px] text-slate-400 max-w-[200px]">Detailed definitions and NCERT connections will appear here.</span>
          </div>
        )}
      </div>

    </div>
  );
};
