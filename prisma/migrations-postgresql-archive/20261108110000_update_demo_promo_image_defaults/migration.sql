-- Replace only the exact bundled demo defaults. Owner-selected media URLs are
-- deliberately not matched or overwritten.
UPDATE "Banner"
SET "imageUrl" = '/images/promotional/agharas-hero-eyewear-1920.webp'
WHERE "position" = 'home'
  AND "key" = 'home-hero'
  AND "imageUrl" = '/images/stitch/boutique_en_ligne_haute_lunetterie-01.jpg';

UPDATE "Banner"
SET "imageUrl" = '/images/promotional/agharas-promo-eyewear-1200.webp'
WHERE "position" = 'home'
  AND "key" = 'home-promo'
  AND "imageUrl" IS NULL;

UPDATE "Category"
SET "imageUrl" = '/images/promotional/agharas-category-femme-960.webp',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'femme'
  AND "imageUrl" = '/images/stitch/boutique_en_ligne_haute_lunetterie-02.jpg';

UPDATE "Category"
SET "imageUrl" = '/images/promotional/agharas-category-homme-960.webp',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'homme'
  AND "imageUrl" = '/images/stitch/boutique_en_ligne_haute_lunetterie-03.jpg';

UPDATE "Category"
SET "imageUrl" = '/images/promotional/agharas-category-solaires-1600.webp',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'solaires'
  AND "imageUrl" = '/images/stitch/catalogue_recherche-05.jpg';

UPDATE "Category"
SET "imageUrl" = '/images/promotional/agharas-category-clips-960.webp',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'clips-2-en-1'
  AND "imageUrl" = '/images/stitch/boutique_en_ligne_haute_lunetterie-04.jpg';
