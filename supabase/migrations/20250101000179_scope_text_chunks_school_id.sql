-- text_chunks / book_images RLS predated school-scoped uploads
-- (20250101000129_school_content_uploads.sql added a nullable school_id
-- column but never updated these SELECT policies to filter by it — a
-- direct PostgREST query against either table bypassed the school
-- scoping and could read another school's uploaded content, even though
-- search_text_chunks/search_book_images were already correctly filtered).
-- Matches the existing "school_id is null or school_id = match_school_id"
-- pattern already used by those RPCs.

drop policy if exists text_chunks_authenticated_read on text_chunks;
drop policy if exists book_images_authenticated_read on book_images;

create policy text_chunks_authenticated_read on text_chunks
  for select using (
    auth.role() = 'authenticated'
    and (school_id is null or school_id = jwt_school_id())
  );

create policy book_images_authenticated_read on book_images
  for select using (
    auth.role() = 'authenticated'
    and (school_id is null or school_id = jwt_school_id())
  );
