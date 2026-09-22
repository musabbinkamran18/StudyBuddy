import type { DifficultyValue } from "./learning";

export type SyllabusEntry = {
  name: string;
  description?: string;
  difficulty: DifficultyValue;
  sort_order: number;
};

// canonical keys used in the DB curriculum column
export type CurriculumKey = "matric" | "igcse" | "fsc" | "general";

type SyllabusMap = Partial<
  Record<CurriculumKey, Partial<Record<string, Partial<Record<string, SyllabusEntry[]>>>>>
>;

export const SYLLABUS: SyllabusMap = {
  // ─────────────────────────────────────────────────────────────────────
  // PAKISTAN MATRIC  (Federal / Punjab Board, Grades 9–10)
  // ─────────────────────────────────────────────────────────────────────
  matric: {
    "9": {
      math: [
        { name: "Matrices and Determinants", description: "Matrix notation, operations and determinants", difficulty: "medium", sort_order: 1 },
        { name: "Real and Complex Numbers", description: "Properties of real numbers and introduction to complex numbers", difficulty: "easy", sort_order: 2 },
        { name: "Logarithms", description: "Laws of logarithms and common/natural logs", difficulty: "medium", sort_order: 3 },
        { name: "Algebraic Expressions and Formulas", description: "Algebraic identities and manipulation", difficulty: "easy", sort_order: 4 },
        { name: "Factorization", description: "Factoring polynomials using various techniques", difficulty: "medium", sort_order: 5 },
        { name: "Algebraic Manipulation", description: "HCF, LCM of algebraic expressions", difficulty: "medium", sort_order: 6 },
        { name: "Linear Equations and Inequalities", description: "Solving equations and inequalities in one variable", difficulty: "easy", sort_order: 7 },
        { name: "Linear Graphs and Applications", description: "Slope, intercepts and real-world linear models", difficulty: "medium", sort_order: 8 },
        { name: "Introduction to Coordinate Geometry", description: "Distance formula, midpoint and collinearity", difficulty: "medium", sort_order: 9 },
        { name: "Congruent Triangles", description: "Congruence postulates and proofs", difficulty: "medium", sort_order: 10 },
        { name: "Parallelograms and Triangles", description: "Properties and theorems of parallelograms", difficulty: "medium", sort_order: 11 },
        { name: "Line Bisectors and Angle Bisectors", description: "Constructions and theorems", difficulty: "easy", sort_order: 12 },
        { name: "Sides and Angles of a Triangle", description: "Inequalities and relations within triangles", difficulty: "medium", sort_order: 13 },
        { name: "Ratio and Proportion", description: "Similar triangles and proportionality", difficulty: "medium", sort_order: 14 },
        { name: "Practical Geometry", description: "Constructions of triangles and quadrilaterals", difficulty: "easy", sort_order: 15 },
        { name: "Statistics and Probability", description: "Data collection, frequency tables, mean/median/mode and basic probability", difficulty: "medium", sort_order: 16 },
      ],
      physics: [
        { name: "Physical Quantities and Measurement", description: "SI units, measuring instruments, significant figures", difficulty: "easy", sort_order: 1 },
        { name: "Kinematics", description: "Speed, velocity, acceleration, equations of motion and graphs", difficulty: "medium", sort_order: 2 },
        { name: "Dynamics", description: "Newton's laws, friction, momentum", difficulty: "medium", sort_order: 3 },
        { name: "Turning Effect of Forces", description: "Moments, centre of gravity, equilibrium conditions", difficulty: "medium", sort_order: 4 },
        { name: "Gravitation", description: "Universal gravitation, gravitational field and satellite motion", difficulty: "medium", sort_order: 5 },
        { name: "Work and Energy", description: "Work, kinetic/potential energy, conservation of energy, power", difficulty: "medium", sort_order: 6 },
        { name: "Properties of Matter", description: "Density, pressure in liquids, Archimedes' principle, elasticity", difficulty: "medium", sort_order: 7 },
        { name: "Thermal Properties of Matter", description: "Temperature, specific heat, latent heat, thermal expansion", difficulty: "medium", sort_order: 8 },
        { name: "Transfer of Heat", description: "Conduction, convection and radiation", difficulty: "easy", sort_order: 9 },
      ],
      chemistry: [
        { name: "Fundamentals of Chemistry", description: "Branches of chemistry, matter, mixtures and separation", difficulty: "easy", sort_order: 1 },
        { name: "Structure of Atoms", description: "Sub-atomic particles, electronic configuration, isotopes", difficulty: "medium", sort_order: 2 },
        { name: "Periodic Table and Periodicity", description: "Periods, groups, periodic trends", difficulty: "medium", sort_order: 3 },
        { name: "Structure of Molecules", description: "Ionic, covalent and coordinate bonding", difficulty: "medium", sort_order: 4 },
        { name: "Physical States of Matter", description: "Kinetic molecular theory, gas laws, liquids and solids", difficulty: "medium", sort_order: 5 },
        { name: "Solutions", description: "Types of solutions, concentration, solubility", difficulty: "medium", sort_order: 6 },
        { name: "Electrochemistry", description: "Oxidation/reduction, electrolysis, electrochemical cells", difficulty: "hard", sort_order: 7 },
        { name: "Chemical Reactivity", description: "Activity series, types of chemical reactions", difficulty: "medium", sort_order: 8 },
      ],
      biology: [
        { name: "Introduction to Biology", description: "Levels of organisation, branches and careers in biology", difficulty: "easy", sort_order: 1 },
        { name: "Solving a Biological Problem", description: "Scientific method, hypothesis, data and interpretation", difficulty: "easy", sort_order: 2 },
        { name: "Biodiversity", description: "Classification system, kingdoms, binomial nomenclature", difficulty: "medium", sort_order: 3 },
        { name: "Cells and Tissues", description: "Cell theory, prokaryotic/eukaryotic, cell organelles, tissues", difficulty: "medium", sort_order: 4 },
        { name: "Cell Cycle", description: "Mitosis, meiosis and their significance", difficulty: "hard", sort_order: 5 },
        { name: "Enzymes", description: "Enzyme structure, mechanism and factors affecting activity", difficulty: "medium", sort_order: 6 },
        { name: "Bioenergetics", description: "Photosynthesis and respiration overview", difficulty: "hard", sort_order: 7 },
        { name: "Nutrition", description: "Autotrophic and heterotrophic nutrition, human digestive system", difficulty: "medium", sort_order: 8 },
        { name: "Transport", description: "Diffusion, osmosis, transport in plants and blood circulation", difficulty: "hard", sort_order: 9 },
      ],
      english: [
        { name: "Comprehension and Reading", description: "Unseen passage reading and comprehension questions", difficulty: "medium", sort_order: 1 },
        { name: "Essay Writing", description: "Formal and descriptive essays", difficulty: "medium", sort_order: 2 },
        { name: "Letter Writing", description: "Formal and informal letters", difficulty: "easy", sort_order: 3 },
        { name: "Grammar: Tenses", description: "All 12 tenses in use", difficulty: "medium", sort_order: 4 },
        { name: "Grammar: Parts of Speech", description: "Nouns, pronouns, verbs, adjectives, adverbs, etc.", difficulty: "easy", sort_order: 5 },
        { name: "Vocabulary and Synonyms", description: "Word meanings and contextual vocabulary", difficulty: "medium", sort_order: 6 },
        { name: "Sentences and Clauses", description: "Simple, compound and complex sentences", difficulty: "medium", sort_order: 7 },
        { name: "Prose and Poetry", description: "Textbook chapters and poems with analysis", difficulty: "medium", sort_order: 8 },
      ],
      computer: [
        { name: "Computer and Its Components", description: "Hardware components, CPU, memory and I/O devices", difficulty: "easy", sort_order: 1 },
        { name: "History and Classification of Computers", description: "Generations and types of computers", difficulty: "easy", sort_order: 2 },
        { name: "Applications of ICT", description: "ICT in education, business, healthcare and communication", difficulty: "easy", sort_order: 3 },
        { name: "Windows Operating System", description: "Desktop, file management, settings and shortcuts", difficulty: "easy", sort_order: 4 },
        { name: "Microsoft Word", description: "Document creation, formatting and editing", difficulty: "easy", sort_order: 5 },
        { name: "Microsoft Excel", description: "Spreadsheets, formulas and charts", difficulty: "medium", sort_order: 6 },
        { name: "Microsoft PowerPoint", description: "Presentation design and slide management", difficulty: "easy", sort_order: 7 },
        { name: "Microsoft Access", description: "Database tables, queries and forms", difficulty: "medium", sort_order: 8 },
      ],
      islamiyat: [
        { name: "Seerat-un-Nabi (Part 1)", description: "Life of Prophet Muhammad ﷺ — birth to Hijrah", difficulty: "medium", sort_order: 1 },
        { name: "Quran with Translation (Part 1)", description: "Selected Surahs with Urdu and English translation", difficulty: "medium", sort_order: 2 },
        { name: "Ahadith Mubarkah (Part 1)", description: "Selected Hadith on worship and character", difficulty: "easy", sort_order: 3 },
        { name: "Tawheed and Risalat", description: "Oneness of Allah and prophethood", difficulty: "easy", sort_order: 4 },
        { name: "Akhrat and Islamic Beliefs", description: "Life after death, Day of Judgement, paradise and hell", difficulty: "easy", sort_order: 5 },
        { name: "Khulafa-e-Rashideen", description: "The four rightly-guided caliphs and their contributions", difficulty: "medium", sort_order: 6 },
      ],
      urdu: [
        { name: "نظم — Poetry (Nazm)", description: "Selected poems from the textbook with explanation", difficulty: "medium", sort_order: 1 },
        { name: "نثر — Prose (Nasr)", description: "Selected prose chapters from the textbook", difficulty: "medium", sort_order: 2 },
        { name: "افسانہ — Short Story", description: "Short stories and character analysis", difficulty: "medium", sort_order: 3 },
        { name: "قواعد — Grammar", description: "Urdu grammar rules, sentence structure and parts of speech", difficulty: "medium", sort_order: 4 },
        { name: "خطوط و مضامین — Letters and Essays", description: "Formal and informal writing in Urdu", difficulty: "medium", sort_order: 5 },
        { name: "مطالعہ متن — Text Study", description: "Close reading and comprehension of Urdu passages", difficulty: "medium", sort_order: 6 },
      ],
      social: [
        { name: "Pakistan: Physical Features", description: "Mountains, rivers, plateaus and plains of Pakistan", difficulty: "easy", sort_order: 1 },
        { name: "Climate and Vegetation", description: "Seasons, rainfall patterns and natural vegetation", difficulty: "easy", sort_order: 2 },
        { name: "Population and Human Resources", description: "Demographics, population growth and human development", difficulty: "medium", sort_order: 3 },
        { name: "Natural Resources", description: "Minerals, forests, water and energy resources", difficulty: "easy", sort_order: 4 },
        { name: "Agriculture", description: "Crops, irrigation systems and agricultural challenges", difficulty: "medium", sort_order: 5 },
        { name: "Industry and Trade", description: "Major industries, exports and imports", difficulty: "medium", sort_order: 6 },
        { name: "Transport and Communication", description: "Road, rail, air and sea transport plus media", difficulty: "easy", sort_order: 7 },
        { name: "Pakistan's Foreign Policy", description: "Relations with neighbouring and major world powers", difficulty: "medium", sort_order: 8 },
      ],
    },

    "10": {
      math: [
        { name: "Quadratic Equations", description: "Solving by factoring, completing the square and quadratic formula", difficulty: "medium", sort_order: 1 },
        { name: "Theory of Quadratic Equations", description: "Nature of roots, sum/product of roots, formation of equations", difficulty: "hard", sort_order: 2 },
        { name: "Variations", description: "Direct, inverse and joint variation with applications", difficulty: "medium", sort_order: 3 },
        { name: "Partial Fractions", description: "Resolving rational expressions into partial fractions", difficulty: "hard", sort_order: 4 },
        { name: "Sets and Functions", description: "Set operations, types of functions and function composition", difficulty: "medium", sort_order: 5 },
        { name: "Basic Statistics", description: "Measures of central tendency, dispersion and frequency distribution", difficulty: "medium", sort_order: 6 },
        { name: "Introduction to Trigonometry", description: "Trigonometric ratios, identities and solving right triangles", difficulty: "medium", sort_order: 7 },
        { name: "Projection of a Side of a Triangle", description: "Projection rule and its applications", difficulty: "hard", sort_order: 8 },
        { name: "Chords of a Circle", description: "Theorems on chords, arcs and angles", difficulty: "medium", sort_order: 9 },
        { name: "Tangent to a Circle", description: "Tangent properties and related theorems", difficulty: "medium", sort_order: 10 },
        { name: "Practical Geometry", description: "Constructions using compass and ruler", difficulty: "easy", sort_order: 11 },
      ],
      physics: [
        { name: "Simple Harmonic Motion and Waves", description: "SHM, wave parameters, transverse and longitudinal waves", difficulty: "hard", sort_order: 1 },
        { name: "Sound", description: "Sound production, speed of sound, echoes, ultrasound", difficulty: "medium", sort_order: 2 },
        { name: "Geometrical Optics", description: "Reflection, refraction, lenses and mirrors", difficulty: "medium", sort_order: 3 },
        { name: "Electrostatics", description: "Coulomb's law, electric field, potential and capacitance", difficulty: "hard", sort_order: 4 },
        { name: "Current Electricity", description: "Ohm's law, circuits, resistors, power and energy", difficulty: "medium", sort_order: 5 },
        { name: "Electromagnetism", description: "Magnetic effect of current, electromagnetic induction", difficulty: "hard", sort_order: 6 },
        { name: "Basic Electronics", description: "Semiconductors, diodes, transistors and logic gates", difficulty: "hard", sort_order: 7 },
        { name: "Information and Communication Technology", description: "Digital signals, binary data, internet and communication", difficulty: "medium", sort_order: 8 },
        { name: "Atomic and Nuclear Physics", description: "Atomic models, radioactivity, nuclear reactions and safety", difficulty: "hard", sort_order: 9 },
      ],
      chemistry: [
        { name: "Chemical Equilibrium", description: "Le Chatelier's principle, equilibrium constant Kc and Kp", difficulty: "hard", sort_order: 1 },
        { name: "Acids, Bases and Salts", description: "pH, neutralisation, buffer solutions and salt hydrolysis", difficulty: "medium", sort_order: 2 },
        { name: "Organic Chemistry — Introduction", description: "Organic compounds, functional groups, IUPAC naming", difficulty: "medium", sort_order: 3 },
        { name: "Hydrocarbons", description: "Alkanes, alkenes, alkynes and their reactions", difficulty: "hard", sort_order: 4 },
        { name: "Biochemistry", description: "Carbohydrates, lipids, proteins and nucleic acids", difficulty: "medium", sort_order: 5 },
        { name: "The Atmosphere", description: "Composition of air, air pollution and global warming", difficulty: "easy", sort_order: 6 },
        { name: "Water", description: "Hard water, soft water, water treatment and pollution", difficulty: "medium", sort_order: 7 },
        { name: "Chemical Industries in Pakistan", description: "Urea, cement, sugar and fertiliser industries", difficulty: "medium", sort_order: 8 },
      ],
      biology: [
        { name: "Gaseous Exchange", description: "Gas exchange in plants and humans, breathing mechanism", difficulty: "medium", sort_order: 1 },
        { name: "Homeostasis", description: "Osmoregulation, thermoregulation and the role of kidneys", difficulty: "hard", sort_order: 2 },
        { name: "Coordination and Control", description: "Nervous system, brain, sense organs and endocrine system", difficulty: "hard", sort_order: 3 },
        { name: "Support and Movement", description: "Skeleton, joints, muscles and locomotion", difficulty: "medium", sort_order: 4 },
        { name: "Reproduction", description: "Asexual and sexual reproduction, human reproductive system", difficulty: "medium", sort_order: 5 },
        { name: "Inheritance", description: "Mendelian genetics, monohybrid and dihybrid crosses", difficulty: "hard", sort_order: 6 },
        { name: "Man and His Environment", description: "Ecosystems, food chains, biodiversity and conservation", difficulty: "medium", sort_order: 7 },
        { name: "Biotechnology", description: "DNA technology, cloning, GM organisms and applications", difficulty: "hard", sort_order: 8 },
        { name: "Pharmacology", description: "Drug types, effects on the body and drug addiction", difficulty: "medium", sort_order: 9 },
      ],
      english: [
        { name: "Comprehension and Reading", description: "Advanced unseen passages and inference questions", difficulty: "medium", sort_order: 1 },
        { name: "Essay and Paragraph Writing", description: "Argumentative, analytical and creative essays", difficulty: "hard", sort_order: 2 },
        { name: "Letter and Application Writing", description: "Job applications and formal correspondence", difficulty: "medium", sort_order: 3 },
        { name: "Grammar: Active and Passive Voice", description: "Transformations and usage of voice", difficulty: "medium", sort_order: 4 },
        { name: "Grammar: Direct and Indirect Speech", description: "Reporting statements, questions and commands", difficulty: "medium", sort_order: 5 },
        { name: "Vocabulary in Context", description: "Synonyms, antonyms and word usage in sentences", difficulty: "medium", sort_order: 6 },
        { name: "Prose and Poetry Analysis", description: "Textbook chapters and poems with detailed analysis", difficulty: "hard", sort_order: 7 },
      ],
      computer: [
        { name: "Number Systems", description: "Binary, octal, hexadecimal conversions and arithmetic", difficulty: "hard", sort_order: 1 },
        { name: "Logic Gates and Boolean Algebra", description: "AND, OR, NOT, NAND, NOR, XOR gates and truth tables", difficulty: "hard", sort_order: 2 },
        { name: "Computer Memory", description: "RAM, ROM, cache, secondary storage and hierarchy", difficulty: "medium", sort_order: 3 },
        { name: "Input / Output Devices", description: "Keyboards, scanners, printers, monitors and their types", difficulty: "easy", sort_order: 4 },
        { name: "Data Communication and Networks", description: "Network types, topologies, protocols and OSI model", difficulty: "medium", sort_order: 5 },
        { name: "The Internet", description: "WWW, browsers, email, FTP and internet services", difficulty: "easy", sort_order: 6 },
        { name: "Information Security", description: "Threats, viruses, firewalls, encryption and ethical use", difficulty: "medium", sort_order: 7 },
        { name: "Introduction to Programming", description: "Variables, data types, input/output and basic control structures", difficulty: "hard", sort_order: 8 },
        { name: "Flowcharts and Pseudocode", description: "Algorithm design using flowcharts and pseudocode", difficulty: "medium", sort_order: 9 },
      ],
      islamiyat: [
        { name: "Seerat-un-Nabi (Part 2)", description: "Life of Prophet Muhammad ﷺ — Madinah period to farewell", difficulty: "medium", sort_order: 1 },
        { name: "Quran with Translation (Part 2)", description: "Further selected Surahs with translation and tafseer", difficulty: "medium", sort_order: 2 },
        { name: "Ahadith Mubarkah (Part 2)", description: "Hadith on society, rights and responsibilities", difficulty: "medium", sort_order: 3 },
        { name: "Islamic Social System", description: "Family structure, rights of women and minorities in Islam", difficulty: "medium", sort_order: 4 },
        { name: "Islamic Ethics and Values", description: "Honesty, justice, patience, gratitude and brotherhood", difficulty: "easy", sort_order: 5 },
        { name: "Islam and Modern Challenges", description: "Islamic perspective on science, technology and global issues", difficulty: "hard", sort_order: 6 },
      ],
      urdu: [
        { name: "نظم — Poetry (Advanced)", description: "Selected Urdu poems with deeper literary analysis", difficulty: "hard", sort_order: 1 },
        { name: "نثر — Prose (Advanced)", description: "Advanced prose chapters with contextual understanding", difficulty: "hard", sort_order: 2 },
        { name: "ڈرامہ — Drama", description: "Urdu dramatic texts and their analysis", difficulty: "medium", sort_order: 3 },
        { name: "تنقید — Literary Criticism", description: "Basics of Urdu literary criticism", difficulty: "hard", sort_order: 4 },
        { name: "قواعد — Advanced Grammar", description: "Complex sentence structures, idioms and proverbs", difficulty: "hard", sort_order: 5 },
        { name: "انشاء پردازی — Essay Writing", description: "Structured Urdu essay writing on various topics", difficulty: "medium", sort_order: 6 },
      ],
      social: [
        { name: "Historical Background of Pakistan", description: "Mughal decline, British rule and the independence movement", difficulty: "medium", sort_order: 1 },
        { name: "Creation of Pakistan", description: "Two-Nation Theory, partition and Jinnah's leadership", difficulty: "medium", sort_order: 2 },
        { name: "Constitutional Development", description: "1956, 1962 and 1973 constitutions and their features", difficulty: "hard", sort_order: 3 },
        { name: "Political Structure of Pakistan", description: "Federal and provincial governments, Parliament", difficulty: "medium", sort_order: 4 },
        { name: "Economic System", description: "GDP, fiscal policy, taxation, trade and development", difficulty: "hard", sort_order: 5 },
        { name: "Cultural Heritage", description: "Languages, arts, festivals and religious sites of Pakistan", difficulty: "easy", sort_order: 6 },
        { name: "Foreign Relations", description: "Pakistan's relations with neighbours, OIC, UN and major powers", difficulty: "medium", sort_order: 7 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // CAMBRIDGE IGCSE / O-LEVEL  (Grades 8–10)
  // ─────────────────────────────────────────────────────────────────────
  igcse: {
    "8": {
      math: [
        { name: "Number and Arithmetic", description: "Integers, fractions, decimals, BIDMAS and estimation", difficulty: "easy", sort_order: 1 },
        { name: "Powers and Roots", description: "Squares, cubes, square roots, cube roots, indices", difficulty: "easy", sort_order: 2 },
        { name: "Fractions, Decimals and Percentages", description: "Conversions, calculations and applications", difficulty: "easy", sort_order: 3 },
        { name: "Basic Algebra", description: "Simplifying expressions, substitution and basic equations", difficulty: "medium", sort_order: 4 },
        { name: "Geometry — Lines and Angles", description: "Angle properties, parallel lines and transversals", difficulty: "easy", sort_order: 5 },
        { name: "Geometry — Polygons", description: "Triangles, quadrilaterals, angles in polygons", difficulty: "medium", sort_order: 6 },
        { name: "Perimeter, Area and Volume", description: "Calculating perimeter, area and volume of basic shapes", difficulty: "medium", sort_order: 7 },
        { name: "Ratio and Proportion", description: "Ratio notation, direct and inverse proportion", difficulty: "medium", sort_order: 8 },
        { name: "Introduction to Statistics", description: "Mean, median, mode, range and simple data display", difficulty: "easy", sort_order: 9 },
        { name: "Probability Basics", description: "Probability scale, simple events and sample spaces", difficulty: "easy", sort_order: 10 },
      ],
      physics: [
        { name: "Measurement and Units", description: "SI units, measuring instruments and estimation", difficulty: "easy", sort_order: 1 },
        { name: "Forces and Motion", description: "Speed, velocity, acceleration and Newton's laws", difficulty: "medium", sort_order: 2 },
        { name: "Energy, Work and Power", description: "Forms of energy, energy conservation and power", difficulty: "medium", sort_order: 3 },
        { name: "Pressure", description: "Pressure in solids, liquids and gases", difficulty: "medium", sort_order: 4 },
        { name: "Thermal Physics", description: "Temperature, heat transfer and changes of state", difficulty: "medium", sort_order: 5 },
        { name: "Waves — Introduction", description: "Wave properties, transverse and longitudinal waves", difficulty: "medium", sort_order: 6 },
        { name: "Light and Optics", description: "Reflection, refraction and basic lenses", difficulty: "medium", sort_order: 7 },
        { name: "Electricity Basics", description: "Static electricity, current, voltage and simple circuits", difficulty: "medium", sort_order: 8 },
      ],
      chemistry: [
        { name: "Particles and States of Matter", description: "Kinetic particle theory and changes of state", difficulty: "easy", sort_order: 1 },
        { name: "Atoms and Elements", description: "Structure of atoms, proton number, mass number", difficulty: "medium", sort_order: 2 },
        { name: "Compounds and Mixtures", description: "Elements vs compounds, separating mixtures", difficulty: "easy", sort_order: 3 },
        { name: "Periodic Table Overview", description: "Groups, periods and trends in the periodic table", difficulty: "medium", sort_order: 4 },
        { name: "Chemical Reactions", description: "Word equations, types of reactions and energy changes", difficulty: "medium", sort_order: 5 },
        { name: "Acids and Alkalis", description: "pH scale, indicators, neutralisation", difficulty: "easy", sort_order: 6 },
        { name: "Metals and Non-metals", description: "Properties, reactivity series and uses", difficulty: "medium", sort_order: 7 },
      ],
      biology: [
        { name: "Characteristics of Life", description: "MRS GREN and differences between living and non-living", difficulty: "easy", sort_order: 1 },
        { name: "Cells — Structure and Function", description: "Plant vs animal cells, organelles and their roles", difficulty: "medium", sort_order: 2 },
        { name: "Nutrition and Digestion", description: "Food groups, balanced diet and the digestive system", difficulty: "medium", sort_order: 3 },
        { name: "Photosynthesis", description: "Word equation, light reactions and factors affecting rate", difficulty: "medium", sort_order: 4 },
        { name: "Respiration", description: "Aerobic and anaerobic respiration, ATP", difficulty: "medium", sort_order: 5 },
        { name: "Transport in Living Organisms", description: "Osmosis, diffusion and blood circulation basics", difficulty: "medium", sort_order: 6 },
        { name: "Reproduction", description: "Asexual and sexual reproduction, pollination and germination", difficulty: "easy", sort_order: 7 },
        { name: "Ecosystems", description: "Food chains, webs, energy flow and habitat", difficulty: "easy", sort_order: 8 },
      ],
      english: [
        { name: "Reading Comprehension", description: "Unseen texts — identifying main ideas and specific information", difficulty: "medium", sort_order: 1 },
        { name: "Summary Writing", description: "Summarising information from texts in own words", difficulty: "medium", sort_order: 2 },
        { name: "Descriptive Writing", description: "Writing descriptively about scenes, objects and events", difficulty: "medium", sort_order: 3 },
        { name: "Narrative Writing", description: "Short story and narrative composition", difficulty: "medium", sort_order: 4 },
        { name: "Grammar Review", description: "Tenses, punctuation, sentence types and common errors", difficulty: "easy", sort_order: 5 },
        { name: "Vocabulary Building", description: "Word families, collocations and context clues", difficulty: "easy", sort_order: 6 },
      ],
      computer: [
        { name: "Data Representation", description: "Binary, denary and hexadecimal number systems", difficulty: "medium", sort_order: 1 },
        { name: "Computer Hardware", description: "CPU, input/output devices, memory and storage", difficulty: "easy", sort_order: 2 },
        { name: "Software Types", description: "Operating systems, applications and utilities", difficulty: "easy", sort_order: 3 },
        { name: "Networks and Internet", description: "LAN, WAN, internet, email and web browsing", difficulty: "medium", sort_order: 4 },
        { name: "Algorithm Basics", description: "Flowcharts, pseudocode, sequence, selection and iteration", difficulty: "medium", sort_order: 5 },
        { name: "Digital Safety", description: "Cybersecurity threats, safe online practices and privacy", difficulty: "easy", sort_order: 6 },
      ],
    },

    "9": {
      math: [
        { name: "Number", description: "Types of numbers, standard form, bounds, surds", difficulty: "medium", sort_order: 1 },
        { name: "Algebra and Expressions", description: "Expanding, factorising, algebraic fractions", difficulty: "medium", sort_order: 2 },
        { name: "Equations and Inequalities", description: "Linear and quadratic equations, simultaneous equations", difficulty: "medium", sort_order: 3 },
        { name: "Functions and Graphs", description: "Plotting functions, gradient, y-intercept", difficulty: "medium", sort_order: 4 },
        { name: "Coordinate Geometry", description: "Distance, midpoint, gradient and equation of a line", difficulty: "medium", sort_order: 5 },
        { name: "Geometry — Circles", description: "Circle theorems, arc length and sector area", difficulty: "hard", sort_order: 6 },
        { name: "Mensuration", description: "Area and volume of 3D shapes", difficulty: "medium", sort_order: 7 },
        { name: "Trigonometry — Right Triangles", description: "Sin, cos, tan and the Pythagorean theorem", difficulty: "medium", sort_order: 8 },
        { name: "Statistics", description: "Frequency tables, histograms, cumulative frequency", difficulty: "medium", sort_order: 9 },
        { name: "Probability", description: "Tree diagrams, mutually exclusive and independent events", difficulty: "medium", sort_order: 10 },
      ],
      physics: [
        { name: "Physical Quantities and Measurement", description: "Scalars, vectors, SI units and measuring instruments", difficulty: "easy", sort_order: 1 },
        { name: "Motion", description: "Displacement, velocity, acceleration, distance-time graphs", difficulty: "medium", sort_order: 2 },
        { name: "Forces", description: "Newton's laws, friction, weight, resultant forces", difficulty: "medium", sort_order: 3 },
        { name: "Momentum", description: "Momentum, impulse and conservation of momentum", difficulty: "hard", sort_order: 4 },
        { name: "Energy, Work and Power", description: "Types of energy, energy conservation, efficiency", difficulty: "medium", sort_order: 5 },
        { name: "Thermal Physics", description: "Specific heat capacity, latent heat, gas laws", difficulty: "hard", sort_order: 6 },
        { name: "Waves", description: "Wave properties, reflection, refraction, diffraction", difficulty: "medium", sort_order: 7 },
        { name: "Electromagnetic Spectrum", description: "Types of EM waves and their applications", difficulty: "medium", sort_order: 8 },
        { name: "Current Electricity", description: "Ohm's law, series and parallel circuits, components", difficulty: "medium", sort_order: 9 },
      ],
      chemistry: [
        { name: "Particulate Nature of Matter", description: "Kinetic theory, states of matter, diffusion", difficulty: "easy", sort_order: 1 },
        { name: "Atomic Structure", description: "Protons, neutrons, electrons, isotopes, electronic shells", difficulty: "medium", sort_order: 2 },
        { name: "Chemical Bonding", description: "Ionic, covalent and metallic bonding, dot-cross diagrams", difficulty: "hard", sort_order: 3 },
        { name: "Stoichiometry and Formulae", description: "Chemical formulae, mole concept, molar mass", difficulty: "hard", sort_order: 4 },
        { name: "Acids, Bases and Salts", description: "pH, indicators, preparation of salts", difficulty: "medium", sort_order: 5 },
        { name: "Energetics", description: "Exothermic and endothermic reactions, energy level diagrams", difficulty: "medium", sort_order: 6 },
        { name: "Chemical Reactions and Rates", description: "Types of reactions, rate factors and catalysts", difficulty: "medium", sort_order: 7 },
        { name: "Periodic Table Trends", description: "Group 1, 7, transition metals and periodic trends", difficulty: "medium", sort_order: 8 },
      ],
      biology: [
        { name: "Cell Biology", description: "Cell structure, organelles, cell division", difficulty: "medium", sort_order: 1 },
        { name: "Biological Molecules", description: "Carbohydrates, lipids, proteins and their tests", difficulty: "medium", sort_order: 2 },
        { name: "Enzymes", description: "Enzyme action, lock-and-key model, factors affecting activity", difficulty: "medium", sort_order: 3 },
        { name: "Plant Nutrition (Photosynthesis)", description: "Photosynthesis equation, chloroplast, limiting factors", difficulty: "medium", sort_order: 4 },
        { name: "Human Nutrition", description: "Digestive system, absorption and enzymes", difficulty: "medium", sort_order: 5 },
        { name: "Transport in Plants", description: "Transpiration, xylem and phloem, osmosis in roots", difficulty: "hard", sort_order: 6 },
        { name: "Transport in Humans", description: "Blood, heart, circulatory system and blood vessels", difficulty: "hard", sort_order: 7 },
        { name: "Gas Exchange", description: "Gas exchange surfaces in humans and plants", difficulty: "medium", sort_order: 8 },
        { name: "Respiration", description: "Aerobic and anaerobic respiration, ATP production", difficulty: "medium", sort_order: 9 },
      ],
      english: [
        { name: "Reading — Identifying Information", description: "Locating specific details and implicit meaning in texts", difficulty: "medium", sort_order: 1 },
        { name: "Reading — Writer's Effect", description: "Analysing language choices and their effect on the reader", difficulty: "hard", sort_order: 2 },
        { name: "Summary and Note-Making", description: "Selecting relevant points and writing concise summaries", difficulty: "medium", sort_order: 3 },
        { name: "Directed Writing", description: "Writing in a specific form: letter, report, speech", difficulty: "hard", sort_order: 4 },
        { name: "Creative and Personal Writing", description: "Narrative, descriptive and personal writing tasks", difficulty: "medium", sort_order: 5 },
        { name: "Grammar and Punctuation", description: "Complex sentences, clauses, punctuation and style", difficulty: "medium", sort_order: 6 },
      ],
      computer: [
        { name: "Data Representation", description: "Binary, hexadecimal, ASCII, images and sound encoding", difficulty: "medium", sort_order: 1 },
        { name: "Hardware and Software", description: "CPU components, memory hierarchy, OS functions", difficulty: "medium", sort_order: 2 },
        { name: "Networking", description: "Network types, protocols, IP addressing and internet", difficulty: "medium", sort_order: 3 },
        { name: "Algorithms", description: "Pseudocode, flowcharts, sorting and searching algorithms", difficulty: "hard", sort_order: 4 },
        { name: "Programming Concepts", description: "Variables, selection, iteration, procedures and functions", difficulty: "hard", sort_order: 5 },
        { name: "Security and Ethics", description: "Malware, encryption, privacy, copyright and hacking", difficulty: "medium", sort_order: 6 },
      ],
    },

    "10": {
      math: [
        { name: "Number — Advanced", description: "Standard form, bounds, rational/irrational, reciprocals", difficulty: "medium", sort_order: 1 },
        { name: "Algebra — Quadratics", description: "Factorising, completing the square, quadratic formula", difficulty: "hard", sort_order: 2 },
        { name: "Simultaneous Equations", description: "Linear and non-linear simultaneous equations", difficulty: "hard", sort_order: 3 },
        { name: "Functions", description: "Function notation, domain, range, composite and inverse", difficulty: "hard", sort_order: 4 },
        { name: "Coordinate Geometry — Lines", description: "Equations of lines, parallel and perpendicular lines", difficulty: "medium", sort_order: 5 },
        { name: "Geometry — Circle Theorems", description: "All circle theorems and proofs", difficulty: "hard", sort_order: 6 },
        { name: "Trigonometry — Sine and Cosine Rules", description: "Non-right triangles, sine rule, cosine rule, area formula", difficulty: "hard", sort_order: 7 },
        { name: "Vectors", description: "Vector notation, addition, subtraction and column vectors", difficulty: "hard", sort_order: 8 },
        { name: "Matrices", description: "Matrix operations, determinant, inverse and transformations", difficulty: "very_hard", sort_order: 9 },
        { name: "Probability — Advanced", description: "Conditional probability, Venn diagrams, tree diagrams", difficulty: "hard", sort_order: 10 },
        { name: "Statistics — Advanced", description: "Histograms, box plots, standard deviation, scatter graphs", difficulty: "hard", sort_order: 11 },
      ],
      physics: [
        { name: "Physical Quantities and Measurement", description: "Scalars, vectors, precision and systematic errors", difficulty: "medium", sort_order: 1 },
        { name: "Kinematics", description: "SUVAT equations, displacement-time and velocity-time graphs", difficulty: "medium", sort_order: 2 },
        { name: "Forces and Newton's Laws", description: "Free body diagrams, tension, friction, resultant force", difficulty: "medium", sort_order: 3 },
        { name: "Momentum and Impulse", description: "Conservation of momentum, elastic and inelastic collisions", difficulty: "hard", sort_order: 4 },
        { name: "Energy, Work and Power", description: "Kinetic/potential energy, power, efficiency", difficulty: "medium", sort_order: 5 },
        { name: "Thermal Physics", description: "Gas laws, internal energy, specific heat, latent heat", difficulty: "hard", sort_order: 6 },
        { name: "Waves and Electromagnetic Spectrum", description: "Wave properties, EM spectrum, diffraction and interference", difficulty: "hard", sort_order: 7 },
        { name: "Light — Reflection and Refraction", description: "Snell's law, total internal reflection, lenses", difficulty: "hard", sort_order: 8 },
        { name: "Electricity and Circuits", description: "Ohm's law, resistivity, series/parallel, power", difficulty: "medium", sort_order: 9 },
        { name: "Electromagnetism", description: "Magnetic fields, electromagnetic induction, motors and generators", difficulty: "hard", sort_order: 10 },
        { name: "Nuclear Physics", description: "Radioactivity, types of radiation, half-life, nuclear equations", difficulty: "hard", sort_order: 11 },
      ],
      chemistry: [
        { name: "Particulate Nature of Matter", description: "Kinetic theory and gas laws at particle level", difficulty: "medium", sort_order: 1 },
        { name: "Atomic Structure and Bonding", description: "Electron config, ionic/covalent/metallic bonding", difficulty: "hard", sort_order: 2 },
        { name: "Stoichiometry", description: "Mole calculations, limiting reagents, percentage yield", difficulty: "hard", sort_order: 3 },
        { name: "Electrochemistry", description: "Electrolysis, electrode products, electroplating", difficulty: "hard", sort_order: 4 },
        { name: "Energetics", description: "Enthalpy changes, Hess's law, bond energies", difficulty: "hard", sort_order: 5 },
        { name: "Reaction Kinetics", description: "Collision theory, activation energy, catalysts, rates", difficulty: "medium", sort_order: 6 },
        { name: "Equilibrium", description: "Le Chatelier's principle, Kc and Haber/Contact process", difficulty: "hard", sort_order: 7 },
        { name: "Acids, Bases and Salts", description: "Strong/weak acids, buffer solutions, pH calculations", difficulty: "hard", sort_order: 8 },
        { name: "Periodic Table and Elements", description: "Group properties, transition metals, extraction of metals", difficulty: "medium", sort_order: 9 },
        { name: "Organic Chemistry", description: "Hydrocarbons, functional groups, reactions and mechanisms", difficulty: "hard", sort_order: 10 },
        { name: "Air and Water", description: "Composition of air, water treatment, pollutants", difficulty: "easy", sort_order: 11 },
      ],
      biology: [
        { name: "Cell Structure and Division", description: "Organelles, mitosis, meiosis and stem cells", difficulty: "medium", sort_order: 1 },
        { name: "Biological Molecules and Enzymes", description: "Macromolecules, enzyme kinetics and inhibition", difficulty: "hard", sort_order: 2 },
        { name: "Plant Nutrition and Gas Exchange", description: "Photosynthesis, leaf structure, transpiration", difficulty: "medium", sort_order: 3 },
        { name: "Human Nutrition", description: "Nutrients, digestion, absorption and malnutrition", difficulty: "medium", sort_order: 4 },
        { name: "Transport in Humans", description: "Heart, blood vessels, blood composition and immune system", difficulty: "hard", sort_order: 5 },
        { name: "Excretion and Homeostasis", description: "Kidney function, osmoregulation, thermoregulation", difficulty: "hard", sort_order: 6 },
        { name: "Coordination and Response", description: "Nervous system, hormones, sense organs, reflex arcs", difficulty: "hard", sort_order: 7 },
        { name: "Reproduction", description: "Menstrual cycle, fertilisation, development and birth", difficulty: "medium", sort_order: 8 },
        { name: "Inheritance and Genetics", description: "DNA, genes, monohybrid cross, sex-linkage, mutations", difficulty: "hard", sort_order: 9 },
        { name: "Natural Selection and Evolution", description: "Darwin's theory, adaptation, speciation", difficulty: "medium", sort_order: 10 },
        { name: "Organisms and the Environment", description: "Ecosystems, food chains, carbon cycle, biodiversity", difficulty: "medium", sort_order: 11 },
      ],
      english: [
        { name: "Reading — Information Retrieval", description: "Selecting relevant facts and implicit meaning from complex texts", difficulty: "medium", sort_order: 1 },
        { name: "Reading — Language and Effect", description: "Analysing how writers use language to influence readers", difficulty: "hard", sort_order: 2 },
        { name: "Summary Writing", description: "Synthesising information from multiple sources concisely", difficulty: "hard", sort_order: 3 },
        { name: "Directed Writing", description: "Letters, articles, speeches and reports in the correct register", difficulty: "hard", sort_order: 4 },
        { name: "Narrative Writing", description: "Short stories with developed characters and structure", difficulty: "hard", sort_order: 5 },
        { name: "Descriptive Writing", description: "Vivid, detailed description of scenes and people", difficulty: "medium", sort_order: 6 },
      ],
      computer: [
        { name: "Data Representation", description: "Binary, hex, ASCII, Unicode, images, sound and compression", difficulty: "medium", sort_order: 1 },
        { name: "Communication and Internet", description: "Protocols, TCP/IP, HTTP, HTTPS, DNS and security", difficulty: "medium", sort_order: 2 },
        { name: "Hardware", description: "CPU architecture, fetch-decode-execute, memory and storage", difficulty: "hard", sort_order: 3 },
        { name: "Software and OS", description: "OS functions, applications, translators and interfaces", difficulty: "medium", sort_order: 4 },
        { name: "Security and Ethics", description: "Encryption, hacking, authentication, copyright and privacy", difficulty: "medium", sort_order: 5 },
        { name: "Algorithm Design", description: "Pseudocode, trace tables, searching, sorting algorithms", difficulty: "hard", sort_order: 6 },
        { name: "Programming", description: "Variables, arrays, subroutines, OOP and file handling", difficulty: "hard", sort_order: 7 },
        { name: "Database and SQL", description: "Relational databases, SQL queries and normalisation", difficulty: "hard", sort_order: 8 },
        { name: "Boolean Logic", description: "Logic gates, truth tables, simplification and logic circuits", difficulty: "very_hard", sort_order: 9 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FSc  (Pakistan Intermediate, Grades 11–12)
  // ─────────────────────────────────────────────────────────────────────
  fsc: {
    "11": {
      math: [
        { name: "Number System", description: "Real, complex numbers and their properties", difficulty: "medium", sort_order: 1 },
        { name: "Sets, Functions and Groups", description: "Set operations, relations, types of functions and groups", difficulty: "hard", sort_order: 2 },
        { name: "Matrices and Determinants", description: "Operations, inverse, Cramer's rule, system of equations", difficulty: "hard", sort_order: 3 },
        { name: "Quadratic Equations", description: "Roots, discriminant, nature of roots and symmetric functions", difficulty: "medium", sort_order: 4 },
        { name: "Partial Fractions", description: "Resolving into partial fractions for all cases", difficulty: "medium", sort_order: 5 },
        { name: "Sequences and Series", description: "AP, GP, HP, sum to n terms and infinite series", difficulty: "hard", sort_order: 6 },
        { name: "Permutation, Combination and Probability", description: "Counting methods and classical probability", difficulty: "hard", sort_order: 7 },
        { name: "Mathematical Induction and Binomial Theorem", description: "Proofs by induction and binomial expansion", difficulty: "hard", sort_order: 8 },
        { name: "Fundamentals of Trigonometry", description: "Angle measurement, circular functions and identities", difficulty: "medium", sort_order: 9 },
        { name: "Trigonometric Identities", description: "Compound, double-angle and half-angle formulae", difficulty: "hard", sort_order: 10 },
        { name: "Trigonometric Functions and Graphs", description: "Graphs of sin, cos, tan and their transformations", difficulty: "hard", sort_order: 11 },
        { name: "Application of Trigonometry", description: "Sine rule, cosine rule and area of triangle", difficulty: "hard", sort_order: 12 },
        { name: "Inverse Trigonometric Functions", description: "Domain, range and graphs of inverse trig functions", difficulty: "very_hard", sort_order: 13 },
        { name: "Solutions of Trigonometric Equations", description: "General solutions and equations in restricted domains", difficulty: "very_hard", sort_order: 14 },
      ],
      physics: [
        { name: "Measurements", description: "Physical quantities, SI units, errors, significant figures", difficulty: "easy", sort_order: 1 },
        { name: "Vectors and Equilibrium", description: "Vector operations, resolution, torque and equilibrium", difficulty: "hard", sort_order: 2 },
        { name: "Motion and Force", description: "Kinematics, Newton's laws, friction, projectile motion", difficulty: "hard", sort_order: 3 },
        { name: "Work and Energy", description: "Work, KE, PE, conservative forces, power and efficiency", difficulty: "medium", sort_order: 4 },
        { name: "Circular Motion", description: "Angular velocity, centripetal acceleration and gravitation", difficulty: "hard", sort_order: 5 },
        { name: "Fluid Dynamics", description: "Bernoulli's equation, Venturi meter and viscosity", difficulty: "hard", sort_order: 6 },
        { name: "Oscillations", description: "SHM, energy in SHM, pendulum and resonance", difficulty: "hard", sort_order: 7 },
        { name: "Waves", description: "Wave properties, superposition, standing waves", difficulty: "hard", sort_order: 8 },
        { name: "Physical Optics", description: "Interference, diffraction and polarisation", difficulty: "very_hard", sort_order: 9 },
        { name: "Optical Instruments", description: "Compound microscope, telescopes and resolving power", difficulty: "hard", sort_order: 10 },
        { name: "Heat and Thermodynamics", description: "Internal energy, first law, Carnot engine, entropy", difficulty: "very_hard", sort_order: 11 },
      ],
      chemistry: [
        { name: "Basic Concepts", description: "Mole concept, stoichiometry, percentage yield, limiting reagent", difficulty: "medium", sort_order: 1 },
        { name: "Experimental Techniques", description: "Chromatography, filtration, crystallisation, distillation", difficulty: "easy", sort_order: 2 },
        { name: "Gases", description: "Gas laws, ideal gas equation, kinetic molecular theory, real gases", difficulty: "hard", sort_order: 3 },
        { name: "Liquids and Solids", description: "Intermolecular forces, liquid properties, crystal structures", difficulty: "hard", sort_order: 4 },
        { name: "Atomic Structure", description: "Quantum numbers, orbitals, electronic configuration, spectrum", difficulty: "hard", sort_order: 5 },
        { name: "Chemical Bonding", description: "Ionic, covalent, metallic, hybridisation and VSEPR", difficulty: "very_hard", sort_order: 6 },
        { name: "Thermochemistry", description: "Enthalpy, Hess's law, bond energies, heat of formation", difficulty: "hard", sort_order: 7 },
        { name: "Chemical Equilibrium", description: "Le Chatelier's principle, Kc, Kp, industrial applications", difficulty: "hard", sort_order: 8 },
        { name: "Solutions", description: "Molarity, molality, colligative properties, osmosis", difficulty: "hard", sort_order: 9 },
        { name: "Electrochemistry", description: "Galvanic cells, Nernst equation, electrolysis", difficulty: "very_hard", sort_order: 10 },
        { name: "Reaction Kinetics", description: "Rate expressions, order of reaction, Arrhenius equation", difficulty: "very_hard", sort_order: 11 },
      ],
      biology: [
        { name: "Introduction to Biology", description: "Branches, history, scientific method and bioinformatics", difficulty: "easy", sort_order: 1 },
        { name: "Biological Molecules", description: "Carbohydrates, lipids, proteins, nucleic acids and water", difficulty: "medium", sort_order: 2 },
        { name: "Enzymes", description: "Enzyme structure, kinetics, inhibitors and industrial uses", difficulty: "hard", sort_order: 3 },
        { name: "The Cell", description: "Prokaryotic/eukaryotic cells, organelles, cell membrane", difficulty: "medium", sort_order: 4 },
        { name: "Variety of Life", description: "Classification, five kingdoms and binomial nomenclature", difficulty: "medium", sort_order: 5 },
        { name: "Kingdom Prokaryotae", description: "Bacteria structure, types, reproduction and importance", difficulty: "medium", sort_order: 6 },
        { name: "Kingdom Protoctista", description: "Algae, amoeba, euglena and their features", difficulty: "medium", sort_order: 7 },
        { name: "Kingdom Fungi", description: "Fungal structure, reproduction and economic importance", difficulty: "medium", sort_order: 8 },
        { name: "Kingdom Plantae", description: "Plant divisions, alternation of generations, adaptations", difficulty: "hard", sort_order: 9 },
        { name: "Kingdom Animalia", description: "Animal phyla from Porifera to Chordata", difficulty: "hard", sort_order: 10 },
        { name: "Bioenergetics", description: "Photosynthesis (light/dark reactions), respiration (glycolysis, Krebs)", difficulty: "very_hard", sort_order: 11 },
        { name: "Nutrition", description: "Autotrophic/heterotrophic nutrition, human digestive enzymes", difficulty: "medium", sort_order: 12 },
      ],
      english: [
        { name: "Comprehension — Advanced", description: "Inferential questions, tone and author's purpose", difficulty: "hard", sort_order: 1 },
        { name: "Essay Writing", description: "Argumentative and analytical essays at higher level", difficulty: "hard", sort_order: 2 },
        { name: "Précis Writing", description: "Condensing a passage to one-third its length", difficulty: "hard", sort_order: 3 },
        { name: "Translation (Urdu to English)", description: "Translating passages from Urdu to English", difficulty: "hard", sort_order: 4 },
        { name: "Grammar — Advanced", description: "Conditional sentences, subjunctive mood and complex structures", difficulty: "hard", sort_order: 5 },
        { name: "Prose and Poetry Analysis", description: "Close reading of FSc prescribed literary texts", difficulty: "hard", sort_order: 6 },
      ],
      computer: [
        { name: "Introduction to Computing", description: "History, generations, types and applications of computers", difficulty: "easy", sort_order: 1 },
        { name: "Computer Hardware", description: "CPU, registers, buses, memory and I/O devices", difficulty: "medium", sort_order: 2 },
        { name: "Number Systems and Logic", description: "Binary, octal, hex, Boolean algebra, logic gates", difficulty: "hard", sort_order: 3 },
        { name: "Data and Information", description: "Data types, data representation, coding schemes", difficulty: "medium", sort_order: 4 },
        { name: "Operating Systems", description: "OS types, process management, memory management", difficulty: "medium", sort_order: 5 },
        { name: "Software Development", description: "Problem solving, algorithms, flowcharts, pseudocode", difficulty: "hard", sort_order: 6 },
        { name: "Programming in C++", description: "Variables, control structures, functions and arrays in C++", difficulty: "hard", sort_order: 7 },
        { name: "Networking and Internet", description: "Network topologies, protocols, internet services", difficulty: "medium", sort_order: 8 },
      ],
    },

    "12": {
      math: [
        { name: "Functions and Limits", description: "Limits, continuity, L'Hôpital's rule and algebraic functions", difficulty: "hard", sort_order: 1 },
        { name: "Differentiation", description: "Rules of differentiation, chain rule, implicit differentiation", difficulty: "hard", sort_order: 2 },
        { name: "Higher Order Derivatives and Applications", description: "Maxima/minima, curve sketching, related rates", difficulty: "very_hard", sort_order: 3 },
        { name: "Integration", description: "Indefinite integrals, standard forms and techniques", difficulty: "hard", sort_order: 4 },
        { name: "Definite Integration and Applications", description: "Area under curve, volume of revolution", difficulty: "very_hard", sort_order: 5 },
        { name: "Analytic Geometry", description: "Straight line, angle between lines, distance from a point", difficulty: "hard", sort_order: 6 },
        { name: "Linear Inequalities and Linear Programming", description: "Feasible region, objective function and optimisation", difficulty: "medium", sort_order: 7 },
        { name: "Conic Sections", description: "Circle, parabola, ellipse and hyperbola — equations and graphs", difficulty: "very_hard", sort_order: 8 },
        { name: "Vectors", description: "3D vectors, dot product, cross product and applications", difficulty: "very_hard", sort_order: 9 },
      ],
      physics: [
        { name: "Electrostatics", description: "Coulomb's law, electric field, flux, Gauss's law, potential", difficulty: "very_hard", sort_order: 1 },
        { name: "Current Electricity", description: "Kirchhoff's laws, Wheatstone bridge, potentiometer", difficulty: "hard", sort_order: 2 },
        { name: "Electromagnetism", description: "Ampere's law, solenoid, magnetic force, Hall effect", difficulty: "very_hard", sort_order: 3 },
        { name: "Electromagnetic Induction", description: "Faraday's law, Lenz's law, self and mutual inductance", difficulty: "very_hard", sort_order: 4 },
        { name: "Alternating Current", description: "RMS values, transformers, resonance and AC circuits", difficulty: "very_hard", sort_order: 5 },
        { name: "Physics of Solids", description: "Band theory, semiconductors, doping and applications", difficulty: "hard", sort_order: 6 },
        { name: "Electronics", description: "Diodes, transistors, op-amps and digital logic", difficulty: "very_hard", sort_order: 7 },
        { name: "Dawn of Modern Physics", description: "Photoelectric effect, Compton scattering, de Broglie waves", difficulty: "very_hard", sort_order: 8 },
        { name: "Atomic Spectra", description: "Bohr model, hydrogen spectrum, X-rays and lasers", difficulty: "very_hard", sort_order: 9 },
        { name: "Nuclear Physics", description: "Nuclear forces, radioactivity, fission, fusion and reactors", difficulty: "very_hard", sort_order: 10 },
      ],
      chemistry: [
        { name: "Periodic Classification and Trends", description: "Periodic law, atomic radius, ionisation energy, trends", difficulty: "medium", sort_order: 1 },
        { name: "s-Block Elements", description: "Alkali and alkaline earth metals — properties and reactions", difficulty: "medium", sort_order: 2 },
        { name: "p-Block Elements (Groups III–IV)", description: "Boron, carbon, silicon and their compounds", difficulty: "hard", sort_order: 3 },
        { name: "p-Block Elements (Groups V–VI)", description: "Nitrogen, phosphorus, oxygen, sulfur and compounds", difficulty: "hard", sort_order: 4 },
        { name: "Halogens and Noble Gases", description: "Group VII properties, HX acids, noble gas uses", difficulty: "medium", sort_order: 5 },
        { name: "Transition Elements", description: "d-block properties, coordination compounds, catalysis", difficulty: "very_hard", sort_order: 6 },
        { name: "Fundamental Organic Chemistry", description: "Nomenclature, isomerism, reaction mechanisms, induction", difficulty: "hard", sort_order: 7 },
        { name: "Aliphatic Hydrocarbons", description: "Alkanes, alkenes, alkynes — reactions and uses", difficulty: "hard", sort_order: 8 },
        { name: "Aromatic Hydrocarbons", description: "Benzene structure, electrophilic substitution", difficulty: "hard", sort_order: 9 },
        { name: "Alkyl Halides and Amines", description: "Nucleophilic substitution, elimination, amine properties", difficulty: "very_hard", sort_order: 10 },
        { name: "Alcohols, Phenols and Ethers", description: "Reactions and preparations of alcohols and phenols", difficulty: "hard", sort_order: 11 },
        { name: "Aldehydes and Ketones", description: "Nucleophilic addition reactions and preparations", difficulty: "hard", sort_order: 12 },
        { name: "Carboxylic Acids and Derivatives", description: "Esterification, saponification, acid derivatives", difficulty: "hard", sort_order: 13 },
        { name: "Macromolecules", description: "Polymers, carbohydrates, proteins and nucleic acids", difficulty: "hard", sort_order: 14 },
        { name: "Environmental Chemistry", description: "Air/water pollution, ozone layer, greenhouse effect", difficulty: "medium", sort_order: 15 },
      ],
      biology: [
        { name: "Gaseous Exchange", description: "Mechanisms in humans, plants, fish and insects", difficulty: "medium", sort_order: 1 },
        { name: "Transport", description: "Blood groups, clotting, lymphatic system, plant transport", difficulty: "hard", sort_order: 2 },
        { name: "Homeostasis", description: "Kidney structure, urine formation, osmoregulation, skin", difficulty: "hard", sort_order: 3 },
        { name: "Support and Movement", description: "Skeleton types, joints, sliding filament model", difficulty: "hard", sort_order: 4 },
        { name: "Coordination and Control", description: "Nervous system, CNS, PNS, endocrine system, hormones", difficulty: "very_hard", sort_order: 5 },
        { name: "Reproduction", description: "Human reproductive system, gametogenesis, development, birth", difficulty: "hard", sort_order: 6 },
        { name: "Growth and Development", description: "Plant and animal growth, metamorphosis", difficulty: "medium", sort_order: 7 },
        { name: "Chromosome and DNA", description: "DNA structure, replication and chromosome organisation", difficulty: "hard", sort_order: 8 },
        { name: "Cell Division", description: "Mitosis, meiosis, errors and significance", difficulty: "hard", sort_order: 9 },
        { name: "Genetics", description: "Mendelian genetics, linkage, mutation, genetic disorders", difficulty: "very_hard", sort_order: 10 },
        { name: "Biotechnology", description: "Recombinant DNA, PCR, cloning, genetic engineering", difficulty: "very_hard", sort_order: 11 },
        { name: "Evolution", description: "Evidence, Darwinism, neo-Darwinism, speciation", difficulty: "hard", sort_order: 12 },
        { name: "Ecosystem", description: "Energy flow, nutrient cycles, ecological succession", difficulty: "hard", sort_order: 13 },
        { name: "Man and His Environment", description: "Pollution, deforestation, conservation and biodiversity", difficulty: "medium", sort_order: 14 },
      ],
      english: [
        { name: "Comprehension — Critical Reading", description: "Critical analysis of unseen texts at advanced level", difficulty: "very_hard", sort_order: 1 },
        { name: "Essay — Argumentative", description: "Building and defending arguments with evidence", difficulty: "very_hard", sort_order: 2 },
        { name: "Précis and Summary", description: "Précis writing and synthesis from multiple sources", difficulty: "hard", sort_order: 3 },
        { name: "Translation and Paraphrase", description: "Urdu-to-English translation and paraphrasing", difficulty: "hard", sort_order: 4 },
        { name: "Prescribed Prose and Poetry", description: "Analysis of FSc Grade 12 literary texts", difficulty: "hard", sort_order: 5 },
        { name: "Grammar — Mastery", description: "All grammar structures tested in FSc board exams", difficulty: "hard", sort_order: 6 },
      ],
      computer: [
        { name: "Advanced Programming in C++", description: "Pointers, structures, classes and OOP in C++", difficulty: "very_hard", sort_order: 1 },
        { name: "Data Structures", description: "Arrays, stacks, queues, linked lists, trees", difficulty: "very_hard", sort_order: 2 },
        { name: "Database Management", description: "Relational databases, SQL, ER diagrams, normalisation", difficulty: "hard", sort_order: 3 },
        { name: "System Analysis and Design", description: "SDLC, DFDs, UML and project management", difficulty: "hard", sort_order: 4 },
        { name: "Multimedia and Animation", description: "Multimedia types, compression, animation tools", difficulty: "medium", sort_order: 5 },
        { name: "Artificial Intelligence Overview", description: "AI concepts, expert systems and machine learning intro", difficulty: "hard", sort_order: 6 },
        { name: "Information Security and Ethics", description: "Cyber laws, digital rights, security policies", difficulty: "medium", sort_order: 7 },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeGrade(grade: string): string {
  const match = grade.match(/\d+/);
  return match ? match[0]! : grade.trim();
}

export function normalizeCurriculum(curriculum: string, grade?: string): CurriculumKey {
  const g = grade ? Number(normalizeGrade(grade)) : NaN;
  const c = curriculum.toLowerCase();

  if (c.includes("matric") || c.includes("fsc") || c.includes("pakistan")) {
    if (!isNaN(g) && g >= 11) return "fsc";
    return "matric";
  }
  if (c.includes("igcse") || c.includes("o level") || c.includes("o-level") || c.includes("edexcel")) {
    return "igcse";
  }
  return "general";
}

export function getTopicsForStudent(
  subjectCode: string,
  grade: string,
  curriculum: string,
): SyllabusEntry[] | null {
  const gradeKey = normalizeGrade(grade);
  const currKey = normalizeCurriculum(curriculum, grade);
  const topics = SYLLABUS[currKey]?.[gradeKey]?.[subjectCode];
  return topics && topics.length > 0 ? topics : null;
}
