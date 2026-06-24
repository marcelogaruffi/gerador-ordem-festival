const fs = require('fs');

const teachers = ['Sônia Pimenta', 'Roberto Cintra', 'Carlos Acosta'];

const classChoreoMap = [
  { cls: 'Grupo Coreográfico', choreo: 'REI DO SHOW' },
  { cls: 'Ballet Juvenil 5ª', choreo: 'BELA ADORMECIDA' },
  { cls: 'Baby Class Sábado 10h', choreo: 'LILO E STITCH' },
  { cls: 'Ballet Adulto I', choreo: 'SININHO / PETER PAN' },
  { cls: 'Ballet Infantil Sábado', choreo: 'PANTERA COR-DE-ROSA' },
  { cls: 'Ballet Juvenil Sábado', choreo: 'BRANCA DE NEVE' },
  { cls: 'Baby Class 3ª e Sábado 11h', choreo: 'MAÇÃS' },
  { cls: 'Ballet Adulto II', choreo: 'RAINHA MÁ' },
  { cls: 'Ballet Infantil 4ª', choreo: 'TOY STORY' },
  { cls: 'Solo Neto', choreo: 'WOODY' },
  { cls: 'Sapateado Infantil', choreo: 'TOY STORY' },
  { cls: 'Contemporâneo Intermediário', choreo: 'ALICE NO PAÍS DAS MARAVILHAS' },
  { cls: 'Street Iniciante', choreo: 'SE ELA DANÇA, EU DANÇO' },
  { cls: 'Jazz Juvenil 3ª', choreo: 'HIGH SCHOOL MUSICAL' },
  { cls: 'Street Juvenil', choreo: 'HIGH SCHOOL MUSICAL' },
  { cls: 'Solo Marcelo', choreo: 'APENAS UMA VEZ' },
  { cls: 'Contemporâneo Iniciante', choreo: 'COMO SE FOSSE A PRIMEIRA VEZ' },
  { cls: 'Funk', choreo: 'SUPER MARIO BROS' },
  { cls: 'Sapateado Juvenil', choreo: 'ROCKY BALBOA' },
  { cls: 'Ritmos', choreo: 'XUXA REQUEBRA' },
  { cls: 'Kpop Intermediário', choreo: 'GUERREIRAS KPOP' },
  { cls: 'Kpop Iniciante', choreo: 'GUERREIRAS KPOP' },
  { cls: 'Stiletto Intermediário', choreo: 'ABRACADABRA' },
  { cls: 'Sapateado Adulto', choreo: 'CHUCKY' },
  { cls: 'Duo Matheus/Beatriz', choreo: 'CAVEIRAS' },
  { cls: 'Stiletto Iniciante', choreo: 'CORINGA' },
  { cls: 'Jazz Juvenil Sábado', choreo: 'CORALINE' },
  { cls: 'Solo Isabellha', choreo: 'WANDINHA' },
  { cls: 'Street Avançado', choreo: 'PÂNICO' }
];

const firstNames = ['Ana', 'Maria', 'João', 'Pedro', 'Lucas', 'Beatriz', 'Mariana', 'Julia', 'Clara', 'Fernanda', 'Rafael', 'Diego', 'Thiago', 'Letícia', 'Sofia', 'Alice', 'Arthur', 'Miguel', 'Luiza', 'Isabella', 'Laura', 'Gabriel', 'Enzo', 'Valentina', 'Helena', 'Manuela', 'Lorenzo', 'Theo', 'Samuel', 'Cauã', 'Vinícius', 'Eduardo', 'Guilherme', 'Matheus', 'Felipe', 'Gustavo', 'Caio', 'Daniel', 'Bruno', 'Marcelo', 'Isabellha', 'Neto'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'];

function randomName() {
  return firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
}

const dancers = Array.from({length: 80}, () => randomName());

// Ensure Neto, Marcelo, Isabellha, Matheus and Beatriz exist for solos/duos
dancers[0] = 'Neto ' + lastNames[Math.floor(Math.random() * lastNames.length)];
dancers[1] = 'Marcelo ' + lastNames[Math.floor(Math.random() * lastNames.length)];
dancers[2] = 'Isabellha ' + lastNames[Math.floor(Math.random() * lastNames.length)];
dancers[3] = 'Matheus ' + lastNames[Math.floor(Math.random() * lastNames.length)];
dancers[4] = 'Beatriz ' + lastNames[Math.floor(Math.random() * lastNames.length)];

// Extract unique classes and choreographies
const uniqueClasses = [...new Set(classChoreoMap.map(c => c.cls))];
const uniqueChoreos = [...new Set(classChoreoMap.map(c => c.choreo))];

let sql = `DO $$
DECLARE
`;

teachers.forEach((t, i) => sql += `  t_${i} uuid;\n`);
uniqueClasses.forEach((c, i) => sql += `  c_${i} uuid;\n`);
dancers.forEach((d, i) => sql += `  d_${i} uuid;\n`);
uniqueChoreos.forEach((ch, i) => sql += `  ch_${i} uuid;\n`);

sql += `BEGIN
  -- Teachers
`;
teachers.forEach((t, i) => {
  sql += `  INSERT INTO public.teachers (name) VALUES ('${t}') RETURNING id INTO t_${i};\n`;
});

sql += `\n  -- Classes\n`;
uniqueClasses.forEach((c, i) => {
  const teacherVar = `t_${Math.floor(Math.random() * teachers.length)}`;
  sql += `  INSERT INTO public.classes (teacher_id, modality) VALUES (${teacherVar}, '${c}') RETURNING id INTO c_${i};\n`;
});

sql += `\n  -- Dancers\n`;
dancers.forEach((d, i) => {
  sql += `  INSERT INTO public.dancers (name) VALUES ('${d}') RETURNING id INTO d_${i};\n`;
});

sql += `\n  -- Dancer Classes (Random assignment)\n`;
dancers.forEach((d, i) => {
  // Specific assignments for solos
  if (d.startsWith('Neto')) {
    sql += `  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_${i}, c_${uniqueClasses.indexOf('Solo Neto')});\n`;
  } else if (d.startsWith('Marcelo')) {
    sql += `  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_${i}, c_${uniqueClasses.indexOf('Solo Marcelo')});\n`;
  } else if (d.startsWith('Isabellha')) {
    sql += `  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_${i}, c_${uniqueClasses.indexOf('Solo Isabellha')});\n`;
  } else if (d.startsWith('Matheus') || d.startsWith('Beatriz')) {
    sql += `  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_${i}, c_${uniqueClasses.indexOf('Duo Matheus/Beatriz')});\n`;
  } else {
    // Each dancer in 1 to 3 classes
    const numClasses = Math.floor(Math.random() * 3) + 1;
    const classesForDancer = [];
    while(classesForDancer.length < numClasses) {
      const classIdx = Math.floor(Math.random() * uniqueClasses.length);
      if (!classesForDancer.includes(classIdx) && !uniqueClasses[classIdx].includes('Solo') && !uniqueClasses[classIdx].includes('Duo')) {
        classesForDancer.push(classIdx);
        sql += `  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_${i}, c_${classIdx});\n`;
      }
    }
  }
});

sql += `\n  -- Choreographies\n`;
uniqueChoreos.forEach((ch, i) => {
  // Random duration between 02:00 and 05:00
  const duration = `0${Math.floor(Math.random() * 4) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
  sql += `  INSERT INTO public.choreographies (name, duration) VALUES ('${ch}', '${duration}') RETURNING id INTO ch_${i};\n`;
});

sql += `\n  -- Choreography Classes\n`;
classChoreoMap.forEach(mapping => {
  const cIdx = uniqueClasses.indexOf(mapping.cls);
  const chIdx = uniqueChoreos.indexOf(mapping.choreo);
  sql += `  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_${chIdx}, c_${cIdx});\n`;
});

sql += `\n  -- Choreography Dancers (Pulling from classes automatically for realistic mock)\n`;
classChoreoMap.forEach(mapping => {
  const cIdx = uniqueClasses.indexOf(mapping.cls);
  const chIdx = uniqueChoreos.indexOf(mapping.choreo);
  
  // To mock pull classes, we just INSERT into choreography_dancers directly from dancer_classes
  sql += `  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_${chIdx}, dancer_id FROM public.dancer_classes WHERE class_id = c_${cIdx}
            ON CONFLICT DO NOTHING;\n`;
});

sql += `END $$;`;

fs.writeFileSync('mock_data.sql', sql);
