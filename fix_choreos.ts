import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlklbtvljdrmwdrhlyiw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsa2xidHZsamRybXdkcmhseWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTA3MDgsImV4cCI6MjA5Nzc2NjcwOH0.oybHZiicPyVU7XGNRSVW3y-Hool2NGZ6BQ15-gKBxOg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log('Buscando turmas...');
  const { data: classes, error: err1 } = await supabase.from('classes').select('*');
  if (err1) throw err1;

  // Busca qual o festival atual (pega o primeiro criado para adicionar na timeline)
  const { data: festivals } = await supabase.from('festivals').select('id').order('created_at').limit(1);
  const festivalId = festivals?.[0]?.id;

  for (const cls of classes) {
    const name = cls.class_code || cls.modality;
    if (!name) continue;
    console.log('Processando turma:', name);

    // Verifica se ja existe coreografia
    let { data: choreo } = await supabase.from('choreographies').select('id').eq('name', name).maybeSingle();
    
    let choreoId;
    if (!choreo) {
      const { data: newChoreo, error: err2 } = await supabase.from('choreographies').insert({
        name: name,
        style: cls.modality || 'Geral',
        duration: '00:00'
      }).select().single();
      if (err2) {
        console.error('Erro ao criar coreografia', err2);
        continue;
      }
      choreoId = newChoreo.id;
    } else {
      choreoId = choreo.id;
    }

    // Link choreo <-> class
    const { data: linkExist } = await supabase.from('choreography_classes').select('id').eq('choreography_id', choreoId).eq('class_id', cls.id).maybeSingle();
    if (!linkExist) {
      await supabase.from('choreography_classes').insert({ choreography_id: choreoId, class_id: cls.id });
    }

    // Link dancers
    const { data: dancers } = await supabase.from('dancer_classes').select('dancer_id').eq('class_id', cls.id);
    if (dancers && dancers.length > 0) {
      for (const d of dancers) {
        const { data: cDancer } = await supabase.from('choreography_dancers')
          .select('dancer_id')
          .eq('choreography_id', choreoId)
          .eq('dancer_id', d.dancer_id)
          .maybeSingle();
        if (!cDancer) {
          await supabase.from('choreography_dancers').insert({ choreography_id: choreoId, dancer_id: d.dancer_id, is_exempt: false });
        }
      }
    }
    
    // Adiciona na timeline do festival atual se não estiver lá
    if (festivalId) {
      const { data: timelineExist } = await supabase.from('festival_choreographies')
        .select('id').eq('festival_id', festivalId).eq('choreography_id', choreoId).maybeSingle();
        
      if (!timelineExist) {
        // pega o proximo order_index
        const { data: lastItem } = await supabase.from('festival_choreographies')
          .select('order_index').eq('festival_id', festivalId).order('order_index', { ascending: false }).limit(1);
        const nextOrder = lastItem && lastItem.length > 0 ? (lastItem[0].order_index || 0) + 1 : 1;
        
        await supabase.from('festival_choreographies').insert({
          festival_id: festivalId,
          choreography_id: choreoId,
          order_index: nextOrder
        });
      }
    }
  }
  console.log('Feito!');
}
fix();
