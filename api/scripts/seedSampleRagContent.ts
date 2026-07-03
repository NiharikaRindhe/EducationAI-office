/** One-off: seeds a couple of text_chunks with real embeddings, to test RAG retrieval without running the full ingestion pipeline. */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { embedText } from '../src/lib/ollama.js';

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const chunks = [
    {
      class_num: 7,
      subject: 'Science',
      book_title: 'NCERT Science Class 7',
      chapter_num: 1,
      chapter_title: 'Nutrition in Plants',
      page_num: 3,
      content:
        'Plants prepare their own food through a process called photosynthesis. Chlorophyll, the green pigment present in leaves, absorbs sunlight. This energy is used to combine carbon dioxide from the air and water from the soil to produce glucose and release oxygen. The process can be summarized as: carbon dioxide + water + sunlight -> glucose + oxygen, in the presence of chlorophyll.',
    },
    {
      class_num: 7,
      subject: 'Science',
      book_title: 'NCERT Science Class 7',
      chapter_num: 1,
      chapter_title: 'Nutrition in Plants',
      page_num: 5,
      content:
        'Some plants cannot prepare their own food and depend on other organisms. Insectivorous plants like the pitcher plant trap and digest insects to get nitrogen, since the soil they grow in is nitrogen-deficient. Parasitic plants like Cuscuta (amarbel) take nutrients directly from a host plant.',
    },
  ];

  for (const chunk of chunks) {
    const embedding = await embedText(chunk.content);
    const { error } = await supabase.from('text_chunks').insert({ ...chunk, embedding });
    if (error) throw error;
    console.log(`Inserted: ${chunk.chapter_title} (pg ${chunk.page_num})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
