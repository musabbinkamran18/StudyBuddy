-- Seed topics for the base subjects (Phase 2: Subjects & Topics UI).
-- Safe to re-run: removes and re-inserts the known topic slugs.

DELETE FROM public.topics USING public.subjects s
WHERE topics.subject_id = s.id
  AND s.code IN ('biology','chemistry','computer','english','islamiyat','math','physics','science','social','urdu');

INSERT INTO public.topics (subject_id, name, slug, description, grade, difficulty, sort_order)
SELECT s.id, v.name, v.slug, v.description, v.grade, v.difficulty::public.difficulty_level, v.sort_order
FROM (VALUES
    ('math','Numbers & Place Value','numbers','Whole numbers, place value, rounding, and number patterns.','Grade 1-10','easy',1),
    ('math','Fractions, Decimals & Percentages','fractions','Equivalent fractions, decimals, ratios, and percentages.','Grade 4-10','medium',2),
    ('math','Algebra','algebra','Expressions, equations, inequalities, and functions.','Grade 6-10','medium',3),
    ('math','Geometry','geometry','Shapes, angles, area, volume, and transformations.','Grade 4-10','medium',4),
    ('math','Measurement & Units','measurement','Metric units, conversion, perimeter, area, and time.','Grade 3-8','easy',5),
    ('math','Statistics & Probability','statistics','Data handling, averages, graphs, and chance.','Grade 6-10','hard',6),
    ('physics','Forces & Motion','forces-motion','Speed, velocity, acceleration, and Newton''s laws.','Grade 6-10','medium',1),
    ('physics','Work, Energy & Power','work-energy','Energy stores, work, power, and efficiency.','Grade 7-10','medium',2),
    ('physics','Waves & Sound','waves-sound','Wave properties, sound waves, and their applications.','Grade 8-10','medium',3),
    ('physics','Light & Optics','light-optics','Reflection, refraction, lenses, and the eye.','Grade 8-10','medium',4),
    ('physics','Electricity & Magnetism','electricity','Circuits, current, voltage, resistance, and magnets.','Grade 8-10','hard',5),
    ('physics','Heat & Temperature','heat','Thermal energy, heat transfer, and temperature scales.','Grade 6-9','easy',6),
    ('chemistry','States of Matter','states-of-matter','Solids, liquids, gases, and changes of state.','Grade 5-9','easy',1),
    ('chemistry','Atoms, Elements & Compounds','atoms-elements','Atomic structure, elements, and compounds.','Grade 6-10','medium',2),
    ('chemistry','Periodic Table','periodic-table','Groups, periods, metals, and non-metals.','Grade 7-10','medium',3),
    ('chemistry','Chemical Reactions','chemical-reactions','Equations, types of reactions, and rates of reaction.','Grade 8-10','hard',4),
    ('chemistry','Acids, Bases & Salts','acids-bases','pH, neutralisation, and salt formation.','Grade 7-10','medium',5),
    ('chemistry','Everyday Chemistry','everyday-chemistry','Chemistry in food, materials, and the environment.','Grade 6-10','easy',6),
    ('biology','Cells & the Microscope','cells','Cell structure, functions, and microscopy.','Grade 6-10','easy',1),
    ('biology','The Human Body','human-body','Organ systems, digestion, respiration, and circulation.','Grade 6-10','medium',2),
    ('biology','Plants & Photosynthesis','plants','Plant structures, photosynthesis, and transport.','Grade 5-9','medium',3),
    ('biology','Ecosystems & Environment','ecosystems','Food chains, habitats, and conservation.','Grade 5-9','easy',4),
    ('biology','Genetics & Inheritance','genetics','DNA, genes, traits, and heredity.','Grade 8-10','hard',5),
    ('biology','Health & Disease','health-disease','Pathogens, immunity, and healthy living.','Grade 7-10','medium',6),
    ('english','Grammar','grammar','Parts of speech, tenses, and sentence structure.','Grade 3-10','easy',1),
    ('english','Reading Comprehension','reading','Understanding, inferring, and responding to texts.','Grade 4-10','medium',2),
    ('english','Vocabulary & Spelling','vocabulary','New words, roots, homophones, and accurate spelling.','Grade 3-10','easy',3),
    ('english','Writing & Composition','writing','Essays, letters, stories, and persuasive writing.','Grade 4-10','medium',4),
    ('english','Poetry & Literature','poetry','Poems, plays, novels, and literary devices.','Grade 6-10','hard',5),
    ('english','Speaking & Listening','speaking','Pronunciation, discussion, and presentation skills.','Grade 3-8','easy',6),
    ('computer','Computers & Devices','computers','Hardware, software, and how computers work.','Grade 4-10','easy',1),
    ('computer','Logic & Algorithms','logic-algorithms','Sequences, decisions, loops, and problem solving.','Grade 5-10','medium',2),
    ('computer','Programming Basics','programming','Variables, input/output, and simple programs.','Grade 6-10','medium',3),
    ('computer','Digital Literacy','digital-literacy','Responsible and effective use of digital tools.','Grade 3-8','easy',4),
    ('computer','Data & Spreadsheets','data','Data organisation, charts, and spreadsheet skills.','Grade 6-10','medium',5),
    ('computer','Internet & Online Safety','internet-safety','Safer browsing, privacy, and cyber safety.','Grade 4-10','easy',6),
    ('science','Living Things','living-things','Characteristics and classification of life.','Grade 3-8','easy',1),
    ('science','Matter & Materials','matter-materials','States of matter and material properties.','Grade 3-8','easy',2),
    ('science','Forces in Action','forces-in-action','Pushes, pulls, gravity, and simple machines.','Grade 3-8','medium',3),
    ('science','Energy Everywhere','energy-everywhere','Energy forms, sources, and saving energy.','Grade 4-8','medium',4),
    ('science','Earth & Space','earth-space','The planet, the moon, and the solar system.','Grade 3-8','medium',5),
    ('science','Our Environment','environment','Weather, seasons, and looking after nature.','Grade 3-8','easy',6),
    ('islamiyat','Quranic Studies','quranic-studies','Selected surahs, verses, and their meanings.','Grade 1-10','easy',1),
    ('islamiyat','Hadith & Seerah','hadith-seerah','Key hadith and the life of the Prophet (PBUH).','Grade 4-10','medium',2),
    ('islamiyat','Aqeedah & Beliefs','aqeedah','Core Islamic beliefs and Articles of Faith.','Grade 3-10','medium',3),
    ('islamiyat','Worship & Practice','worship','Salah, fasting, Zakat, and Hajj.','Grade 4-10','medium',4),
    ('islamiyat','Islamic History','islamic-history','Key events, figures, and Islamic civilisation.','Grade 5-10','hard',5),
    ('islamiyat','Dua, Ethics & Values','dua-ethics','Essential duas and Islamic manners and values.','Grade 1-10','easy',6),
    ('urdu','Urdu Grammar','urdu-grammar','Ism, fail, harf and sentence structure.','Grade 3-10','medium',1),
    ('urdu','Reading & Comprehension','urdu-reading','Understanding and responding to Urdu texts.','Grade 3-10','medium',2),
    ('urdu','Composition & Writing','urdu-writing','Essays, letters, and paragraph writing.','Grade 4-10','hard',3),
    ('urdu','Vocabulary & Phrases','urdu-vocabulary','Building everyday Urdu vocabulary.','Grade 3-10','easy',4),
    ('urdu','Poetry','urdu-poetry','Nazm, ghazal, and literary appreciation.','Grade 6-10','hard',5),
    ('urdu','Urdu Worksheets','urdu-worksheets','Practical exercises and practice tasks.','Grade 1-8','easy',6),
    ('social','History','history','Civilisations, key events, and their impact.','Grade 3-10','medium',1),
    ('social','Geography','geography','Maps, landforms, climate, and countries.','Grade 3-10','medium',2),
    ('social','Civics & Citizenship','civics','Rights, responsibilities, and government.','Grade 5-10','medium',3),
    ('social','Economics Basics','economics','Needs vs wants, money, and markets.','Grade 6-10','hard',4),
    ('social','Cultures & Traditions','cultures','Diversity across Pakistan and the world.','Grade 3-8','easy',5),
    ('social','Current Affairs','current-affairs','Events shaping today''s world.','Grade 6-10','medium',6)
) AS v(subject_code, name, slug, description, grade, difficulty, sort_order)
JOIN public.subjects s ON s.code = v.subject_code;

NOTIFY pgrst, 'reload schema';
