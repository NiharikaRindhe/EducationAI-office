import React, { useState } from "react";
import {
  Upload,
  AlertTriangle,
  FileImage,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";

export default function MissingAssetFallback({
  missingFilename,
  onImageUploaded,
  onUseSvgMockup,
  topicTitle
}) {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    if (onImageUploaded) {
      onImageUploaded(url);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950/80 border border-slate-800 rounded-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5 text-center relative z-10">
        {/* Header Alert Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-100">
            Diagram Image Missing
          </h3>
          <p className="text-xs text-slate-400">
            Topic: <span className="font-semibold text-emerald-400">{topicTitle}</span>
          </p>
          <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 font-mono text-xs text-amber-300">
            Missing: src/assets/biology/{missingFilename}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
            dragOver
              ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
              : "border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-950/80"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="diagram-file-input"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />
          <label htmlFor="diagram-file-input" className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-slate-400" />
            <span className="text-xs font-semibold text-slate-200">
              Drag & Drop PNG/JPG image here
            </span>
            <span className="text-[11px] text-slate-500">
              or click to browse local files
            </span>
          </label>
        </div>

        {/* Alternative Action: SVG Mockup */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={onUseSvgMockup}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            Use Interactive Vector SVG Mockup
          </button>
        </div>
      </div>
    </div>
  );
}
