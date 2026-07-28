import {
  Layers, Scissors, Shuffle, ArrowRightLeft, Flame, Sparkles,
} from "lucide-react";

const REACTION_TYPES = {
  combination: {
    label: "Combination",
    icon: Layers,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    description: "Two or more substances combine to form a single product.",
    pattern: "A + B → AB",
  },
  decomposition: {
    label: "Decomposition",
    icon: Scissors,
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    description: "A single compound breaks down into two or more simpler substances.",
    pattern: "AB → A + B",
  },
  single_displacement: {
    label: "Single Displacement",
    icon: Shuffle,
    color: "#059669",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    description: "A more reactive element displaces a less reactive element from a compound.",
    pattern: "A + BC → AC + B",
  },
  double_displacement: {
    label: "Double Displacement",
    icon: ArrowRightLeft,
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    description: "Ions of two compounds exchange partners to form two new compounds.",
    pattern: "AB + CD → AD + CB",
  },
  combustion: {
    label: "Combustion",
    icon: Flame,
    color: "#dc2626",
    bg: "#fff1f2",
    border: "#fca5a5",
    description: "A substance reacts rapidly with oxygen, releasing heat and light.",
    pattern: "Fuel + O₂ → CO₂ + H₂O",
  },
  custom: {
    label: "Custom",
    icon: Sparkles,
    color: "#8b5cf6",
    bg: "#faf5ff",
    border: "#d8b4fe",
    description: "Your teacher-built questions and saved custom challenges.",
    pattern: "Custom",
  },
};

export default REACTION_TYPES;
