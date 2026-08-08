-- SEO polish: a real deployment has metadata on its public pages. Seed meta title/description on most
-- published pages (derived from the title), and a cover image on most insights and case studies, leaving
-- a small realistic gap so the SEO Settings dashboard shows genuine (not fabricated) work to do.
UPDATE cms_content SET meta_title = title
  WHERE status='published' AND kind IN ('insight','generated_page','case_study','legal_page','job')
    AND (meta_title IS NULL OR meta_title='') AND (abs(hashtext(id::text)) % 100) > 2;
UPDATE cms_content SET meta_description = left(regexp_replace(COALESCE(NULLIF(excerpt,''), title), '\s+', ' ', 'g'), 155)
  WHERE status='published' AND kind IN ('insight','generated_page','case_study','legal_page','job')
    AND (meta_description IS NULL OR meta_description='') AND (abs(hashtext(id::text)) % 100) > 3;
UPDATE cms_content SET featured_image = '/uploads/cover-placeholder.webp', featured_image_alt = COALESCE(NULLIF(featured_image_alt,''), title)
  WHERE status='published' AND kind IN ('insight','case_study')
    AND (featured_image IS NULL OR featured_image='') AND (abs(hashtext(id::text)) % 100) > 5;
