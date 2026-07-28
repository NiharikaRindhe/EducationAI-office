/**
 * Curriculum-Aligned Biology Registry Data (NCERT Class 9 & Class 10)
 *
 * Coordinate format — ALL values are percentages (0–100) of the image width/height.
 *   coords:   [x, y]   — where the anatomy dot sits on the diagram image
 *   labelPos: [lx, ly] — where the label chip appears (connected by a line)
 *
 * To reposition a label just change these two arrays. Nothing else needs to change.
 *
 * `imagePath` values below are bucket-relative keys. They are rewritten into
 * absolute public URLs at the bottom of this file (see resolveImagePaths), so
 * the diagram components can keep using `topic.imagePath` unchanged. The
 * diagram PNGs live in the public 'lab-assets' Supabase Storage bucket rather
 * than in git — upload them with `npm run assets:upload-lab` from api/.
 */

import { labAssetUrl } from '../lib/assets';

const BIOLOGY_UNITS_RAW = [
  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 1 — The Fundamental Unit of Life  (Class 9)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "unit1",
    title: "Unit 1: The Fundamental Unit of Life",
    grade: "Class 9",
    ncertChapter: "Chapter 5: The Fundamental Unit of Life",
    description: "Structure, cell organelles, cell division (Mitosis & Meiosis)",
    topics: [
      {
        id: "animal_cell",
        title: "Animal Cell Structure",
        imagePath: "Class 9/AnimalCell_NoNames.png",
        fallbackImage: "AnimalCell_NoNames.png",
        summary: "Eukaryotic cell lacking cell wall and chloroplasts, enclosed by plasma membrane.",
        components: [
          {
            "id": "nucleus",
            "label": "Nucleus",
            "coords": [47, 22],
            "labelPos": [64, -2],
            "ncertDefinition": "Double-membraned organelle containing chromatin material and nucleolus. Known as the control center of the cell.",
            "keyFunction": "Directs cell growth, metabolism, and controls genetic transmission through DNA.",
            "examTip": "Differentiate between nucleoid in prokaryotes and nucleus in eukaryotes — a common CBSE question."
          },
          {
            "id": "nucleolus",
            "label": "Nucleolus",
            "coords": [40, 30],
            "labelPos": [74, 5],
            "ncertDefinition": "Small rounded body inside the nucleus containing RNA and proteins. Site of ribosome synthesis.",
            "keyFunction": "Synthesis of rRNA and assembly of ribosomes.",
            "examTip": "Always label nucleolus inside the nucleus and ribosomes in the cytoplasm — critical for CBSE diagrams."
          },
          {
            "id": "nuclear_envelope",
            "label": "Nuclear Envelope",
            "coords": [40, 13],
            "labelPos": [44, -2],
            "ncertDefinition": "Comprises two membranes with fluid-filled perinuclear space and nuclear pores.",
            "keyFunction": "Controls passage of macromolecules like RNA and proteins in and out of the nucleus.",
            "examTip": "Nuclear pores selectively transport proteins and RNA between the nucleoplasm and cytoplasm."
          },
          {
            "id": "rough_er",
            "label": "Rough ER",
            "coords": [20, 30],
            "labelPos": [14, 5],
            "ncertDefinition": "A network of membrane-bound tubules and sheets studded with ribosomes on its outer surface, continuous with the outer nuclear membrane.",
            "keyFunction": "Serves as the primary site for protein synthesis, folding, and intracellular transport.",
            "examTip": "Always contrast RER (has ribosomes, synthesizes proteins) with SER (lacks ribosomes, synthesizes lipids/steroids) — a high-yield CBSE comparison question."
          },
          {
            "id": "mitochondria",
            "label": "Mitochondria",
            "coords": [73, 20],
            "labelPos": [88, 12],
            "ncertDefinition": "Double-membraned organelle with outer smooth membrane and inner folded cristae. Contains its own circular DNA and ribosomes.",
            "keyFunction": "Powerhouse of the cell — generates cellular energy in the form of ATP through aerobic respiration.",
            "examTip": "Mitochondria and Chloroplasts are semi-autonomous because they have their own DNA and 70S ribosomes."
          },
          {
            "id": "smooth_er",
            "label": "Smooth ER",
            "coords": [19, 44],
            "labelPos": [2, 30],
            "ncertDefinition": "Tubular network of membranes without attached ribosomes.",
            "keyFunction": "Synthesizes lipids, phospholipids, and steroid hormones; detoxifies drugs and poisons in liver cells.",
            "examTip": "Membrane biogenesis uses lipids produced in the SER and proteins made in the RER."
          },
          {
            "id": "golgi_apparatus",
            "label": "Golgi Apparatus",
            "coords": [73, 58],
            "labelPos": [100, 70],
            "ncertDefinition": "System of flattened, stacked membrane-bound sacs (cisternae) discovered by Camillo Golgi.",
            "keyFunction": "Modifies, sorts, packages, and routes proteins/lipids from ER to targets or secretion.",
            "examTip": "Golgi apparatus is directly involved in the formation of lysosomes and acrosome of sperm."
          },
          {
            "id": "lysosome",
            "label": "Lysosome",
            "coords": [85, 30],
            "labelPos": [105, 40],
            "ncertDefinition": "Membrane-bound sacs filled with powerful hydrolytic enzymes synthesized by RER. Called 'Suicide Bags' of the cell.",
            "keyFunction": "Waste disposal system — digests foreign pathogens, cellular debris, and damaged organelles.",
            "examTip": "Hydrolytic enzymes work optimally in acidic pH maintained inside the lysosomal membrane."
          },
          {
            "id": "plasma_membrane",
            "label": "Plasma Membrane",
            "coords": [13, 75],
            "labelPos": [-3, 71],
            "ncertDefinition": "Flexible outer boundary of the cell made of lipids and proteins. Selectively permeable.",
            "keyFunction": "Regulates entry and exit of molecules through osmosis, diffusion, and active transport.",
            "examTip": "Fluid Mosaic Model by Singer and Nicolson describes the dynamic phospholipid bilayer with embedded proteins."
          },
          {
            "id": "ribosomes",
            "label": "Ribosomes",
            "coords": [47, 71],
            "labelPos": [61, 100],
            "ncertDefinition": "Tiny non-membrane bound granules found freely in cytoplasm or attached to Rough ER.",
            "keyFunction": "Site of protein synthesis (translation) inside the cell.",
            "examTip": "Ribosomes are found in both prokaryotic (70S) and eukaryotic (80S) cells."
          },
          {
            "id": "cytoplasm",
            "label": "Cytoplasm",
            "coords": [35, 82],
            "labelPos": [18, 100],
            "ncertDefinition": "Fluid content inside the plasma membrane containing cytosol and various specialized cell organelles.",
            "keyFunction": "Medium for biochemical reactions, metabolic pathways (like glycolysis), and intracellular streaming.",
            "examTip": "Cytosol = liquid portion only; Cytoplasm = cytosol + all organelles (excluding nucleus)."
          },
          {
            "id": "centriole",
            "label": "Centriole",
            "coords": [66, 30],
            "labelPos": [105, 26],
            "ncertDefinition": "Cylindrical structure composed mainly of a protein called tubulin, arranged perpendicular to each other inside a centrosome.",
            "keyFunction": "Helps in the formation of spindle fibers that separate chromosomes during cell division.",
            "examTip": "Centrioles exhibit a 9+0 microtubule arrangement and are absent in most plant cells."
          }
        ]
      },
      {
        id: "plant_cell",
        title: "Plant Cell Structure",
        imagePath: "Class 9/PlantCell_NN.png",
        fallbackImage: "PlantCell_NN.png",
        summary: "Eukaryotic plant cell with rigid cellulose cell wall, large vacuole, and plastids.",
        components: [
          {
            "id": "smooth_er",
            "label": "Smooth ER",
            "coords": [21, 28],
            "labelPos": [10, 23],
            "ncertDefinition": "Tubular network of membranes without attached ribosomes.",
            "keyFunction": "Synthesizes lipids, phospholipids, and steroid hormones; detoxifies drugs and poisons.",
            "examTip": "Membrane biogenesis uses lipids produced in the SER and proteins made in the RER."
          },
          {
            "id": "lysosome",
            "label": "Lysosome",
            "coords": [77, 16],
            "labelPos": [81, -2],
            "ncertDefinition": "Membrane-bound sacs filled with powerful hydrolytic enzymes synthesized by RER. Called 'Suicide Bags' of the cell.",
            "keyFunction": "Waste disposal system — digests foreign pathogens, cellular debris, and damaged organelles.",
            "examTip": "Hydrolytic enzymes work optimally in acidic pH maintained inside the lysosomal membrane."
          },
          {
            "id": "rough_er",
            "label": "Rough ER",
            "coords": [45, 22],
            "labelPos": [52, -2],
            "ncertDefinition": "A network of membrane-bound tubules and sheets studded with ribosomes on its outer surface, continuous with the outer nuclear membrane.",
            "keyFunction": "Serves as the primary site for protein synthesis, folding, and intracellular transport.",
            "examTip": "Always contrast RER (has ribosomes, synthesizes proteins) with SER (lacks ribosomes, synthesizes lipids/steroids) — a high-yield CBSE comparison question."
          },
          {
            "id": "chloroplast",
            "label": "Chloroplast",
            "coords": [66, 13],
            "labelPos": [64, -2],
            "ncertDefinition": "Double-membraned plastid containing chlorophyll pigments, thylakoids, and stroma.",
            "keyFunction": "Site of photosynthesis — converts solar energy into chemical energy (glucose).",
            "examTip": "Chloroplasts are semi-autonomous organelles containing their own 70S ribosomes and circular DNA."
          },
          {
            "id": "nucleus",
            "label": "Nucleus",
            "coords": [32, 23],
            "labelPos": [38, -2],
            "ncertDefinition": "Double-membraned organelle containing chromatin material and nucleolus. Known as the control center of the cell.",
            "keyFunction": "Directs cell growth, metabolism, and controls genetic transmission through DNA.",
            "examTip": "Differentiate between nucleoid in prokaryotes and nucleus in eukaryotes — a common CBSE question."
          },
          {
            "id": "golgi_apparatus",
            "label": "Golgi Apparatus",
            "coords": [35, 56],
            "labelPos": [1, 35],
            "ncertDefinition": "System of flattened, stacked membrane-bound sacs (cisternae) discovered by Camillo Golgi.",
            "keyFunction": "Modifies, sorts, packages, and routes proteins/lipids from ER to targets or secretion.",
            "examTip": "Golgi apparatus is directly involved in the formation of lysosomes and cell plate formation in plants."
          },
          {
            "id": "vacuole",
            "label": "Vacuole",
            "coords": [70, 55],
            "labelPos": [93, 55],
            "ncertDefinition": "Membrane-bound space in cytoplasm enclosed by a single membrane called tonoplast.",
            "keyFunction": "Stores water, sap, excretory products, and maintains turgidity/rigidity in plant cells.",
            "examTip": "Plant cells have a large central vacuole occupying 50–90% volume; animal vacuoles are small and temporary."
          },
          {
            "id": "nuclear_envelope",
            "label": "Nuclear Envelope",
            "coords": [29, 20],
            "labelPos": [22, -3],
            "ncertDefinition": "Comprises two membranes with fluid-filled perinuclear space and nuclear pores.",
            "keyFunction": "Controls passage of macromolecules like RNA and proteins in and out of the nucleus.",
            "examTip": "Nuclear pores selectively transport proteins and RNA between the nucleoplasm and cytoplasm."
          },
          {
            "id": "plasma_membrane",
            "label": "Plasma Membrane",
            "coords": [83, 24],
            "labelPos": [95, 35],
            "ncertDefinition": "Flexible outer boundary of the cell cytoplasm made of lipids and proteins. Selectively permeable.",
            "keyFunction": "Regulates entry and exit of molecules through osmosis, diffusion, and active transport.",
            "examTip": "In plant cells, the plasma membrane lies inside the rigid cell wall."
          },
          {
            "id": "adjacent_cell_wall",
            "label": "Adjacent Cell Wall",
            "coords": [83, 69],
            "labelPos": [95, 70],
            "ncertDefinition": "Cell wall structure belonging to the neighboring plant cell, joined via middle lamella.",
            "keyFunction": "Provides structural cohesion and connectivity between neighboring plant cells.",
            "examTip": "Plasmodesmata span through adjacent cell walls to connect the cytoplasm of neighboring cells."
          },
          {
            "id": "cell_wall",
            "label": "Cell Wall",
            "coords": [15, 52],
            "labelPos": [5, 56],
            "ncertDefinition": "Rigid, non-living outer layer composed mainly of cellulose surrounding the plasma membrane in plant cells.",
            "keyFunction": "Provides mechanical support, shape, protection, and prevents bursting in hypotonic solutions.",
            "examTip": "Cell wall is fully permeable, whereas the plasma membrane is selectively permeable."
          },
          {
            "id": "mitochondria",
            "label": "Mitochondria",
            "coords": [45, 72],
            "labelPos": [44, 98],
            "ncertDefinition": "Double-membraned organelle with outer smooth membrane and inner folded cristae. Contains its own circular DNA and ribosomes.",
            "keyFunction": "Powerhouse of the cell — generates cellular energy in the form of ATP through aerobic respiration.",
            "examTip": "Mitochondria and Chloroplasts are semi-autonomous because they have their own DNA and 70S ribosomes."
          },
          {
            "id": "ribosomes",
            "label": "Ribosomes",
            "coords": [51, 77],
            "labelPos": [60, 98],
            "ncertDefinition": "Tiny non-membrane bound granules found freely in cytoplasm or attached to Rough ER.",
            "keyFunction": "Site of protein synthesis (translation) inside the cell.",
            "examTip": "Ribosomes are found in both prokaryotic (70S) and eukaryotic (80S) cells."
          },
          {
            "id": "cytoplasm",
            "label": "Cytoplasm",
            "coords": [37, 71],
            "labelPos": [27, 95],
            "ncertDefinition": "Fluid content inside the plasma membrane containing cytosol and various specialized cell organelles.",
            "keyFunction": "Medium for biochemical reactions, metabolic pathways (like glycolysis), and intracellular streaming.",
            "examTip": "Cytosol = liquid portion only; Cytoplasm = cytosol + all organelles (excluding nucleus)."
          }
        ]
      },
      {
        id: "mitosis",
        title: "Mitosis — Equational Division",
        imagePath: "Class 9/Mitosis.png",
        fallbackImage: "Mitosis.png",
        summary: "Somatic cell division producing two identical daughter cells (same chromosome number).",
        components: [
          {
            "id": "interphase",
            "label": "Interphase",
            "coords": [8.5, 10],
            "labelPos": [8.5, 10],
            "ncertDefinition": "Resting phase between cell divisions where cell grows, synthesizes proteins, and replicates DNA (S-phase).",
            "keyFunction": "Prepares the cell for mitosis by duplicating genetic material and organelles.",
            "examTip": "Interphase occupies more than 95% of the total duration of the cell cycle."
          },
          {
            "id": "prophase",
            "label": "Prophase",
            "coords": [26.5, 10],
            "labelPos": [26.5, 10],
            "ncertDefinition": "First stage of mitosis marked by initiation of chromatin condensation, dissolution of nuclear envelope, and spindle formation.",
            "keyFunction": "Condenses chromatin into distinct X-shaped chromosomes and disassembles nuclear structure.",
            "examTip": "Disappearance of Golgi complexes, ER, nucleolus, and nuclear envelope marks late prophase."
          },
          {
            "id": "metaphase",
            "label": "Metaphase",
            "coords": [43.5, 10],
            "labelPos": [43.5, 10],
            "ncertDefinition": "Stage where all sister chromatid pairs align at the cell equator forming the metaphase plate.",
            "keyFunction": "Spindle fibers attach to the kinetochores of sister chromatids to ensure accurate separation.",
            "examTip": "Morphology of chromosomes is most easily studied during Metaphase."
          },
          {
            "id": "anaphase",
            "label": "Anaphase",
            "coords": [60, 10],
            "labelPos": [60, 10],
            "ncertDefinition": "Centromeres split simultaneously and sister chromatids separate into daughter chromosomes moving to opposite poles.",
            "keyFunction": "Executes equal segregation of duplicated genetic material.",
            "examTip": "Chromosomes assume distinct V, L, J, or I shapes during Anaphase depending on centromere position."
          },
          {
            "id": "telophase",
            "label": "Telophase",
            "coords": [76.5, 10],
            "labelPos": [76.5, 10],
            "ncertDefinition": "Daughter chromosomes reach opposite poles, decondense back into chromatin, and nuclear envelopes reform.",
            "keyFunction": "Reassembles two distinct nuclei around separated sets of genetic material.",
            "examTip": "Telophase is essentially the reverse of Prophase (nucleolus, ER, and Golgi reform)."
          },
          {
            "id": "cytokinesis",
            "label": "Cytokinesis",
            "coords": [92, 10],
            "labelPos": [92, 10],
            "ncertDefinition": "Division of the cell's cytoplasm by a cleavage furrow (in animal cells) or cell plate (in plant cells).",
            "keyFunction": "Finalizes cell division to produce two identical diploid daughter cells.",
            "examTip": "In animal cells, cytokinesis occurs centripetally via a cell furrow; in plant cells, it occurs centrifugally via cell plate formation."
          }
        ]
      },
      {
        id: "meiosis_1",
        title: "Meiosis I — Reductional Division",
        imagePath: "Class 9/Meiosis 1 No_Name.png",
        fallbackImage: "Meiosis 1 No_Name.png",
        summary: "First meiotic division separating homologous chromosome pairs into two haploid daughter cells.",
        components: [
          {
            "id": "prophase_1",
            "label": "Prophase I",
            "coords": [10, 10],
            "labelPos": [10, 10],
            "ncertDefinition": "Longest phase where homologous chromosomes pair up (synapsis) and non-sister chromatids exchange genetic material during crossing over.",
            "keyFunction": "Recombines maternal and paternal DNA to introduce genetic variation in gametes.",
            "examTip": "Divided into 5 sub-stages: Leptotene, Zygotene (synapsis), Pachytene (crossing over via recombinase), Diplotene (chiasmata), and Diakinesis."
          },
          {
            "id": "metaphase_1",
            "label": "Metaphase I",
            "coords": [30, 10],
            "labelPos": [30, 10],
            "ncertDefinition": "Bivalent (homologous) chromosome pairs align along the equatorial plate in two parallel double rows.",
            "keyFunction": "Aligns paired homologs so spindle fibers from opposite poles attach to their kinetochores.",
            "examTip": "Double metaphase plate forms in Metaphase I, whereas a single metaphase plate forms in Mitosis and Metaphase II."
          },
          {
            "id": "anaphase_1",
            "label": "Anaphase I",
            "coords": [51, 10],
            "labelPos": [51, 10],
            "ncertDefinition": "Homologous chromosomes separate and move toward opposite poles while sister chromatids remain attached at centromeres.",
            "keyFunction": "Reduces the chromosome number from diploid (2n) to haploid (n) — actual reductional division.",
            "examTip": "Anaphase I separates homologous chromosomes without centromere division; centromeres split only in Anaphase II and Mitotic Anaphase."
          },
          {
            "id": "telophase_1",
            "label": "Telophase I",
            "coords": [72, 10],
            "labelPos": [72, 10],
            "ncertDefinition": "Nuclear envelope and nucleolus reappear around haploid chromosome sets, followed by cytokinesis forming a dyad of cells.",
            "keyFunction": "Completes Meiosis I, yielding two haploid daughter cells.",
            "examTip": "The brief gap between Meiosis I and Meiosis II is called Interkinesis (no S-phase or DNA replication occurs during interkinesis)."
          },
          {
            "id": "cytokinesis",
            "label": "Cytokinesis",
            "coords": [91, 10],
            "labelPos": [91, 10],
            "ncertDefinition": "Cytokinesis in plants involves the formation of a cell plate across the equatorial plane, which develops into a new cell wall dividing the cytoplasm.",
            "keyFunction": "Cytokinesis in plants involves the formation of a cell plate across the equatorial plane, which develops into a new cell wall dividing the cytoplasm.",
            "examTip": "Plant cells form a cell plate while animal cells pinch inward at the cleavage furrow."
          }
        ]
      },
      {
        id: "meiosis_2",
        title: "Meiosis II — Equational Division",
        imagePath: "Class 9/meiosis 2 no name.png",
        fallbackImage: "meiosis 2 no name.png",
        summary: "Second meiotic division separating sister chromatids to produce 4 non-identical haploid gametes.",
        components: [
          {
            "id": "prophase_2",
            "label": "Prophase II",
            "coords": [8.5, 0],
            "labelPos": [8.5, 0],
            "ncertDefinition": "Chromosomes re-condense in both haploid cells; nuclear envelope breaks down and spindle fibers form.",
            "keyFunction": "Prepares haploid cells for chromatid segregation.",
            "examTip": "Meiosis II resembles a normal mitotic division, but occurs in haploid (n) cells."
          },
          {
            "id": "metaphase_2",
            "label": "Metaphase II",
            "coords": [29, 0],
            "labelPos": [29, 0],
            "ncertDefinition": "Chromosomes align individually along the equatorial plate in both daughter cells.",
            "keyFunction": "Positions sister chromatids for equal division to opposite poles.",
            "examTip": "Microtubules/spindle fibers attach to the kinetochores of sister chromatids at this stage."
          },
          {
            "id": "anaphase_2",
            "label": "Anaphase II",
            "coords": [49.5, 0],
            "labelPos": [49.5, 0],
            "ncertDefinition": "Centromeres split simultaneously; sister chromatids separate into daughter chromosomes moving to opposite poles.",
            "keyFunction": "Separates sister chromatids into individual chromosomes.",
            "examTip": "Sister chromatids separate in Anaphase II (just like in Mitotic Anaphase), whereas homologous chromosomes separate in Anaphase I."
          },
          {
            "id": "telophase_2",
            "label": "Telophase II",
            "coords": [70, 0],
            "labelPos": [70, 0],
            "ncertDefinition": "Nuclear membranes reform around four daughter nuclei; cytokinesis completes to produce four haploid cells.",
            "keyFunction": "Finalizes production of four genetically distinct haploid gametes (sperm/egg).",
            "examTip": "Meiosis produces four non-identical haploid gametes due to crossing over (Pachytene) and independent assortment."
          },
          {
            "id": "gamete_formation",
            "label": "Gamete Formation",
            "coords": [90.5, 0],
            "labelPos": [90.5, 0],
            "ncertDefinition": "The final stage following Telophase II where cytokinesis divides the cytoplasm, resulting in a tetrad of four haploid microspores or functional gametes.",
            "keyFunction": "Produces four genetically distinct haploid (n) cells (sperm or egg) carrying unique recombinations of parental genes.",
            "examTip": "Meiosis results in 4 genetically non-identical haploid gametes due to crossing over in Pachytene and independent assortment in Metaphase I."
          }

        ]
      },
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 2 — Tissues  (Class 9)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "unit2",
    title: "Unit 2: Tissues",
    grade: "Class 9",
    ncertChapter: "Chapter 6: Tissues",
    description: "Meristematic & Permanent plant tissues, and the four animal tissue types",
    topics: [
      {
        id: "plant_tissue",
        title: "Meristematic Tissues (Plant Growth)",
        imagePath: "Class 9/Meristematic Tissues.png",
        fallbackImage: "Meristematic Tissue.png",
        summary: "Active dividing plant tissues categorized by location: Apical, Intercalary, and Lateral Meristems.",
        components: [
          {
            id: "apical_meristem",
            label: "Apical Meristem",
            coords: [17, 8],
            labelPos: [17, 8],
            ncertDefinition: "Meristematic tissue located at the growing tips of stems, shoots, and roots.",
            keyFunction: "Increases the overall length of the stem and root — Primary Growth.",
            examTip: "Apical Meristem = Growing Tips = Length growth (Primary Growth)."
          },
          {
            id: "intercalary_meristem",
            label: "Intercalary Meristem",
            coords: [45, 8],
            labelPos: [45, 8],
            ncertDefinition: "Meristematic tissue located at the base of leaves or internodes (e.g., in monocots and grasses).",
            keyFunction: "Allows rapid elongation of internodes and regrowth of grazed plant parts.",
            examTip: "Helps grass regrow rapidly after being grazed by herbivores."
          },
          {
            id: "lateral_meristem",
            label: "Lateral Meristem (Cambium)",
            coords: [82, 8],
            labelPos: [82, 8],
            ncertDefinition: "Meristematic tissue situated along the lateral sides of stems and roots.",
            keyFunction: "Increases the girth, diameter, and thickness of the stem and root — Secondary Growth.",
            examTip: "Girth/girth increase is driven strictly by Lateral Meristem (Vascular & Cork Cambium)."
          }
        ]
      },
      {
        id: "permanent_tissue",
        title: "Permanent Plant Tissues",
        imagePath: "Class 9/permenent tissues.png",
        fallbackImage: "permenent tissues.png",
        summary: "Differentiated plant tissues: Simple (Parenchyma, Collenchyma, Sclerenchyma) and Complex (Xylem, Phloem).",
        components: [
          {
            id: "parenchyma",
            label: "Parenchyma",
            coords: [18, 1],
            labelPos: [18, 1],
            ncertDefinition: "Unspecialised living cells with thin cellulose walls and large intercellular spaces.",
            keyFunction: "Food storage, photosynthesis (Chlorenchyma), and buoyancy in aquatic plants (Aerenchyma).",
            examTip: "Aerenchyma in aquatic plants provides buoyancy to float."
          },
          {
            id: "collenchyma",
            label: "Collenchyma",
            coords: [50, 1],
            labelPos: [50, 1],
            ncertDefinition: "Living cells with pectin-thickened corners and minimal intercellular space.",
            keyFunction: "Provides mechanical flexibility and support allowing bending without breaking.",
            examTip: "Allows leaf stalks and tendrils to bend in wind without snapping."
          },
          {
            id: "sclerenchyma",
            label: "Sclerenchyma",
            coords: [79, 1],
            labelPos: [79, 1],
            ncertDefinition: "Dead cells with heavily lignified, thick walls and no internal space (lumen).",
            keyFunction: "Provides rigidity, hardness, and mechanical strength (e.g. husk of coconut).",
            examTip: "Cells are dead at maturity; lignin acts as natural cement."
          },
          {
            id: "xylem",
            label: "Xylem",
            coords: [18, 98],
            labelPos: [18, 98],
            ncertDefinition: "Complex tissue composed of tracheids, vessels, xylem parenchyma, and fibres.",
            keyFunction: "Unidirectional transport of water and dissolved minerals from roots upward to leaves.",
            examTip: "Xylem conduction is strictly unidirectional (upward)."
          },
          {
            id: "phloem",
            label: "Phloem",
            coords: [50, 98],
            labelPos: [50, 98],
            ncertDefinition: "Complex tissue composed of sieve tubes, companion cells, phloem parenchyma, and fibres.",
            keyFunction: "Bidirectional translocation of food (photosynthates) from leaves to all plant parts.",
            examTip: "Phloem translocation is bidirectional and requires ATP energy."
          },
          {
            "id": "vascular_bundle_section",
            "label": "Vascular Bundle / Root Tissues",
            "coords": [81, 98],
            "labelPos": [81, 98],
            "ncertDefinition": "Cross-sectional arrangement of primary tissues showing central xylem and phloem surrounded by cortex and epidermis.",
            "keyFunction": "Organizes water and nutrient transport routes while offering structural support to the root/stem core.",
            "examTip": "Radial arrangement (xylem and phloem on different radii) is characteristic of roots; collateral arrangement is seen in stems."
          }
        ]
      },
      {
        id: "epithelial_tissue",
        title: "Epithelial Tissues (Types & Structure)",
        imagePath: "Class 9/Epilethial tissues.png",
        fallbackImage: "Epilethial tissues.png",
        summary: "Protective covering tissue lining body surfaces, cavities, and internal organs.",
        components: [
          {
            "id": "stratified_squamous_epithelium",
            "label": "Stratified Squamous Epithelium",
            "coords": [16, 1],
            "labelPos": [16, 1],
            "ncertDefinition": "Epithelial tissue composed of multiple layers of cells arranged in patterns to prevent wear and tear, with flattened cells at the free surface.",
            "keyFunction": "Provides mechanical protection against abrasion, physical stress, pathogen invasion, and water loss.",
            "examTip": "Found in the outer skin layer (keratinized) and lining of mouth/esophagus (non-keratinized) to withstand continuous wear and tear."
          },
          {
            "id": "ciliated_columnar_epithelium",
            "label": "Ciliated Columnar Epithelium",
            "coords": [50, 1],
            "labelPos": [50, 1],
            "ncertDefinition": "Single layer of tall, pillar-like cells featuring fine, hair-like protoplasmic extensions called cilia on their free apical border.",
            "keyFunction": "Rhythmic wave-like beating of cilia moves mucus, particles, or liquid in a single unified direction over the surface.",
            "examTip": "Commonly found lining the respiratory tract (sweeps mucus and trapped dust outward) and fallopian tubes (moves egg toward uterus)."
          },
          {
            "id": "glandular_epithelium",
            "label": "Glandular Epithelium",
            "coords": [84, 1],
            "labelPos": [84, 1],
            "ncertDefinition": "Specialized cuboidal or columnar epithelial tissue that folds inward (invaginates) to form uni- or multicellular glands.",
            "keyFunction": "Synthesizes, stores, and secretes metabolic products like digestive enzymes, sweat, saliva, mucus, and hormones.",
            "examTip": "Classified into exocrine (secretes via ducts) and endocrine (ductless glands releasing directly into bloodstream) glands."
          }
        ]
      },
      {
        id: "muscular_tissue",
        title: "Muscular Tissues (Striated, Smooth & Cardiac)",
        imagePath: "Class 9/mascular tissues.png",
        fallbackImage: "mascular tissues.png",
        summary: "Contractile tissues responsible for body movement and internal propulsion.",
        components: [
          {
            id: "striated_muscle",
            label: "Striated (Skeletal) Muscle",
            coords: [17, 1],
            labelPos: [17, 1],
            ncertDefinition: "Long, cylindrical, unbranched, multinucleate fibres with light and dark striations.",
            keyFunction: "Voluntary body movement — attached to the skeleton under conscious control.",
            examTip: "Voluntary, multinucleate, unbranched, striated = Skeletal muscle."
          },
          {
            id: "smooth_muscle",
            label: "Smooth (Unstriated) Muscle",
            coords: [50, 1],
            labelPos: [50, 1],
            ncertDefinition: "Spindle-shaped (fusiform), uninucleate, unstriated involuntary muscle cells.",
            keyFunction: "Involuntary movements in stomach, intestine, blood vessels, and iris of the eye.",
            examTip: "Spindle-shaped cells with a single central nucleus and no striations."
          },
          {
            id: "cardiac_muscle",
            label: "Cardiac Muscle",
            coords: [83, 1],
            labelPos: [83, 1],
            ncertDefinition: "Cylindrical, branched, uninucleate involuntary cells found exclusively in the heart wall.",
            keyFunction: "Rhythmic contraction and relaxation throughout life without fatigue.",
            examTip: "Unique features: branched fibers connected by intercalated discs."
          }
        ]
      },
      {
        id: "connective_tissue_topic",
        title: "Connective Tissues (Matrix & Types)",
        imagePath: "Class 9/Connective Tissues.png",
        fallbackImage: "Connective Tissues.png",
        summary: "Tissues with cells loosely spaced in an intercellular matrix: Blood, Bone, Cartilage, Areolar, Adipose.",
        components: [
          {
            id: "blood",
            label: "Blood (Fluid Matrix)",
            coords: [10.5, 1],
            labelPos: [10.5, 1],
            ncertDefinition: "Fluid connective tissue consisting of liquid plasma matrix carrying RBCs, WBCs, and platelets.",
            keyFunction: "Transports gases (O₂, CO₂), digested food, hormones, and excretory products.",
            examTip: "Blood matrix = Plasma (fluid); RBCs carry oxygen via hemoglobin."
          },
          {
            id: "bone",
            label: "Bone (Hard Matrix)",
            coords: [31, 1],
            labelPos: [30.5, 1],
            ncertDefinition: "Hard non-flexible tissue embedded in a solid matrix of calcium and phosphorus compounds.",
            keyFunction: "Forms skeletal framework, protects organs, and anchors skeletal muscles.",
            examTip: "Bone matrix is hard due to calcium phosphate salts."
          },
          {
            id: "cartilage",
            label: "Cartilage (Flexible Matrix)",
            coords: [50.5, 1],
            labelPos: [50.5, 1],
            ncertDefinition: "Flexible tissue with widely spaced cells in a matrix composed of proteins and sugars.",
            keyFunction: "Smoothens joint surfaces; present in nose tip, ear pinna, trachea, and larynx.",
            examTip: "Cartilage matrix contains proteins and sugars; flexible unlike bone."
          },
          {
            id: "areolar_tissue",
            label: "Areolar Tissue",
            coords: [70.5, 1],
            labelPos: [70.5, 1],
            ncertDefinition: "Loose connective tissue found between skin and muscles, around blood vessels and nerves.",
            keyFunction: "Fills space inside organs, supports internal organs, and aids tissue repair.",
            examTip: "Areolar tissue acts as packing tissue and helps repair damaged tissues."
          },
          {
            id: "adipose_tissue",
            label: "Adipose Tissue (Fat Storage)",
            coords: [90.5, 1],
            labelPos: [90.5, 1],
            ncertDefinition: "Fat-storing tissue located below the skin and between internal organs.",
            keyFunction: "Stores fat reserves and acts as a thermal insulator.",
            examTip: "Fat storage in adipocytes acts as a heat insulator."
          }
        ]
      },
      {
        id: "nervous_tissue",
        title: "Nervous Tissue Architecture",
        imagePath: "Class 9/nervous Tissues.png",
        fallbackImage: "nervous Tissues.png",
        summary: "Specialized tissue composed of neurons and neuroglia for signal perception and conduction.",
        components: [
          {
            id: "cyton",
            label: "Cell Body (Cyton)",
            coords: [25, 35],
            labelPos: [10, 1],
            ncertDefinition: "Central cyton containing nucleus and cytoplasm with Nissl granules.",
            keyFunction: "Processes incoming nerve signals and maintains cell metabolism.",
            examTip: "Cyton contains the nucleus; dendrites branch out from the cyton."
          },
          {
            id: "dendrites",
            label: "Dendrites",
            coords: [30, 10],
            labelPos: [30, -2],
            ncertDefinition: "Short, highly branched protoplasmic processes extending from cell body.",
            keyFunction: "Receives stimuli and conducts electrical impulses toward the cyton.",
            examTip: "Nerve impulses enter the neuron at dendrite tips."
          },
          {
            id: "axon",
            label: "Axon",
            coords: [50, 60],
            labelPos: [40, 100],
            ncertDefinition: "Single long cylindrical process extending from cyton to terminal nerve endings.",
            keyFunction: "Transmits electrical nerve impulses away from cell body over long distances.",
            examTip: "Myelin sheath insulates axon to accelerate nerve impulse conduction."
          },
          {
            id: "synapse_ending",
            label: "Nerve Endings / Synapse",
            coords: [90, 70],
            labelPos: [90, 105],
            ncertDefinition: "Branched axon terminals releasing neurotransmitters across microscopic synaptic gaps.",
            keyFunction: "Converts electrical signals into chemical neurotransmitters across synapses.",
            examTip: "At synapse, electrical signals convert into chemical neurotransmitters."
          },
          {
            id: "nucleus",
            label: "Nucleus",
            coords: [26, 42],
            labelPos: [20, 95],
            ncertDefinition: "Large, prominent spherical structure situated centrally within the cell body (soma/cyton) of a neuron.",
            keyFunction: "Contains genetic material (DNA) and directs all cellular activities, protein synthesis, and metabolic functions of the neuron.",
            examTip: "Neurons do not undergo cell division (mitosis) because they lack functional centrioles, despite having a prominent nucleus."
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 3 — Life Processes  (Class 10)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "unit3",
    title: "Unit 3: Life Processes",
    grade: "Class 10",
    ncertChapter: "Chapter 6: Life Processes",
    description: "Digestion, Respiration, Circulation (Heart), and Excretion (Nephron)",
    topics: [
      {
        id: "alimentary_canal",
        title: "Human Digestive System",
        imagePath: "Alimentary.png",
        fallbackImage: "alimentary_canal.png",
        summary: "Continuous muscular tube from mouth to anus — ingestion, digestion, absorption, egestion.",
        components: [
          {
            "id": "tongue",
            "label": "Tongue",
            "coords": [37, 18],
            "labelPos": [10, 18],
            "ncertDefinition": "Muscular organ in the mouth that aids in tasting, mixing food with saliva, and swallowing.",
            "keyFunction": "Moves food during mastication and pushes the bolus into the pharynx.",
            "examTip": "Contains taste buds and assists in mechanical digestion and speech."
          },
          {
            "id": "buccal_cavity",
            "label": "Mouth (Buccal cavity)",
            "coords": [41, 16],
            "labelPos": [80, 16],
            "ncertDefinition": "Anterior opening of the alimentary canal containing teeth, tongue, and openings of salivary glands.",
            "keyFunction": "Site of ingestion, mechanical breaking of food, and initial chemical digestion of starch by salivary amylase.",
            "examTip": "Salivary amylase breaks down starch into maltose at an optimum pH of 6.8."
          },
          {
            "id": "esophagus",
            "label": "Oesophagus",
            "coords": [50, 26],
            "labelPos": [92, 26],
            "ncertDefinition": "A thin, long muscular tube that passes through the neck, thorax, and diaphragm, leading to the stomach.",
            "keyFunction": "Transports food from the pharynx to the stomach via wave-like peristaltic movements.",
            "examTip": "No major digestion occurs in the oesophagus; peristalsis pushes food downward regardless of gravity."
          },
          {
            "id": "diaphragm",
            "label": "Diaphragm",
            "coords": [39, 43],
            "labelPos": [1, 35],
            "ncertDefinition": "A dome-shaped muscular partition separating the thoracic cavity from the abdominal cavity.",
            "keyFunction": "Plays a fundamental role in breathing by contracting during inhalation and relaxing during exhalation.",
            "examTip": "The oesophagus pierces through the diaphragm to reach the stomach."
          },
          {
            "id": "gall_bladder",
            "label": "Gall bladder (stores bile)",
            "coords": [38, 54],
            "labelPos": [-10, 55],
            "ncertDefinition": "A small, pear-shaped muscular sac located under the liver that stores and concentrates bile juice.",
            "keyFunction": "Stores bile produced by the liver and releases it into the duodenum via the bile duct during fat digestion.",
            "examTip": "The gall bladder stores and concentrates bile, but does NOT produce it."
          },
          {
            "id": "bile_duct",
            "label": "Bile duct",
            "coords": [49, 52],
            "labelPos": [105, 58],
            "ncertDefinition": "A small tube-like structure formed by joining the hepatic duct and cystic duct that carries bile into the duodenum.",
            "keyFunction": "Transports bile juice from the liver and gall bladder to the small intestine for fat emulsification.",
            "examTip": "Joins with the pancreatic duct to form the hepato-pancreatic duct opening into the duodenum."
          },
          {
            "id": "liver",
            "label": "Liver",
            "coords": [38, 50],
            "labelPos": [-5, 45],
            "ncertDefinition": "The largest gland of the body located in the upper right side of the abdominal cavity, secreting bile juice.",
            "keyFunction": "Secretes bile that emulsifies fats and neutralizes the acidic chyme coming from the stomach.",
            "examTip": "Bile contains bile salts (bilirubin, biliverdin) but contains NO digestive enzymes."
          },
          {
            "id": "stomach",
            "label": "Stomach",
            "coords": [60, 52],
            "labelPos": [100, 40],
            "ncertDefinition": "A J-shaped, muscular, distensible sac located in the upper left part of the abdominal cavity.",
            "keyFunction": "Churns food, secretes HCl, pepsin, and mucus to begin protein breakdown and kill ingested microbes.",
            "examTip": "HCl provides the acidic pH (~1.8) necessary for activating inactive pepsinogen into active pepsin."
          },
          {
            "id": "pancreas",
            "label": "Pancreas",
            "coords": [49, 60],
            "labelPos": [-10, 70],
            "ncertDefinition": "An elongated, compound (heterocrine) gland lying between the limbs of the U-shaped duodenum.",
            "keyFunction": "Secretes pancreatic juice containing trypsin, lipase, and amylase for digesting proteins, fats, and carbohydrates.",
            "examTip": "Exocrine portion secretes digestive enzymes, while the endocrine portion (Islets of Langerhans) secretes insulin and glucagon."
          },
          {
            "id": "small_intestine",
            "label": "Small intestine",
            "coords": [50, 70],
            "labelPos": [105, 70],
            "ncertDefinition": "Longest part of the alimentary canal divided into duodenum, jejunum, and ileum, featuring internal villi.",
            "keyFunction": "Site of complete digestion of food and maximum nutrient absorption into the bloodstream.",
            "examTip": "Villi and microvilli dramatically increase the surface area for efficient absorption."
          },
          {
            "id": "large_intestine",
            "label": "Large intestine (Colon)",
            "coords": [65, 79],
            "labelPos": [110, 78],
            "ncertDefinition": "A wider, shorter tube surrounding the small intestine, consisting of cecum, colon, and rectum.",
            "keyFunction": "Absorbs water and essential salts from undigested food material and forms solid waste (faeces).",
            "examTip": "No significant digestive activity takes place in the large intestine."
          },
          {
            "id": "appendix",
            "label": "Appendix",
            "coords": [38, 80],
            "labelPos": [-10, 82],
            "ncertDefinition": "A narrow, blind-ended finger-like tubular projection arising from the cecum.",
            "keyFunction": "Functions as a vestigial organ in humans with minor lymphoid immune roles.",
            "examTip": "Inflammation of the vermiform appendix leads to appendicitis, requiring surgical removal."
          },
          {
            "id": "anus",
            "label": "Anus",
            "coords": [50, 84],
            "labelPos": [105, 88],
            "ncertDefinition": "Terminal opening of the alimentary canal regulated by internal and external anal sphincters.",
            "keyFunction": "Controls egestion (elimination) of faecal matter from the body.",
            "examTip": "Exit of waste is regulated by anal sphincter muscles."
          }
        ]
      },
      {
        id: "respiratory_system",
        title: "Human Respiratory System",
        imagePath: "respiratory.png",
        fallbackImage: "respiratory_system.png",
        summary: "Oxygen intake and CO₂ expulsion — featuring alveolar gas exchange.",
        id: "trachea",
        components: [
          {
            "id": "nasal_passage",
            "label": "Nasal passage",
            "coords": [52, 21],
            "labelPos": [42, 17],
            "ncertDefinition": "Channel lined with fine hair and mucus-secreting cells through which air enters the body.",
            "keyFunction": "Filters, warms, and humidifies inhaled air before it reaches the lungs.",
            "examTip": "Fine hairs and mucus lining trap dust and pathogens to purify incoming air."
          },
          {
            "id": "mouth_cavity",
            "label": "Mouth cavity",
            "coords": [53, 25],
            "labelPos": [42, 25],
            "ncertDefinition": "Secondary pathway for air intake, situated below the nasal cavity.",
            "keyFunction": "Allows supplementary passage for air during rapid or heavy breathing.",
            "examTip": "Breathing through the mouth does not filter or warm air as effectively as the nasal passage."
          },
          {
            "id": "pharynx",
            "label": "Pharynx",
            "coords": [61, 30],
            "labelPos": [88, 21],
            "ncertDefinition": "Common passage for both air and food connecting the oral/nasal cavities to the larynx and esophagus.",
            "keyFunction": "Routes air to the trachea while preventing food entry into the airway via the epiglottis.",
            "examTip": "The epiglottis acts as a flap valve preventing food from entering the windpipe during swallowing."
          },
          {
            "id": "larynx",
            "label": "Larynx",
            "coords": [62, 35],
            "labelPos": [42, 37],
            "ncertDefinition": "Cartilaginous voice box connecting the pharynx to the trachea, containing vocal cords.",
            "keyFunction": "Produces sound via vocal cord vibration and protects the lower respiratory tract.",
            "examTip": "Prominent in human males as the Adam's apple during puberty."
          },
          {
            "id": "trachea",
            "label": "Trachea",
            "coords": [62, 38],
            "labelPos": [78, 30],
            "ncertDefinition": "Windpipe supported by C-shaped cartilaginous rings extending down to the thoracic cavity.",
            "keyFunction": "Serves as the main airway conducting air into the primary bronchi.",
            "examTip": "Cartilaginous rings prevent the trachea from collapsing when there is less air in it."
          },
          {
            "id": "rings_of_cartilage",
            "label": "Rings of cartilage",
            "coords": [63, 41],
            "labelPos": [86, 38],
            "ncertDefinition": "C-shaped structural rings of hyaline cartilage lining the tracheal wall.",
            "keyFunction": "Ensure that the air passage does not collapse under pressure fluctuations.",
            "examTip": "High-yield CBSE question: 'Why does the trachea not collapse when empty?' -> Presence of rings of cartilage."
          },
          {
            "id": "bronchi",
            "label": "Bronchi",
            "coords": [62, 58],
            "labelPos": [32, 44],
            "ncertDefinition": "Two main branches originating from the division of the trachea at the thoracic level entering each lung.",
            "keyFunction": "Conduct air directly into the left and right lungs.",
            "examTip": "The trachea divides into primary bronchi at the level of the 5th thoracic vertebra."
          },
          {
            "id": "bronchioles",
            "label": "Bronchioles",
            "coords": [53, 62],
            "labelPos": [30, 74],
            "ncertDefinition": "Finer sub-branches formed by repeated division of bronchi within the lungs.",
            "keyFunction": "Distribute air to the alveolar ducts and individual alveolar sacs.",
            "examTip": "Terminal bronchioles end in balloon-like structures called alveoli."
          },
          {
            "id": "lung",
            "label": "Lung",
            "coords": [70, 55],
            "labelPos": [96, 55],
            "ncertDefinition": "Pair of spongy, elastic respiratory organs enclosed within the thoracic cavity.",
            "keyFunction": "Primary site for pulmonary respiration and gas exchange between blood and air.",
            "examTip": "Enclosed by a double-layered pleural membrane with pleural fluid reducing friction."
          },
          {
            "id": "ribs",
            "label": "Ribs",
            "coords": [76, 69],
            "labelPos": [96, 66],
            "ncertDefinition": "Bony cage surrounding the thoracic cavity protecting the heart and lungs.",
            "keyFunction": "Move upward and outward during inhalation to increase thoracic volume.",
            "examTip": "Intercostal muscles between ribs contract during inhalation to expand the chest cavity."
          },
          {
            "id": "diaphragm",
            "label": "Diaphragm",
            "coords": [64, 79],
            "labelPos": [100, 88],
            "ncertDefinition": "Muscular, dome-shaped partition separating the thoracic cavity from the abdominal cavity.",
            "keyFunction": "Flattens during contraction to pull air into lungs (inhalation) and relaxes upward during exhalation.",
            "examTip": "Inhalation: Diaphragm contracts & flattens; Exhalation: Diaphragm relaxes & becomes dome-shaped."
          },
          {
            "id": "alveolar_sac",
            "label": "Alveolar sac",
            "coords": [52, 83],
            "labelPos": [30, 84],
            "ncertDefinition": "Clusters of thin-walled, balloon-like alveoli at the terminus of respiratory bronchioles.",
            "keyFunction": "Provides a massive surface area lined with capillary networks for efficient gas exchange.",
            "examTip": "Alveolar walls provide an extensive surface area (~80 m²) for gaseous diffusion."
          },
          {
            "id": "respiratory_bronchioles",
            "label": "Respiratory bronchioles",
            "coords": [25, 58],
            "labelPos": [20, 90],
            "ncertDefinition": "Microscopic passageways branching from terminal bronchioles that lead directly into alveolar ducts.",
            "keyFunction": "Route air into individual alveoli while allowing minimal gas exchange along their walls.",
            "examTip": "Marks the transition from the conducting zone to the respiratory zone of the lungs."
          },
          {
            "id": "alveoli",
            "label": "Alveoli",
            "coords": [10, 52],
            "labelPos": [1, 42],
            "ncertDefinition": "Tiny, thin-walled, sac-like structures surrounded by extensive capillary networks where gas exchange occurs.",
            "keyFunction": "Exchange oxygen into blood capillaries and receive carbon dioxide for removal.",
            "examTip": "Respiratory pigment hemoglobin binds to O₂ in alveolar capillaries due to high partial pressure of oxygen."
          }
        ]
      },
      {
        id: "heart",
        title: "Human Heart & Double Circulation",
        imagePath: "heart.png",
        fallbackImage: "heart.png",
        summary: "Four-chambered heart driving systemic and pulmonary double circulation.",
        components: [
          {
            "id": "aorta",
            "label": "Aorta",
            "coords": [45, 1],
            "labelPos": [45, -8],
            "ncertDefinition": "The main and largest artery of the human body originating from the left ventricle.",
            "keyFunction": "Carries oxygen-rich blood under high pressure from the left ventricle to all body parts.",
            "examTip": "Aorta carries oxygenated blood to the body, while Pulmonary Artery carries deoxygenated blood to the lungs."
          },
          {
            "id": "vena_cava_upper",
            "label": "Vena Cava from upper body",
            "coords": [18, 13],
            "labelPos": [-10, 18],
            "ncertDefinition": "Large vein (Superior Vena Cava) collecting deoxygenated blood from the head, neck, arms, and upper chest.",
            "keyFunction": "Returns deoxygenated blood from the upper half of the body into the right atrium.",
            "examTip": "Veins generally carry deoxygenated blood and have valves to prevent backflow."
          },
          {
            "id": "pulmonary_arteries",
            "label": "Pulmonary arteries",
            "coords": [75, 25],
            "labelPos": [100, 18],
            "ncertDefinition": "Arteries arising from the right ventricle that divide into right and left branches going to the lungs.",
            "keyFunction": "Carries deoxygenated blood from the right ventricle to the lungs for oxygenation.",
            "examTip": "Pulmonary artery is the ONLY artery in the human body that carries deoxygenated blood."
          },
          {
            "id": "pulmonary_veins",
            "label": "Pulmonary veins",
            "coords": [80, 30],
            "labelPos": [100, 28],
            "ncertDefinition": "Veins carrying oxygenated blood from the lungs back to the left atrium of the heart.",
            "keyFunction": "Transports freshly oxygenated blood from the lungs into the left atrium.",
            "examTip": "Pulmonary vein is the ONLY vein in the human body that carries oxygenated blood."
          },
          {
            "id": "right_atrium",
            "label": "Right atrium",
            "coords": [20, 42],
            "labelPos": [-10, 38],
            "ncertDefinition": "Upper right chamber of the heart receiving deoxygenated blood from the body.",
            "keyFunction": "Relaxes to collect deoxygenated blood from the vena cavae and contracts to push it into the right ventricle.",
            "examTip": "Right side of the heart always handles deoxygenated blood; left side handles oxygenated blood."
          },
          {
            "id": "left_atrium",
            "label": "Left atrium",
            "coords": [64, 40],
            "labelPos": [100, 40],
            "ncertDefinition": "Upper left chamber of the heart receiving oxygenated blood from the lungs.",
            "keyFunction": "Relaxes to collect oxygen-rich blood from pulmonary veins and contracts to pump it into the left ventricle.",
            "examTip": "Thin-walled upper chambers (atria) receive blood; thick-walled lower chambers (ventricles) pump blood."
          },
          {
            "id": "vena_cava_lower",
            "label": "Vena Cava from lower body",
            "coords": [26, 92],
            "labelPos": [-10, 94],
            "ncertDefinition": "Large vein (Inferior Vena Cava) bringing deoxygenated blood from abdomen, legs, and lower organs.",
            "keyFunction": "Drains deoxygenated blood from lower body regions into the right atrium.",
            "examTip": "Both superior and inferior vena cava empty into the right atrium."
          },
          {
            "id": "right_ventricle",
            "label": "Right ventricle",
            "coords": [41, 68],
            "labelPos": [-10, 68],
            "ncertDefinition": "Lower muscular right chamber that receives blood from right atrium and pumps it to the lungs.",
            "keyFunction": "Pumps deoxygenated blood to the lungs via the pulmonary artery.",
            "examTip": "Has thinner muscular walls than the left ventricle because it only pumps blood to nearby lungs."
          },
          {
            "id": "left_ventricle",
            "label": "Left ventricle",
            "coords": [66, 70],
            "labelPos": [100, 70],
            "ncertDefinition": "Thick-walled lower left chamber that pumps oxygenated blood throughout the body.",
            "keyFunction": "Contracts powerfully to force oxygen-rich blood into the aorta for systemic circulation.",
            "examTip": "Left ventricle has the thickest muscular wall to generate maximum pressure for supplying the whole body."
          },
          {
            "id": "septum",
            "label": "Septum (dividing wall)",
            "coords": [60, 78],
            "labelPos": [66, 100],
            "ncertDefinition": "Thick muscular partition separating the right and left sides of the heart.",
            "keyFunction": "Prevents mixing of oxygenated (left) and deoxygenated (right) blood.",
            "examTip": "A complete four-chambered heart with a septum prevents mixing of oxygenated and deoxygenated blood, ensuring high metabolic efficiency in mammals/birds."
          }
        ]
      },
      {
        id: "excretory_system",
        title: "Excretory System & Nephron",
        imagePath: "excretory_system.png",
        fallbackImage: "excretory_system.png",
        summary: "Urinary system filtering nitrogenous wastes through functional nephron units.",
        components: [
          {
            "id": "left_renal_artery",
            "label": "Left renal artery",
            "coords": [54, 22],
            "labelPos": [98, 12],
            "ncertDefinition": "Branch arising from the abdominal aorta that carries oxygenated blood rich in nitrogenous wastes into the left kidney.",
            "keyFunction": "Supplies blood under pressure to the kidney for filtration by nephrons.",
            "examTip": "Renal artery brings oxygenated but unfiltered blood containing urea to the kidney."
          },
          {
            "id": "left_kidney",
            "label": "kidneys",
            "coords": [75, 25],
            "labelPos": [98, 30],
            "ncertDefinition": "Bean-shaped excretory organ located in the abdominal cavity on either side of the backbone.",
            "keyFunction": "Filters nitrogenous wastes (urea, uric acid) from blood to produce urine and regulates water-salt balance (osmoregulation).",
            "examTip": "Functional filtration units inside the kidney are called nephrons."
          },
          {
            "id": "right_renal_vein",
            "label": "Right renal vein",
            "coords": [35, 22],
            "labelPos": [18, 38],
            "ncertDefinition": "Blood vessel that drains filtered deoxygenated blood from the left kidney into the inferior vena cava.",
            "keyFunction": "Carries purified (unleaded/urea-free) blood away from the kidney back to systemic circulation.",
            "examTip": "Renal vein carries the cleanest blood with the lowest concentration of urea."
          },
          {
            "id": "aorta",
            "label": "Aorta",
            "coords": [52, 38],
            "labelPos": [78, 38],
            "ncertDefinition": "Main systemic arterial trunk (abdominal aorta) carrying oxygenated blood down through the abdomen.",
            "keyFunction": "Branches into renal arteries to deliver blood to both kidneys for filtration.",
            "examTip": "Represented in red/orange in anatomical diagrams; supplies oxygenated blood to abdominal organs."
          },
          {
            "id": "left_ureter",
            "label": "Left ureter",
            "coords": [68, 52],
            "labelPos": [100, 48],
            "ncertDefinition": "A long, thin muscular tube extending from the hilum of the left kidney down to the urinary bladder.",
            "keyFunction": "Transports urine from the kidney to the urinary bladder via peristaltic movements.",
            "examTip": "Ureters push urine downward through peristalsis into the bladder."
          },
          {
            "id": "vena_cava",
            "label": "Vena cava",
            "coords": [44, 38],
            "labelPos": [18, 52],
            "ncertDefinition": "Large vein (Inferior Vena Cava) running parallel to the aorta in the abdominal cavity.",
            "keyFunction": "Receives purified deoxygenated blood from the renal veins and carries it back toward the heart.",
            "examTip": "Represented in blue in anatomical diagrams; drains the lower body and abdominal organs."
          },
          {
            "id": "urinary_bladder",
            "label": "Urinary bladder",
            "coords": [50, 75],
            "labelPos": [100, 71],
            "ncertDefinition": "A distensible, muscular sac located in the lower pelvic cavity that stores urine.",
            "keyFunction": "Stores urine temporarily under nervous control until it is excreted during micturition.",
            "examTip": "Because the bladder is under nervous control, we can usually control the urge to urinate."
          },
          {
            "id": "urethra",
            "label": "Urethra",
            "coords": [50, 90],
            "labelPos": [78, 81],
            "ncertDefinition": "Terminal muscular tube extending from the neck of the urinary bladder to the exterior of the body.",
            "keyFunction": "Acts as the duct through which urine is discharged out of the body from the bladder.",
            "examTip": "Release of urine through the urethra is regulated by a urethral sphincter muscle."
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 4 — Control & Coordination  (Class 10)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "unit4",
    title: "Unit 4: Control & Coordination",
    grade: "Class 10",
    ncertChapter: "Chapter 7: Control and Coordination",
    description: "Nervous system, Neuron structure, Synaptic transmission, Human Brain",
    topics: [
      {
        id: "neuron",
        title: "Structure of a Neuron",
        imagePath: "nervous.png",
        fallbackImage: "neuron.png",
        summary: "Structural and functional unit of the nervous system — conducts electrical impulses.",
        components: [
          {
            "id": "nucleus",
            "label": "Nucleus",
            "coords": [25, 24],
            "labelPos": [26, 1],
            "ncertDefinition": "Large spherical structure located centrally in the cell body (cyton) of a neuron.",
            "keyFunction": "Directs cellular functions, protein synthesis, and metabolic activities of the neuron.",
            "examTip": "Neurons cannot divide because mature neurons lack functional centrioles, despite having a nucleus."
          },
          {
            "id": "cell_body",
            "label": "Cell body",
            "coords": [20, 22],
            "labelPos": [1, 31],
            "ncertDefinition": "Central part of a neuron containing cytoplasm, cell organelles, and a prominent nucleus.",
            "keyFunction": "Integrates incoming electrical signals from dendrites and maintains the neuron's health.",
            "examTip": "Also called Cyton or Soma; contains Nissl's granules involved in protein synthesis."
          },
          {
            "id": "dendrite",
            "label": "Dendrite",
            "coords": [36, 10],
            "labelPos": [50, 10],
            "ncertDefinition": "Short, branched cytoplasmic projections extending outward from the cell body.",
            "keyFunction": "Receives stimuli or chemical signals from other neurons or receptors and conducts electrical impulses toward the cell body.",
            "examTip": "Direction of nerve impulse: Dendrite → Cell Body → Axon → Axon Terminal."
          },
          {
            "id": "axon",
            "label": "Axon",
            "coords": [47, 24],
            "labelPos": [47, 34],
            "ncertDefinition": "A long, single cylindrical fiber extending from the cell body covered by a myelin sheath in insulated neurons.",
            "keyFunction": "Conducts electrical nerve impulses away from the cell body toward nerve endings.",
            "examTip": "Axoplasm carries action potentials rapidly; myelin sheath increases impulse transmission speed."
          },
          {
            "id": "nerve_ending",
            "label": "Nerve ending",
            "coords": [91, 32],
            "labelPos": [71, 36],
            "ncertDefinition": "Fine branched terminals at the end of an axon that terminate in synaptic knobs.",
            "keyFunction": "Converts electrical impulses into chemical signals by releasing neurotransmitters across synapses.",
            "examTip": "At the nerve ending, electrical signals trigger the release of chemicals like acetylcholine."
          },
          {
            "id": "axon_nmj",
            "label": "Axon",
            "coords": [20, 58],
            "labelPos": [1, 59],
            "ncertDefinition": "Terminal axon branch approaching a muscle fiber to establish functional communication.",
            "keyFunction": "Carries motor nerve impulses down to the neuromuscular junction.",
            "examTip": "Motor neurons carry signals from the central nervous system to effector organs like muscles."
          },
          {
            "id": "muscle_fibre",
            "label": "Muscle fibre",
            "coords": [10, 73],
            "labelPos": [-10, 73],
            "ncertDefinition": "Elongated contractile muscle cell responding to nervous stimulation.",
            "keyFunction": "Contracts upon receiving neurotransmitters from the motor neuron.",
            "examTip": "Binding of acetylcholine to muscle cell receptors triggers muscle contraction."
          },
          {
            "id": "capillary",
            "label": "Capillary",
            "coords": [27, 82],
            "labelPos": [10, 83],
            "ncertDefinition": "Microscopic blood vessel supplying oxygen and nutrients to neuromuscular tissues.",
            "keyFunction": "Delivers oxygen and glucose required for ATP production during muscle activity.",
            "examTip": "Ensures metabolic exchange for high energy demands of active muscles and nerves."
          },
          {
            "id": "neuromuscular_junction",
            "label": "Neuromuscular junction",
            "coords": [42, 66],
            "labelPos": [42, 52],
            "ncertDefinition": "The specialized microscopic gap/synapse between the terminal of a motor neuron and the sarcolemma of a muscle fiber.",
            "keyFunction": "Transmits nerve impulses from motor neurons to skeletal muscle cells to induce contraction.",
            "examTip": "A classic high-yield question: 'Where is the chemical neurotransmitter released to stimulate muscle movement?' -> Neuromuscular junction."
          },
          {
            "id": "mitochondrion",
            "label": "Mitochondrion",
            "coords": [91, 78],
            "labelPos": [80, 91],
            "ncertDefinition": "Double-membraned organelle concentrated abundantly inside presynaptic terminals and muscle fibers.",
            "keyFunction": "Provides ATP required for neurotransmitter synthesis, vesicle transport, and muscle contraction.",
            "examTip": "Abundant in nerve terminals due to high energy requirements for synaptic transmission."
          }
        ]
      },
      {
        id: "human_brain",
        title: "Human Brain Architecture",
        imagePath: "human_brain.png",
        fallbackImage: "brain.png",
        summary: "Main coordinating centre divided into Forebrain, Midbrain, and Hindbrain.",
        components: [
          {
            "id": "fore_brain",
            "label": "Fore-Brain",
            "coords": [1, 35],
            "labelPos": [1, 35],
            "ncertDefinition": "The main thinking part of the brain, comprising the cerebrum, thalamus, and hypothalamus.",
            "keyFunction": "Controls voluntary actions, processing sensory information (hearing, smell, sight), memory, intelligence, and sensations of hunger.",
            "examTip": "Fore-brain has separate areas specialized for hearing, smell, sight, and memory."
          },
          {
            "id": "cerebrum",
            "label": "Cerebrum",
            "coords": [51, 23],
            "labelPos": [51, 1],
            "ncertDefinition": "The largest and most prominent part of the human brain with highly folded cortical surfaces.",
            "keyFunction": "Center of intelligence, memory, reasoning, emotion, speech, and voluntary motor control.",
            "examTip": "Cerebrum forms the major portion of the fore-brain and is divided into two cerebral hemispheres."
          },
          {
            "id": "cranium",
            "label": "Cranium (skull)",
            "coords": [68, 11],
            "labelPos": [70, 2],
            "ncertDefinition": "Bony box or skull structure enclosing and protecting the brain.",
            "keyFunction": "Provides hard mechanical protection to the delicate brain tissue along with cerebrospinal fluid.",
            "examTip": "The brain sits inside a fluid-filled balloon within the cranium to absorb mechanical shocks."
          },
          {
            "id": "mid_brain",
            "label": "Mid-brain",
            "coords": [48, 45],
            "labelPos": [96, 45],
            "ncertDefinition": "Central region connecting the fore-brain to the hind-brain.",
            "keyFunction": "Controls involuntary actions such as visual and auditory reflexes (like pupil size adjustment).",
            "examTip": "Connects the fore-brain to the hind-brain and controls involuntary reflex responses."
          },
          {
            "id": "hypothalamus",
            "label": "Hypothalamus",
            "coords": [42, 50],
            "labelPos": [10, 68],
            "ncertDefinition": "Basal region of the fore-brain located below the thalamus and connected to the pituitary gland.",
            "keyFunction": "Controls body temperature, urge for eating and drinking (satiety center), and regulates pituitary hormone secretion.",
            "examTip": "Contains the center for controlling hunger, thirst, and body temperature regulation."
          },
          {
            "id": "pituitary_gland",
            "label": "Pituitary gland",
            "coords": [35, 60],
            "labelPos": [20, 80],
            "ncertDefinition": "Small pea-sized master endocrine gland attached to the base of the hypothalamus.",
            "keyFunction": "Secretes growth hormone (GH) and various trophic hormones regulating other endocrine glands.",
            "examTip": "Known as the 'Master Gland' of the endocrine system."
          },
          {
            "id": "hind_brain",
            "label": "Hind-brain",
            "coords": [25, 90],
            "labelPos": [28, 90],
            "ncertDefinition": "Lower part of the brain consisting of three regions: Pons, Medulla, and Cerebellum.",
            "keyFunction": "Regulates vital involuntary actions (blood pressure, salivation, vomiting) and body posture/balance.",
            "examTip": "Composed of Pons, Medulla, and Cerebellum."
          },
          {
            "id": "pons",
            "label": "Pons",
            "coords": [48, 64],
            "labelPos": [40, 83],
            "ncertDefinition": "Part of the hind-brain situated above the medulla oblongata containing fiber tracts.",
            "keyFunction": "Regulates respiration rate and relays signals between different parts of the brain.",
            "examTip": "Contains the pneumotaxic center that moderates respiration functions."
          },
          {
            "id": "medulla",
            "label": "Medulla",
            "coords": [52, 72],
            "labelPos": [41, 88],
            "ncertDefinition": "Lowermost region of the brain stem continuing downward as the spinal cord.",
            "keyFunction": "Controls critical involuntary functions including blood pressure, salivation, vomiting, and swallowing reflexes.",
            "examTip": "High-yield question: 'Which part controls involuntary actions like blood pressure and salivation?' -> Medulla in hind-brain."
          },
          {
            "id": "cerebellum",
            "label": "Cerebellum",
            "coords": [62, 68],
            "labelPos": [41, 93],
            "ncertDefinition": "Highly folded part of the hind-brain lying behind the brain stem.",
            "keyFunction": "Coordinates precision of voluntary movements and maintains body posture, equilibrium, and balance.",
            "examTip": "Responsible for activities requiring balance like walking in a straight line, riding a bicycle, or picking up a pencil."
          },
          {
            "id": "spinal_cord",
            "label": "Spinal cord",
            "coords": [60, 88],
            "labelPos": [72, 92],
            "ncertDefinition": "Long cylindrical nerve bundle extending from the medulla down through the vertebral column.",
            "keyFunction": "Main center for reflex actions and conducts nerve impulses between body parts and the brain.",
            "examTip": "Spinal cord handles rapid involuntary reflex actions independent of conscious brain processing."
          }
        ]
      }
    ]
  }
];

/* Rewrite every bucket-relative `imagePath` into an absolute public URL once,
   at module load, so consumers can keep reading `topic.imagePath` directly. */
export const BIOLOGY_UNITS = BIOLOGY_UNITS_RAW.map((unit) => ({
  ...unit,
  topics: unit.topics.map((topic) => ({
    ...topic,
    imagePath: labAssetUrl(topic.imagePath),
  })),
}));

/** Utility: find a topic and attach its parent unit metadata */
export function getTopicById(topicId) {
  for (const unit of BIOLOGY_UNITS) {
    const topic = unit.topics.find((t) => t.id === topicId);
    if (topic) return { ...topic, unitTitle: unit.title, grade: unit.grade };
  }
  return null;
}
