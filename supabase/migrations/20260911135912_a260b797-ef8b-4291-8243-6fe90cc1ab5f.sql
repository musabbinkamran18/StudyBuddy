            
            INSERT INTO public.subjects (code, name, description, icon, color, sort_order) VALUES
            ('math','Mathematics','Numbers, algebra, geometry and problem solving','Sigma','#2dd4bf',1),
            ('physics','Physics','Motion, energy, waves and electricity','Atom','#60a5fa',2),
            ('chemistry','Chemistry','Elements, reactions and the periodic table','FlaskConical','#f472b6',3),
            ('biology','Biology','Cells, human body, plants and ecosystems','Leaf','#4ade80',4),
            ('english','English','Grammar, comprehension and writing','BookOpen','#fbbf24',5),
            ('computer','Computer Science','Programming, logic and digital systems','Cpu','#a78bfa',6),
            ('science','General Science','Everyday science across disciplines','Microscope','#38bdf8',7),
            ('islamiyat','Islamiyat','Islamic studies and history','Moon','#34d399',8),
            ('urdu','Urdu','Urdu language, grammar and literature','Languages','#fb923c',9),
            ('social','Social Studies','History, geography and civics','Globe','#f87171',10)
            ON CONFLICT (code) DO NOTHING;
