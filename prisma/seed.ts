/**
 * Données de démonstration AGHARAS VISION.
 *
 * Toutes les coordonnées, mentions légales et références d'entreprise sont des
 * PLACEHOLDERS explicites. Aucun avis client, aucune note et aucune donnée
 * médicale réelle ne sont insérés.
 *
 * Exécution : npm run db:seed
 */
import {
  PrismaClient,
  ProductType,
  Gender,
  FrameShape,
  LensKind,
  CouponType,
  InventoryReason,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();

const ROUNDS = 12;

const IMG = "/images/stitch";

function token(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

async function password(value: string) {
  return bcrypt.hash(value, ROUNDS);
}

type ProductSeed = {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  story: string;
  brand: string;
  category: string;
  type: ProductType;
  gender: Gender;
  material: string;
  shape: FrameShape;
  sku: string;
  priceCents: number;
  compareAtCents?: number;
  badge?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  lensCompatible?: boolean;
  weightGrams?: number;
  lensWidthMm?: number;
  bridgeMm?: number;
  templeLengthMm?: number;
  lensHeightMm?: number;
  totalWidthMm?: number;
  deliveryNote?: string;
  images: Array<{ file: string; alt: string }>;
  variants: Array<{
    colorName: string;
    colorHex: string;
    sku: string;
    stock: number;
  }>;
};

const PRODUCTS: ProductSeed[] = [
  {
    slug: "le-marais-n04-or-pur",
    name: "Le Marais N°04 — Or Pur",
    subtitle: "Titane ultra-léger 11 g • Forme Pantos",
    description:
      "Une silhouette Pantos intemporelle, dessinée pour les visages délicats et les amateurs de matière noble. Le placage ionique Or Pur 18 carats confère à la monture une brillance satinée qui résiste à l'oxydation et au temps. Ses 11 grammes s'effacent au profit du regard, sans point de compression sur les tempes ni sur l'arête nasale.",
    story:
      "Le Marais N°04 est née d'un dialogue entre l'atelier de titane et la tradition du façonnage à la main. Chaque paire est assemblée puis polie en plusieurs passes pour obtenir un tombé régulier et une charnière silencieuse. L'objectif n'est pas de faire remarquer la monture, mais de laisser toute la place à l'expression du visage.",
    brand: "Agharas Atelier",
    category: "femme",
    type: ProductType.OPTICAL,
    gender: Gender.MIXTE,
    material: "Or Pur 18k & titane brossé",
    shape: FrameShape.PANTOS,
    sku: "AV-MARAIS-04",
    priceCents: 185000,
    badge: "Édition Or",
    isFeatured: true,
    isBestseller: true,
    weightGrams: 11,
    lensWidthMm: 49,
    bridgeMm: 20,
    templeLengthMm: 145,
    lensHeightMm: 42,
    totalWidthMm: 138,
    deliveryNote: "Montage optique réalisé dans notre atelier sous 48 h ouvrées.",
    images: [
      {
        file: "fiche_produit_le_marais_n_04_or_pur-01.jpg",
        alt: "Le Marais N°04 Or Pur, monture Pantos en titane et placage or 18 carats",
      },
      {
        file: "fiche_produit_le_marais_n_04_or_pur-02.jpg",
        alt: "Le Marais N°04 Or Pur, profil de la branche et charnière dorée",
      },
      {
        file: "fiche_produit_le_marais_n_04_or_pur-03.jpg",
        alt: "Le Marais N°04 Or Pur, détail du nez et des plaquettes",
      },
      {
        file: "fiche_produit_le_marais_n_04_or_pur-04.jpg",
        alt: "Le Marais N°04 Or Pur, vue de dessus de la monture",
      },
      {
        file: "fiche_produit_le_marais_n_04_or_pur-05.jpg",
        alt: "Le Marais N°04 Or Pur, monture posée sur un fond clair",
      },
    ],
    variants: [
      { colorName: "Or Pur 18k & titane satiné", colorHex: "#CFB56A", sku: "AV-MARAIS-04-OR", stock: 4 },
      { colorName: "Titane brossé", colorHex: "#B9BEBC", sku: "AV-MARAIS-04-TI", stock: 3 },
      { colorName: "Noir profond", colorHex: "#1C1C1C", sku: "AV-MARAIS-04-NO", stock: 2 },
    ],
  },
  {
    slug: "l-hivernal-vert-emeraude",
    name: "L'Hivernal Vert Émeraude",
    subtitle: "Acétate biosourcé • Silhouette ronde",
    description:
      "Une ronde généreuse taillée dans un acétate biosourcé, polie à la main pendant plusieurs heures. Le vert émeraude profond est rehaussé de rivets dorés discrets. Une monture enveloppante qui convient aussi bien aux visages ronds qu'aux traits anguleux.",
    story:
      "L'Hivernal puise dans les teintes sombres des salons de lecture et dans la lumière des après-midi d'hiver. L'acétate est sélectionné pour sa densité et sa capacité à conserver une couleur franche sans transparence excessive. Les rivets sont posés un à un, à la main.",
    brand: "Atelier Acétate",
    category: "femme",
    type: ProductType.OPTICAL,
    gender: Gender.FEMME,
    material: "Acétate biosourcé, rivets dorés",
    shape: FrameShape.RONDE,
    sku: "AV-HIVERNAL-VE",
    priceCents: 210000,
    compareAtCents: 240000,
    badge: "Édition",
    isFeatured: true,
    weightGrams: 24,
    lensWidthMm: 47,
    bridgeMm: 22,
    templeLengthMm: 145,
    lensHeightMm: 44,
    totalWidthMm: 138,
    images: [
      {
        file: "fiche_produit_le_marais_n_04_or_pur-07.jpg",
        alt: "L'Hivernal Vert Émeraude, monture ronde en acétate vert et rivets dorés",
      },
      {
        file: "fiche_produit_le_marais_n_04_or_pur-03.jpg",
        alt: "L'Hivernal Vert Émeraude, vue de trois quarts",
      },
    ],
    variants: [
      { colorName: "Vert émeraude", colorHex: "#1F5F4B", sku: "AV-HIVERNAL-VE-EM", stock: 3 },
      { colorName: "Écaille blonde", colorHex: "#8B5E3C", sku: "AV-HIVERNAL-VE-EC", stock: 5 },
    ],
  },
  {
    slug: "titane-minimaliste-noir-mat",
    name: "Titane Minimaliste Noir Mat",
    subtitle: "Bêta-titane 9 g • Rectangulaire",
    description:
      "La géométrie la plus pure du vestiaire Agharas : un rectangle adouci, en bêta-titane noir mat, sans vis apparente. Neuf grammes seulement, une charnière sans ressort et des branches fines qui épousent la tête. Destinée à celles et ceux qui veulent oublier leur monture.",
    story:
      "Le dessin est parti d'une contrainte : supprimer tout ce qui n'est pas indispensable. Pas de plaquettes rapportées, pas de vis décorative, pas de logo apposé. Le bêta-titane permet de réduire l'épaisseur des branches sans sacrifier la solidité.",
    brand: "Atelier Titane",
    category: "homme",
    type: ProductType.OPTICAL,
    gender: Gender.HOMME,
    material: "Bêta-titane noir mat",
    shape: FrameShape.RECTANGULAIRE,
    sku: "AV-TITANE-NM",
    priceCents: 220000,
    isFeatured: true,
    isBestseller: true,
    weightGrams: 9,
    lensWidthMm: 52,
    bridgeMm: 18,
    templeLengthMm: 145,
    lensHeightMm: 36,
    totalWidthMm: 142,
    images: [
      {
        file: "fiche_produit_le_marais_n_04_or_pur-08.jpg",
        alt: "Titane Minimaliste Noir Mat, monture rectangulaire fine",
      },
      {
        file: "catalogue_recherche-02.jpg",
        alt: "Titane Minimaliste Noir Mat, détail de la branche",
      },
    ],
    variants: [
      { colorName: "Noir mat", colorHex: "#141414", sku: "AV-TITANE-NM-NO", stock: 6 },
      { colorName: "Gunmetal", colorHex: "#727878", sku: "AV-TITANE-NM-GU", stock: 4 },
    ],
  },
  {
    slug: "amalfi-translucide-champagne",
    name: "Amalfi Translucide Champagne",
    subtitle: "Acétate translucide • Forme papillon",
    description:
      "Un papillon doux, légèrement relevé aux tempes, taillé dans un acétate translucide couleur champagne. La transparence laisse deviner la lumière et allège visuellement le regard. Une monture de caractère, pensée pour les amateurs de détails discrets.",
    story:
      "Amalfi reprend les lignes des lunettes de soleil des années 1960, adoucies et retravaillées pour un usage optique quotidien. Le champagne translucide est obtenu par un mélange de pigments nacrés qui varie légèrement d'une pièce à l'autre : chaque monture est unique.",
    brand: "Atelier Acétate",
    category: "femme",
    type: ProductType.OPTICAL,
    gender: Gender.FEMME,
    material: "Acétate translucide nacré",
    shape: FrameShape.PAPILLON,
    sku: "AV-AMALFI-CH",
    priceCents: 195000,
    isNew: true,
    weightGrams: 22,
    lensWidthMm: 52,
    bridgeMm: 19,
    templeLengthMm: 145,
    lensHeightMm: 43,
    totalWidthMm: 141,
    images: [
      {
        file: "fiche_produit_le_marais_n_04_or_pur-09.jpg",
        alt: "Amalfi Translucide Champagne, monture papillon en acétate nacré",
      },
      {
        file: "catalogue_recherche-04.jpg",
        alt: "Amalfi Translucide Champagne, vue de face",
      },
    ],
    variants: [
      { colorName: "Champagne translucide", colorHex: "#D9C6A5", sku: "AV-AMALFI-CH-CH", stock: 5 },
      { colorName: "Rosé poudré", colorHex: "#D8A7A0", sku: "AV-AMALFI-CH-RO", stock: 2 },
    ],
  },
  {
    slug: "amalfi-solaire-havana-polar",
    name: "Amalfi Solaire Havana Polar",
    subtitle: "Verres polarisants • Protection UV400 catégorie 3",
    description:
      "La version solaire d'Amalfi, en acétate havane profond et verres polarisants catégorie 3. Le filtre UV400 protège des rayonnements tout en conservant un contraste naturel. Une monture de plein soleil qui reste élégante en ville.",
    story:
      "Les verres minéraux polarisants ont été choisis pour leur neutralité de teinte et leur résistance aux rayures. La monture havane est polie à la main pour révéler les veines de l'acétate. Livrée avec un étui rigide et un chiffon en microfibre.",
    brand: "Agharas Atelier",
    category: "solaires",
    type: ProductType.SUNGLASSES,
    gender: Gender.MIXTE,
    material: "Acétate havane, verres minéraux polarisants",
    shape: FrameShape.PANTOS,
    sku: "AV-AMALFI-SOL",
    priceCents: 195000,
    compareAtCents: 220000,
    badge: "Polarisé",
    isFeatured: true,
    lensCompatible: true,
    weightGrams: 27,
    lensWidthMm: 52,
    bridgeMm: 19,
    templeLengthMm: 145,
    lensHeightMm: 44,
    totalWidthMm: 141,
    deliveryNote: "Verres solaires polarisants inclus. Montage correcteur possible sur devis.",
    images: [
      {
        file: "fiche_produit_le_marais_n_04_or_pur-10.jpg",
        alt: "Amalfi Solaire Havana Polar, lunettes de soleil en acétate havane",
      },
      {
        file: "catalogue_recherche-05.jpg",
        alt: "Amalfi Solaire Havana Polar, vue de trois quarts",
      },
    ],
    variants: [
      { colorName: "Havana", colorHex: "#6B4A2F", sku: "AV-AMALFI-SOL-HA", stock: 4 },
      { colorName: "Noir", colorHex: "#151515", sku: "AV-AMALFI-SOL-NO", stock: 3 },
    ],
  },
  {
    slug: "silhouette-pure-pantos",
    name: "Silhouette Pure Pantos",
    subtitle: "Titane et acétate • Forme Pantos",
    description:
      "Un Pantos hybride qui associe une face en titane fin et des cerclages en acétate. Le contraste des matières donne une monture à la fois légère et présente. Les plaquettes réglables assurent un maintien précis sur les nez étroits.",
    story:
      "Silhouette Pure est le fruit d'un assemblage entre la face métallique et le cerclage acétate, réalisé à la main. Cette construction mixte permet d'obtenir la finesse du métal sans renoncer à la chaleur de l'acétate.",
    brand: "Agharas Atelier",
    category: "femme",
    type: ProductType.OPTICAL,
    gender: Gender.FEMME,
    material: "Titane et acétate",
    shape: FrameShape.PANTOS,
    sku: "AV-SILHOUETTE-PU",
    priceCents: 240000,
    badge: "Signature",
    isFeatured: true,
    isBestseller: true,
    weightGrams: 13,
    lensWidthMm: 50,
    bridgeMm: 20,
    templeLengthMm: 145,
    lensHeightMm: 43,
    totalWidthMm: 139,
    images: [
      {
        file: "fiche_produit_le_marais_n_04_or_pur-04.jpg",
        alt: "Silhouette Pure Pantos, monture mixte titane et acétate",
      },
      {
        file: "boutique_en_ligne_haute_lunetterie-05.jpg",
        alt: "Silhouette Pure Pantos, détail de la face",
      },
    ],
    variants: [
      { colorName: "Titane argenté", colorHex: "#C0C4C2", sku: "AV-SILHOUETTE-PU-AR", stock: 3 },
      { colorName: "Or rose", colorHex: "#C9A27E", sku: "AV-SILHOUETTE-PU-OR", stock: 2 },
    ],
  },
  {
    slug: "l-hivernal-ecaille-classique",
    name: "L'Hivernal Écaille Classique",
    subtitle: "Acétate écaille • Silhouette ronde",
    description:
      "La déclinaison écaille de L'Hivernal, dans un acétate ambré aux reflets chauds. La ronde classique traverse les saisons et les styles. Les branches larges assurent un bon équilibre sur le visage.",
    story:
      "L'écaille est un classique de la lunetterie, réinterprété ici dans une palette plus claire et plus lumineuse. Chaque plaque d'acétate est découpée puis polie pour faire ressortir les veines naturelles.",
    brand: "Atelier Acétate",
    category: "homme",
    type: ProductType.OPTICAL,
    gender: Gender.MIXTE,
    material: "Acétate écaille",
    shape: FrameShape.RONDE,
    sku: "AV-HIVERNAL-EC",
    priceCents: 210000,
    weightGrams: 25,
    lensWidthMm: 47,
    bridgeMm: 22,
    templeLengthMm: 145,
    lensHeightMm: 44,
    totalWidthMm: 138,
    images: [
      {
        file: "fiche_produit_le_marais_n_04_or_pur-05.jpg",
        alt: "L'Hivernal Écaille Classique, monture ronde en acétate ambré",
      },
      {
        file: "fiche_produit_le_marais_n_04_or_pur-07.jpg",
        alt: "L'Hivernal Écaille Classique, vue de profil",
      },
    ],
    variants: [
      { colorName: "Écaille classique", colorHex: "#7B4A2A", sku: "AV-HIVERNAL-EC-EC", stock: 4 },
      { colorName: "Miel clair", colorHex: "#C08B4F", sku: "AV-HIVERNAL-EC-MI", stock: 2 },
    ],
  },
  {
    slug: "urban-rectangulaire-ultra-thin",
    name: "Urban Rectangulaire Ultra-Thin",
    subtitle: "Titane ultra-fin • Rectangulaire",
    description:
      "Un rectangle contemporain aux branches très fines, pensé pour les journées urbaines. La face en titane est brossée à la main, les plaquettes sont en silicone médical. Une monture discrète qui structure le regard sans le masquer.",
    story:
      "Urban est née d'une observation : les montures rectangulaires sont souvent épaisses pour compenser la fragilité du métal. En utilisant du titane de section réduite, nous avons pu conserver une ligne fine et une solidité réelle.",
    brand: "Atelier Titane",
    category: "homme",
    type: ProductType.OPTICAL,
    gender: Gender.HOMME,
    material: "Titane brossé",
    shape: FrameShape.RECTANGULAIRE,
    sku: "AV-URBAN-RT",
    priceCents: 230000,
    isNew: true,
    weightGrams: 10,
    lensWidthMm: 54,
    bridgeMm: 17,
    templeLengthMm: 145,
    lensHeightMm: 34,
    totalWidthMm: 144,
    images: [
      {
        file: "catalogue_recherche-02.jpg",
        alt: "Urban Rectangulaire Ultra-Thin, monture rectangulaire en titane",
      },
      {
        file: "fiche_produit_le_marais_n_04_or_pur-08.jpg",
        alt: "Urban Rectangulaire Ultra-Thin, détail des branches",
      },
    ],
    variants: [
      { colorName: "Noir mat", colorHex: "#1A1A1A", sku: "AV-URBAN-RT-NO", stock: 5 },
      { colorName: "Bleu nuit", colorHex: "#1B2A41", sku: "AV-URBAN-RT-BL", stock: 3 },
    ],
  },
  {
    slug: "atelier-titane-decoupe",
    name: "Atelier Titane Découpé",
    subtitle: "Percée rimless • Titane 12 g",
    description:
      "Une monture percée entièrement découpée dans une plaque de titane, sans cerclage ni vis apparente. Les verres sont fixés par des attaches usinées. Le résultat est une ligne presque invisible, qui met le regard au premier plan.",
    story:
      "La découpe d'une monture percée demande une précision au dixième de millimètre. Chaque face est usinée puis finie à la main, avant le montage des verres. Cette pièce est produite en petite série dans notre atelier.",
    brand: "Atelier Titane",
    category: "homme",
    type: ProductType.OPTICAL,
    gender: Gender.HOMME,
    material: "Titane découpé",
    shape: FrameShape.PERCEE,
    sku: "AV-ATELIER-DEC",
    priceCents: 240000,
    badge: "Atelier",
    isFeatured: false,
    isBestseller: true,
    weightGrams: 12,
    lensWidthMm: 53,
    bridgeMm: 19,
    templeLengthMm: 145,
    lensHeightMm: 33,
    totalWidthMm: 143,
    images: [
      {
        file: "fiche_produit_le_marais_n_04_or_pur-06.jpg",
        alt: "Atelier Titane Découpé, monture percée en titane",
      },
      {
        file: "catalogue_recherche-02.jpg",
        alt: "Atelier Titane Découpé, vue de face",
      },
    ],
    variants: [
      { colorName: "Titane naturel", colorHex: "#BFC4C2", sku: "AV-ATELIER-DEC-TI", stock: 2 },
      { colorName: "Or brossé", colorHex: "#CFB56A", sku: "AV-ATELIER-DEC-OR", stock: 2 },
    ],
  },
  {
    slug: "clip-solaire-magnetique-2-en-1",
    name: "Clip Solaire Magnétique 2-en-1",
    subtitle: "Clip magnétique • Compatible montures Agharas",
    description:
      "Un clip solaire magnétique qui se fixe en un geste sur les montures compatibles de la maison. Verres polarisants catégorie 3, traitement anti-rayures. Livré dans un étui souple pour le transporter sans encombrement.",
    story:
      "Le clip 2-en-1 répond à un usage simple : passer de la vue au soleil sans changer de monture. Les aimants sont positionnés pour ne jamais toucher le verre correcteur. Vérifiez la compatibilité avec votre monture avant l'achat.",
    brand: "Agharas Atelier",
    category: "clips-2-en-1",
    type: ProductType.CLIP,
    gender: Gender.MIXTE,
    material: "Métal et verres polarisants",
    shape: FrameShape.AUTRE,
    sku: "AV-CLIP-MAG",
    priceCents: 95000,
    weightGrams: 6,
    deliveryNote: "Compatibilité à vérifier avec votre monture. Notre opticien peut vous conseiller.",
    images: [
      {
        file: "boutique_en_ligne_haute_lunetterie-04.jpg",
        alt: "Clip solaire magnétique 2-en-1 fixé sur une monture optique",
      },
    ],
    variants: [
      { colorName: "Or", colorHex: "#CFB56A", sku: "AV-CLIP-MAG-OR", stock: 8 },
      { colorName: "Argent", colorHex: "#C0C4C2", sku: "AV-CLIP-MAG-AR", stock: 6 },
    ],
  },
  {
    slug: "lentilles-journalieres-hd",
    name: "Lentilles Journalières HD",
    subtitle: "Boîte de 30 lentilles • Hydratation longue durée",
    description:
      "Lentilles souples journalières à renouvellement quotidien, en matériau silicone-hydrogel. Conçues pour un port confortable jusqu'à 12 heures. La boîte contient 30 lentilles stériles à usage unique.",
    story:
      "Nous sélectionnons des lentilles de démonstration auprès d'un fournisseur reconnu. Une ordonnance ophtalmologique récente est indispensable avant toute commande. Nos opticiens vérifient la compatibilité et accompagnent la première pose en salon.",
    brand: "Agharas Soin",
    category: "lentilles",
    type: ProductType.CONTACT_LENS,
    gender: Gender.MIXTE,
    material: "Silicone-hydrogel",
    shape: FrameShape.AUTRE,
    sku: "AV-LENTILLES-30",
    priceCents: 18000,
    lensCompatible: false,
    deliveryNote: "Sur présentation d'une ordonnance de lentilles en cours de validité.",
    images: [],
    variants: [
      { colorName: "Boîte de 30 — courbure 8,6", colorHex: "#8FBFD0", sku: "AV-LENTILLES-30-86", stock: 12 },
      { colorName: "Boîte de 30 — courbure 8,8", colorHex: "#6FA3B5", sku: "AV-LENTILLES-30-88", stock: 9 },
    ],
  },
  {
    slug: "etui-cuir-agharas",
    name: "Étui en Cuir Agharas",
    subtitle: "Cuir pleine fleur • Intérieur microfibre",
    description:
      "Un étui rigide en cuir pleine fleur, doublé de microfibre, pour protéger votre monture au quotidien. Fermeture à rabat aimanté, format compact. Disponible en cognac et en noir.",
    story:
      "L'étui est fabriqué dans un atelier marocain partenaire, à partir de chutes de cuir pleine fleur. Chaque pièce est cousue et finie à la main. Le grain évolue avec le temps et les usages.",
    brand: "Agharas Maison",
    category: "accessoires",
    type: ProductType.ACCESSORY,
    gender: Gender.MIXTE,
    material: "Cuir pleine fleur, microfibre",
    shape: FrameShape.AUTRE,
    sku: "AV-ETUI-CUIR",
    priceCents: 45000,
    lensCompatible: false,
    images: [],
    variants: [
      { colorName: "Cognac", colorHex: "#8B5A2B", sku: "AV-ETUI-CUIR-CO", stock: 15 },
      { colorName: "Noir", colorHex: "#1C1C1C", sku: "AV-ETUI-CUIR-NO", stock: 11 },
    ],
  },
];

const SETTINGS: Array<{ key: string; value: string; group: string; label: string }> = [
  { key: "store.name", value: "AGHARAS VISION", group: "general", label: "Nom de la maison" },
  { key: "store.logo_url", value: "/images/brand/agharass-vision-logo-header.webp", group: "general", label: "Logo de la maison" },
  { key: "store.legal_name", value: "Agharas Vision SARL AU — démonstration", group: "legal", label: "Raison sociale" },
  { key: "store.email", value: "contact@agharas-optique.ma", group: "contact", label: "E-mail de contact (placeholder)" },
  { key: "store.phone", value: "+212 5 22 00 00 00", group: "contact", label: "Téléphone (placeholder)" },
  { key: "store.whatsapp", value: "+212 628-889950", group: "contact", label: "WhatsApp officiel" },
  { key: "store.address", value: "N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR", group: "contact", label: "Adresse du magasin" },
  { key: "store.city", value: "Agadir", group: "contact", label: "Ville" },
  { key: "store.hours", value: "Lundi – Samedi : 09h30 – 19h30", group: "contact", label: "Horaires" },
  { key: "store.ice", value: "À RENSEIGNER (ICE)", group: "legal", label: "ICE" },
  { key: "store.rc", value: "À RENSEIGNER (RC)", group: "legal", label: "Registre de commerce" },
  { key: "store.if", value: "À RENSEIGNER (IF)", group: "legal", label: "Identifiant fiscal" },
  { key: "store.patente", value: "À RENSEIGNER (Patente)", group: "legal", label: "Patente" },
  { key: "store.cnss", value: "À RENSEIGNER (agrément CNSS/CNOPS)", group: "legal", label: "Agrément mutuelles" },
  { key: "store.cndp", value: "À RENSEIGNER (autorisation CNDP)", group: "legal", label: "Autorisation CNDP" },
  { key: "payment.cod_enabled", value: "true", group: "payment", label: "Paiement à la livraison" },
  { key: "payment.online_enabled", value: "false", group: "payment", label: "Paiement en ligne" },
  {
    key: "payment.online_notice",
    value: "Paiement en ligne indisponible : aucune passerelle CMI n'est configurée.",
    group: "payment",
    label: "Message paiement en ligne",
  },
  { key: "shipping.free_threshold", value: "80000", group: "shipping", label: "Seuil de livraison offerte (centimes)" },
  { key: "order.prescription_required", value: "false", group: "orders", label: "Ordonnance obligatoire" },
  {
    key: "order.confirmation_notice",
    value: "Notre équipe vous contacte par téléphone ou WhatsApp pour confirmer votre commande.",
    group: "orders",
    label: "Message de confirmation",
  },
  {
    key: "seo.default_title",
    value: "AGHARAS VISION | Optique au Maroc",
    group: "seo",
    label: "Titre SEO par défaut",
  },
  {
    key: "seo.default_description",
    value: "Montures d'exception, verres de précision et conseils d'opticiens diplômés au Maroc. Livraison soignée, garantie 2 ans.",
    group: "seo",
    label: "Description SEO par défaut",
  },
];

const FAQS = [
  {
    question: "Comment choisir la taille de ma monture ?",
    answer:
      "Chaque fiche produit indique le calibre (largeur du verre, pont, longueur des branches) et la largeur totale. Comparez ces mesures à une monture que vous portez déjà. En cas de doute, notre opticien peut vous conseiller par WhatsApp ou en salon.",
    category: "Montures & tailles",
  },
  {
    question: "Puis-je commander sans ordonnance ?",
    answer:
      "Vous pouvez commander une monture seule, avec des verres neutres. Pour des verres correcteurs, une ordonnance ophtalmologique récente est nécessaire. Vous pouvez la téléverser, la saisir manuellement, l'envoyer par WhatsApp ou la transmettre plus tard.",
    category: "Verres & ordonnances",
  },
  {
    question: "Comment mes ordonnances sont-elles conservées ?",
    answer:
      "Les ordonnances sont stockées dans un espace privé, hors du dossier public du site. L'accès est limité au client propriétaire et aux opticiens habilités. Vous pouvez demander la suppression de vos données en écrivant à notre service client.",
    category: "Verres & ordonnances",
  },
  {
    question: "Quels sont les délais de livraison ?",
    answer:
      "Les montures en stock partent sous 24 à 48 h ouvrées. Le montage des verres correcteurs ajoute généralement 2 à 4 jours ouvrés. Un coursier express est disponible à Casablanca et Rabat. Les délais sont confirmés par notre équipe.",
    category: "Livraison",
  },
  {
    question: "La livraison est-elle offerte ?",
    answer:
      "La livraison standard est offerte partout au Maroc dès 800 DH d'achat. En dessous de ce montant, les frais sont calculés au moment du paiement. Le retrait en salon est gratuit.",
    category: "Livraison",
  },
  {
    question: "Puis-je retourner ou échanger ma monture ?",
    answer:
      "Les montures non portées et dans leur emballage peuvent être retournées sous 30 jours. Les verres correcteurs taillés sur mesure ne sont ni repris ni échangés, sauf défaut de fabrication. Contactez notre service client avant tout retour.",
    category: "Retours & garanties",
  },
  {
    question: "Le paiement en ligne est-il disponible ?",
    answer:
      "Non. Seul le paiement à la livraison est actuellement proposé. Le paiement par carte en ligne (CMI) reste indisponible tant qu'aucune passerelle réelle n'est configurée. Aucun paiement n'est simulé sur ce site.",
    category: "Paiement",
  },
  {
    question: "Comment fonctionne la prise en charge mutuelle ?",
    answer:
      "Nous fournissons une facture et une feuille de soins pour vos démarches auprès de la CNSS, de la CNOPS ou de votre mutuelle privée. Les montants remboursés dépendent de votre contrat. Aucun remboursement n'est garanti par la maison.",
    category: "Mutuelles",
  },
  {
    question: "Puis-je essayer une monture à domicile ?",
    answer:
      "L'essai à domicile est proposé dans certaines villes, sur rendez-vous et selon disponibilité. Il concerne une sélection de montures. Contactez notre conciergerie pour vérifier votre éligibilité.",
    category: "Salons & essayage",
  },
  {
    question: "Comment suivre ma commande ?",
    answer:
      "Après validation, vous recevez une référence de commande. Si vous avez un compte, retrouvez son statut dans « Mon compte ». Un lien de suivi vous est également transmis par notre équipe dès l'expédition.",
    category: "Commandes",
  },
];

const CONTENT_PAGES = [
  {
    slug: "livraison",
    title: "Livraison & expédition",
    intro:
      "Notre maison expédie partout au Maroc, avec un soin particulier apporté à l'emballage et au montage optique.",
    body: `## Délais de préparation
Les montures en stock sont préparées sous 24 à 48 heures ouvrées. Lorsqu'une commande comprend des verres correcteurs, le montage en atelier ajoute généralement 2 à 4 jours ouvrés. Ces délais sont indicatifs et confirmés par notre équipe.

## Modes de livraison
- Livraison standard partout au Maroc : offerte dès 800 DH d'achat, sinon 40 DH.
- Coursier express Casablanca et Rabat : 70 DH, offert dès 1 500 DH.
- Retrait en salon : gratuit, sous réserve de confirmation.

## Suivi
Après expédition, notre équipe vous communique le transporteur et le numéro de suivi lorsque celui-ci est disponible. Vous pouvez également consulter le statut de votre commande depuis votre compte.

## Adresse de livraison
Nous livrons à l'adresse indiquée lors de la commande. Merci de vérifier le numéro de téléphone et les indications d'accès. En cas d'absence, le transporteur peut vous contacter pour convenir d'un nouveau passage.

## Zones desservies
Toutes les villes du Royaume sont desservies, sous réserve de la couverture du transporteur. Pour les zones enclavées, notre équipe vous contacte avant l'expédition.

> Les tarifs et délais affichés sont des paramètres de démonstration, modifiables depuis l'administration.`,
  },
  {
    slug: "retours",
    title: "Retours, échanges & garanties",
    intro:
      "Nous voulons que votre monture vous convienne parfaitement. Voici les règles applicables aux retours et à la garantie.",
    body: `## Délai de rétractation
Vous disposez de 30 jours à compter de la réception pour retourner une monture non portée, dans son emballage d'origine et avec ses accessoires. Les verres correcteurs taillés sur mesure ne sont pas éligibles, sauf défaut de fabrication.

## Procédure
Contactez notre service client en indiquant votre référence de commande. Nous vous communiquons l'adresse de retour et les instructions d'emballage. Les frais de retour sont à votre charge, sauf erreur de notre part.

## Garantie casse
Les montures bénéficient d'une garantie de deux ans contre les défauts de fabrication. La casse accidentelle n'est pas couverte par la garantie légale ; une solution commerciale peut être étudiée au cas par cas.

## Verres et adaptation
Une garantie d'adaptation de 30 jours est proposée sur les verres correcteurs, selon les conditions de l'atelier. Un contrôle optométrique peut être demandé avant tout échange.

## Remboursement
Après réception et contrôle du retour, le remboursement est effectué selon le mode de paiement initial. Le paiement à la livraison implique un remboursement par virement ou en salon, avec justificatif.`,
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    intro:
      "La protection de vos données, en particulier de vos ordonnances, est une priorité de la maison.",
    body: `## Données collectées
Nous collectons les données nécessaires au traitement de vos commandes : identité, coordonnées, adresse de livraison, historique de commandes et, le cas échéant, ordonnance ophtalmologique.

## Ordonnances
Les ordonnances sont conservées dans un stockage privé, hors du dossier public du site. L'accès est limité au client propriétaire et aux opticiens habilités. Les fichiers sont contrôlés à l'envoi (format et taille) et ne sont jamais servis par une URL publique.

## Finalités
Vos données servent à traiter vos commandes, assurer le suivi optique, répondre à vos demandes et, si vous y consentez, vous envoyer nos correspondances. Aucune donnée n'est revendue.

## Durée de conservation
Les données de commande sont conservées pendant la durée légale comptable. Les ordonnances sont conservées le temps nécessaire au suivi optique, puis supprimées sur demande ou selon la politique de rétention documentée.

## Vos droits
Vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à l'adresse de contact indiquée sur le site. Une réponse vous est apportée dans les délais applicables.

## Autorisation CNDP
La mention d'autorisation CNDP est un placeholder à compléter par le responsable de traitement. Aucune autorisation réelle n'est affirmée par cette démonstration.`,
  },
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    intro:
      "Les présentes conditions encadrent les ventes réalisées sur le site AGHARAS VISION.",
    body: `## Objet
Le site propose des montures optiques, des lunettes de soleil, des lentilles, des accessoires et des prestations de montage de verres.

## Prix
Les prix sont indiqués en dirhams marocains, toutes taxes comprises, hors frais de livraison. Les montants sont calculés côté serveur en centimes afin d'éviter les erreurs d'arrondi. Le prix affiché au moment de la validation de la commande fait foi.

## Commande
La commande est confirmée après vérification des informations et, le cas échéant, de l'ordonnance. Notre équipe peut vous contacter pour préciser un montage ou une adresse.

## Paiement
Le paiement à la livraison est le seul mode actif. Le paiement par carte en ligne est indisponible et n'est pas simulé. Aucun débit n'est effectué sur le site.

## Livraison
Les délais sont indicatifs. En cas de retard, notre service client vous informe et propose une solution.

## Rétractation et garanties
Les conditions de retour et de garantie sont décrites sur la page « Retours ». Les verres correcteurs taillés sur mesure sont exclus du droit de rétractation, sauf défaut.

## Responsabilité
Les informations optiques présentées sur le site ne remplacent pas un examen ophtalmologique. Aucune interprétation médicale automatique n'est réalisée.

## Droit applicable
Les présentes conditions sont soumises au droit marocain. Les mentions d'entreprise (ICE, RC, IF) sont des placeholders à compléter.`,
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    intro:
      "Informations relatives à l'éditeur du site et à l'hébergement. Les champs marqués « À RENSEIGNER » sont des placeholders.",
    body: `## Éditeur
Agharas Vision SARL AU — démonstration.
Nom commercial : AGHARAS VISION.
Adresse du magasin : N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR.
E-mail : contact@agharas-optique.ma (placeholder).
Téléphone : +212 5 22 00 00 00 (placeholder).

## Identification
ICE : À RENSEIGNER.
Registre de commerce : À RENSEIGNER.
Identifiant fiscal : À RENSEIGNER.
Patente : À RENSEIGNER.
Autorisation CNDP : À RENSEIGNER.

## Hébergement
Les informations d'hébergement doivent être complétées avant la mise en production. Aucun hébergeur réel n'est affirmé dans cette démonstration.

## Propriété intellectuelle
Les visuels et textes de démonstration sont fournis pour la maquette. Les marques et modèles cités restent la propriété de leurs titulaires. Le logo officiel fourni par le propriétaire est utilisé pour l'identité visuelle.

## Responsabilité
Les informations légales et les coordonnées doivent être vérifiées par le propriétaire avant toute exploitation commerciale.`,
  },
  {
    slug: "a-propos",
    title: "AGHARAS VISION",
    intro:
      "Une maison d'optique indépendante, dédiée à la lunetterie d'exception et à la précision réfractive.",
    body: `## Notre approche
Nous croyons qu'une monture doit d'abord servir le regard. Notre sélection privilégie les matériaux nobles, les charnières silencieuses et les formes qui traversent les saisons.

## L'atelier
Le montage des verres est réalisé dans notre atelier, selon les mesures relevées en salon. Chaque commande est contrôlée avant expédition.

## Notre présence
Retrouvez notre adresse de magasin à Agadir sur la page « Notre adresse ». Le site ne publie pas d'autre point de vente.

## Nos engagements
- Transparence des prix et des options de verres.
- Conservation privée des ordonnances.
- Accompagnement par des opticiens diplômés.
- Aucun avis client fictif, aucune notation inventée.

## Une maison en construction
Cette plateforme est une démonstration. Les coordonnées, mentions légales et visuels officiels doivent être complétés par le propriétaire avant toute mise en ligne commerciale.`,
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed de démonstration interdit en production.");
  const resetTest = process.argv.includes("--reset-test");
  if (resetTest) {
    const url = new URL(process.env.DATABASE_URL ?? "");
    const databases = await db.$queryRaw<Array<{ database: string | null }>>`SELECT DATABASE() AS database`;
    if (process.env.ALLOW_TEST_SEED_RESET !== "1" || databases[0]?.database !== "agharas_mariadb_test" ||
        !["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname) ||
        url.pathname !== "/agharas_mariadb_test") {
      throw new Error("Réinitialisation refusée : base MariaDB locale agharas_mariadb_test et ALLOW_TEST_SEED_RESET=1 requis.");
    }
  } else {
    // A normal seed may populate an empty database, but never clears or changes
    // existing records. Refuse early if any public application table has rows.
    const databases = await db.$queryRaw<Array<{ database: string | null }>>`SELECT DATABASE() AS database`;
    if (!databases[0]?.database) throw new Error("Base de données introuvable.");
    const tables = await db.$queryRaw<Array<{ name: string }>>`
      SELECT TABLE_NAME AS name FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME NOT IN ('_prisma_migrations', 'DatabaseMutex')`;
    for (const { name } of tables) {
      const quoted = `\`${name.replace(/`/g, "``")}\``;
      const rows = await db.$queryRawUnsafe<Array<{ row_exists: boolean }>>(`SELECT EXISTS (SELECT 1 FROM ${quoted} LIMIT 1) AS row_exists`);
      if (rows[0]?.row_exists) throw new Error("Seed refusé : la base contient déjà des données. Aucune suppression n'a été effectuée.");
    }
  }

  if ([process.env.SEED_ADMIN_PASSWORD, process.env.SEED_STAFF_PASSWORD, process.env.SEED_CUSTOMER_PASSWORD].some((value) => !value)) {
    throw new Error("Mots de passe de démonstration SEED_*_PASSWORD obligatoires avant toute suppression de données.");
  }

  if (resetTest) {
  console.log("→ Nettoyage de la base de test synthétique…");

  await db.auditLog.deleteMany();
  await db.contactMessage.deleteMany();
  await db.newsletterSubscriber.deleteMany();
  await db.couponRedemption.deleteMany();
  await db.payment.deleteMany();
  await db.shipment.deleteMany();
  await db.orderStatusHistory.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.prescription.deleteMany();
  await db.inventoryMovement.deleteMany();
  await db.inventoryItem.deleteMany();
  await db.opticalCompatibilityRule.deleteMany();
  await db.productVariant.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.lensType.deleteMany();
  await db.lensIndex.deleteMany();
  await db.lensTreatment.deleteMany();
  await db.shippingMethod.deleteMany();
  await db.coupon.deleteMany();
  await db.banner.deleteMany();
  await db.faqItem.deleteMany();
  await db.contentPage.deleteMany();
  await db.store.deleteMany();
  await db.setting.deleteMany();
  await db.session.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();
  await db.role.deleteMany();
  await db.category.deleteMany();
  await db.brand.deleteMany();
  }

  console.log("→ Rôles & utilisateurs…");

  const superAdminRole = await db.role.create({
    data: {
      name: "Super Administrateur",
      description: "Accès complet à toutes les fonctions et à tous les réglages.",
      permissions: ["*"],
      isSystem: true,
      isSuperAdmin: true,
    },
  });

  const managerRole = await db.role.create({
    data: {
      name: "Gérant de boutique",
      description:
        "Gestion du catalogue, des commandes, des clients et du contenu, hors rôles et utilisateurs.",
      permissions: [
        "dashboard.view",
        "products.*",
        "inventory.*",
        "orders.*",
        "customers.*",
        "prescriptions.*",
        "promotions.manage",
        "content.manage",
        "settings.manage",
      ],
      isSystem: true,
    },
  });

  const opticianRole = await db.role.create({
    data: {
      name: "Opticien",
      description:
        "Consultation du catalogue, des commandes, des clients et validation des ordonnances.",
      permissions: [
        "dashboard.view",
        "products.view",
        "inventory.view",
        "orders.view",
        "customers.view",
        "prescriptions.view",
        "prescriptions.review",
      ],
      isSystem: true,
    },
  });

  const customerRole = await db.role.create({
    data: {
      name: "Client",
      description: "Accès à l'espace client et aux commandes personnelles.",
      permissions: [],
      isSystem: true,
    },
  });

  // Local demo only; never embed passwords in source or print them in logs.
  const demoPasswords = [process.env.SEED_ADMIN_PASSWORD, process.env.SEED_STAFF_PASSWORD, process.env.SEED_CUSTOMER_PASSWORD];
  if (demoPasswords.some((value) => !value)) {
    throw new Error("SEED_ADMIN_PASSWORD, SEED_STAFF_PASSWORD et SEED_CUSTOMER_PASSWORD sont obligatoires.");
  }
  const [adminHash, staffHash, customerHash] = await Promise.all(demoPasswords.map((value) => password(value!)));
  if (!adminHash || !staffHash || !customerHash) throw new Error("Hachage des mots de passe incomplet.");

  const admin = await db.user.create({
    data: {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@agharas.local",
      passwordHash: adminHash,
      firstName: "Amine",
      lastName: "Agharas",
      phone: "+212522000000",
      roleId: superAdminRole.id,
    },
  });

  await db.user.create({
    data: {
      email: process.env.SEED_STAFF_EMAIL ?? "opticien@agharas.local",
      passwordHash: staffHash,
      firstName: "Salma",
      lastName: "Benali",
      phone: "+212661000000",
      roleId: opticianRole.id,
    },
  });

  const customer = await db.user.create({
    data: {
      email: process.env.SEED_CUSTOMER_EMAIL ?? "client@agharas.local",
      passwordHash: customerHash,
      firstName: "Yasmine",
      lastName: "El Amrani",
      phone: "+212661234567",
      roleId: customerRole.id,
      addresses: {
        create: [
          {
            label: "Domicile",
            firstName: "Yasmine",
            lastName: "El Amrani",
            phone: "+212661234567",
            line1: "12 Rue des Orangers",
            line2: "Appartement 4",
            city: "Casablanca",
            postalCode: "20000",
            isDefault: true,
          },
        ],
      },
    },
  });

  console.log("→ Catégories & marques…");

  const categories = await Promise.all(
    [
      { slug: "femme", name: "Femme", tagline: "Silhouettes & créateurs", imageUrl: "/images/promotional/agharas-femme.webp", sortOrder: 1 },
      { slug: "homme", name: "Homme", tagline: "Architecture & titane", imageUrl: "/images/promotional/agharas-homme.webp", sortOrder: 2 },
      { slug: "solaires", name: "Solaires", tagline: "Protection UV400", imageUrl: "/images/promotional/agharas-category-solaires-1600.webp", sortOrder: 3 },
      { slug: "clips-2-en-1", name: "Clips 2-en-1", tagline: "Vue & solaire", imageUrl: "/images/promotional/agharas-category-clips-960.webp", sortOrder: 4 },
      { slug: "lentilles", name: "Lentilles", tagline: "Journalières & mensuelles", imageUrl: null, sortOrder: 5 },
      { slug: "accessoires", name: "Accessoires", tagline: "Étuis cuir & chaînes", imageUrl: null, sortOrder: 6 },
    ].map((category) =>
      db.category.create({
        data: {
          ...category,
          description: `${category.name} — sélection d’AGHARAS VISION.`,
        },
      }),
    ),
  );

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const brandSeeds = [
    { slug: "agharas-atelier", name: "Agharas Atelier", description: "La ligne signature de la maison, dessinée et assemblée en petite série." },
    { slug: "atelier-titane", name: "Atelier Titane", description: "Montures techniques en titane, travaillées pour la légèreté et la solidité." },
    { slug: "atelier-acetate", name: "Atelier Acétate", description: "Acétate biosourcé, couleurs profondes et finitions polies à la main." },
    { slug: "agharas-soin", name: "Agharas Soin", description: "Lentilles et accessoires de soin sélectionnés pour la maison." },
    { slug: "agharas-maison", name: "Agharas Maison", description: "Objets et accessoires qui accompagnent la monture au quotidien." },
  ];

  const brands = await Promise.all(
    brandSeeds.map((brand, index) =>
      db.brand.create({ data: { ...brand, sortOrder: index + 1 } }),
    ),
  );
  const brandByName = new Map(brands.map((b) => [b.name, b]));

  console.log("→ Produits, variantes & stock…");

  const createdVariants = new Map<string, string>();

  for (const product of PRODUCTS) {
    const category = categoryBySlug.get(product.category);
    const brand = brandByName.get(product.brand);
    if (!category || !brand) {
      throw new Error(`Référentiel manquant pour ${product.slug}`);
    }

    const created = await db.product.create({
      data: {
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle,
        description: product.description,
        story: product.story,
        brandId: brand.id,
        categoryId: category.id,
        type: product.type,
        gender: product.gender,
        material: product.material,
        shape: product.shape,
        sku: product.sku,
        priceCents: product.priceCents,
        compareAtCents: product.compareAtCents ?? null,
        badge: product.badge ?? null,
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
        isBestseller: product.isBestseller ?? false,
        lensCompatible: product.lensCompatible ?? true,
        weightGrams: product.weightGrams ?? null,
        lensWidthMm: product.lensWidthMm ?? null,
        bridgeMm: product.bridgeMm ?? null,
        templeLengthMm: product.templeLengthMm ?? null,
        lensHeightMm: product.lensHeightMm ?? null,
        totalWidthMm: product.totalWidthMm ?? null,
        deliveryNote: product.deliveryNote ?? null,
        metaTitle: `${product.name} | AGHARAS VISION`,
        metaDescription: product.subtitle,
        images: {
          create: product.images.map((image, index) => ({
            url: `${IMG}/${image.file}`,
            alt: image.alt,
            sortOrder: index,
          })),
        },
        variants: {
          create: product.variants.map((variant, index) => ({
            colorName: variant.colorName,
            colorHex: variant.colorHex,
            sku: variant.sku,
            sortOrder: index,
            inventory: {
              create: {
                quantity: variant.stock,
                lowStockThreshold: 3,
              },
            },
          })),
        },
      },
      include: { variants: { include: { inventory: true } } },
    });

    for (const variant of created.variants) {
      createdVariants.set(variant.sku, variant.id);
      await db.inventoryMovement.create({
        data: {
          variantId: variant.id,
          delta: variant.inventory?.quantity ?? 0,
          reason: InventoryReason.INITIAL,
          note: "Stock initial de démonstration",
          userId: admin.id,
        },
      });
    }

    console.log(`   • ${product.name}`);
  }

  console.log("→ Verres, indices & traitements…");

  const lensTypes = await Promise.all([
    db.lensType.create({
      data: {
        slug: "unifocaux-hd",
        name: "Verres unifocaux HD",
        description:
          "Vision simple, haute définition. Inclus avec toutes les montures optiques compatibles.",
        kind: LensKind.SINGLE_VISION,
        priceCents: 0,
        productTypes: [ProductType.OPTICAL, ProductType.SUNGLASSES, ProductType.CLIP],
        sortOrder: 1,
      },
    }),
    db.lensType.create({
      data: {
        slug: "progressifs-individualises",
        name: "Verres progressifs individualisés",
        description:
          "Vision de près, intermédiaire et de loin dans un seul verre. Calibrés selon vos mesures.",
        kind: LensKind.PROGRESSIVE,
        priceCents: 120000,
        productTypes: [ProductType.OPTICAL],
        isActive: false,
        sortOrder: 2,
      },
    }),
    db.lensType.create({
      data: {
        slug: "neutres",
        name: "Verres neutres",
        description: "Verres non correcteurs, pour une monture portée sans ordonnance.",
        kind: LensKind.NONE,
        priceCents: 0,
        productTypes: [
          ProductType.OPTICAL,
          ProductType.SUNGLASSES,
          ProductType.CLIP,
        ],
        sortOrder: 3,
      },
    }),
  ]);
  const lensTypeBySlug = new Map(lensTypes.map((t) => [t.slug, t]));

  await Promise.all([
    db.lensIndex.create({
      data: { slug: "indice-150", name: "Standard", label: "Standard", value: "1.50", priceCents: 0, maxAbsSphere: 4, sortOrder: 1 },
    }),
    db.lensIndex.create({
      data: { slug: "indice-160", name: "Amincis", label: "Amincis", value: "1.60", priceCents: 25000, maxAbsSphere: 6, sortOrder: 2 },
    }),
    db.lensIndex.create({
      data: { slug: "indice-167", name: "Super amincis", label: "Super amincis", value: "1.67", priceCents: 45000, maxAbsSphere: 8, sortOrder: 3 },
    }),
    db.lensIndex.create({
      data: { slug: "indice-174", name: "Ultra-amincis", label: "Ultra-amincis", value: "1.74", priceCents: 75000, maxAbsSphere: 12, sortOrder: 4 },
    }),
  ]);

  await Promise.all([
    db.lensTreatment.create({
      data: {
        slug: "anti-reflet",
        name: "Anti-reflet",
        description: "Réduit les reflets et améliore la clarté visuelle, de jour comme de nuit.",
        priceCents: 0,
        isDefault: true,
        sortOrder: 1,
      },
    }),
    db.lensTreatment.create({
      data: {
        slug: "blue-protect",
        name: "Filtre BlueProtect",
        description: "Filtre une partie de la lumière bleue émise par les écrans.",
        priceCents: 35000,
        sortOrder: 2,
      },
    }),
    db.lensTreatment.create({
      data: {
        slug: "photochromique",
        name: "Photochromique",
        description: "Les verres s'assombrissent automatiquement à la lumière du soleil.",
        priceCents: 55000,
        sortOrder: 3,
      },
    }),
    db.lensTreatment.create({
      data: {
        slug: "hydrophobe",
        name: "Traitement hydrophobe",
        description: "Facilite le nettoyage et repousse l'eau et les traces.",
        priceCents: 15000,
        sortOrder: 4,
      },
    }),
  ]);

  console.log("→ Livraison, promotions, bannières…");

  await Promise.all([
    db.shippingMethod.create({
      data: {
        code: "standard",
        name: "Livraison standard Maroc",
        description: "Expédition soignée partout au Maroc, suivi communiqué par notre équipe.",
        priceCents: 4000,
        freeFromCents: 80000,
        estimatedDays: "48 h ouvrées",
        sortOrder: 1,
      },
    }),
    db.shippingMethod.create({
      data: {
        code: "express",
        name: "Coursier express Casablanca & Rabat",
        description: "Livraison prioritaire par coursier dans les villes desservies.",
        priceCents: 7000,
        freeFromCents: 150000,
        estimatedDays: "24 h ouvrées",
        sortOrder: 2,
      },
    }),
    db.shippingMethod.create({
      data: {
        code: "retrait-salon",
        name: "Retrait en salon",
        description: "Retrait gratuit en salon, après confirmation de disponibilité.",
        priceCents: 0,
        freeFromCents: 0,
        estimatedDays: "Sous 2 h après confirmation",
        sortOrder: 3,
      },
    }),
  ]);

  await db.coupon.create({
    data: {
      code: "CERCLE10",
      description: "10 % sur votre commande — Cercle Privilège AGHARAS VISION",
      type: CouponType.PERCENT,
      value: 10,
      minSubtotalCents: 0,
      usageLimit: null,
      isActive: true,
    },
  });

  await Promise.all([
    db.banner.create({
      data: {
        key: "home-hero",
        eyebrow: "Atelier & Maison d'Optique",
        title: "Voyez la différence. Affirmez votre style.",
        subtitle:
          "Découvrez notre collection de montures d'exception, façonnées avec rigueur et assemblées sur-mesure par nos opticiens diplômés.",
         imageUrl: "/images/promotional/agharas-hero.webp",
        ctaLabel: "Découvrir la collection",
        ctaHref: "/catalogue",
        position: "home",
        sortOrder: 1,
      },
    }),
    db.banner.create({
      data: {
        key: "home-promo",
        eyebrow: "Cercle Privilège",
        title: "10 % sur votre première commande",
        subtitle:
          "Utilisez le code CERCLE10 au moment du panier. Offre valable en ligne, dans la limite des stocks disponibles.",
        ctaLabel: "En profiter",
        ctaHref: "/catalogue/solaires",
        imageUrl: "/images/promotional/agharas-promo-eyewear-1200.webp",
        position: "home",
        sortOrder: 2,
      },
    }),
    db.banner.create({
      data: {
        key: "home-collections",
        eyebrow: "Nos collections",
        title: "Des montures à découvrir",
        subtitle: "Explorez les collections de montures optiques et solaires disponibles dans la boutique.",
        imageUrl: "/images/promotional/agharas-collections.webp",
        ctaLabel: "Voir les collections",
        ctaHref: "/catalogue",
        position: "home",
        sortOrder: 3,
      },
    }),
    db.banner.create({
      data: {
        key: "home-univers",
        eyebrow: "Univers Agharas",
        title: "L’univers AGHARAS VISION",
        subtitle: "Des lignes, des matières et des silhouettes à découvrir.",
        imageUrl: "/images/promotional/agharas-univers.webp",
        ctaLabel: "Découvrir la maison",
        ctaHref: "/a-propos",
        position: "home",
        sortOrder: 4,
      },
    }),
    db.banner.create({
      data: {
        key: "about-univers",
        eyebrow: "Notre univers",
        title: "Notre univers",
        subtitle: "Visuel d’ambiance conceptuel — il ne représente pas nécessairement un point de vente réel.",
        imageUrl: "/images/promotional/agharas-boutique.webp",
        position: "about",
        sortOrder: 1,
      },
    }),
  ]);

  console.log("→ FAQ, pages de contenu, salons, réglages…");

  await db.faqItem.createMany({
    data: FAQS.map((faq, index) => ({
      ...faq,
      sortOrder: index + 1,
      isActive: true,
    })),
  });

  for (const page of CONTENT_PAGES) {
    await db.contentPage.create({
      data: {
        slug: page.slug,
        title: page.title,
        intro: page.intro,
        body: page.body,
        metaDescription: page.intro,
        isPublished: true,
      },
    });
  }

  await Promise.all([
    db.store.create({
      data: {
        slug: "agadir-cite-essalam",
        name: "AGHARAS VISION",
        city: "Agadir",
        address: "N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR",
        phone: "+212 5 22 00 00 00",
        whatsapp: "+212 628-889950",
        email: null,
        hours: "Lundi au samedi : 09h30 — 19h30 (continu)",
        services: [
          "Essai privé & collections créateurs",
          "Relevé optométrique",
          "Montage et ajustement en atelier",
          "Prise en charge mutuelles",
        ],
        sortOrder: 1,
      },
    }),
  ]);

  await db.setting.createMany({ data: SETTINGS });

  console.log("→ Commande de démonstration & favoris…");

  const maraisVariantId = createdVariants.get("AV-MARAIS-04-OR");
  const titaneVariantId = createdVariants.get("AV-TITANE-NM-NO");
  const marais = await db.product.findUniqueOrThrow({
    where: { slug: "le-marais-n04-or-pur" },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  const titane = await db.product.findUniqueOrThrow({
    where: { slug: "titane-minimaliste-noir-mat" },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  if (maraisVariantId) {
    const placedAt = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000);
    const order = await db.order.create({
      data: {
        reference: "AVO-2026-0001",
        accessToken: token(24),
        userId: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone ?? "+212661234567",
        addressLine1: "12 Rue des Orangers",
        addressLine2: "Appartement 4",
        city: "Casablanca",
        postalCode: "20000",
        shippingMethodName: "Livraison standard Maroc",
        selectedShippingCode: "standard",
        shippingCents: 0,
        subtotalCents: marais.priceCents,
        discountCents: 0,
        totalCents: marais.priceCents,
        status: OrderStatus.DELIVERED,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        paymentStatus: PaymentStatus.PAID,
        createdAt: placedAt,
        items: {
          create: [
            {
              productId: marais.id,
              variantId: maraisVariantId,
              productName: marais.name,
              productSlug: marais.slug,
              variantName: "Or Pur 18k & titane satiné",
              sku: "AV-MARAIS-04-OR",
              imageUrl: marais.images[0]?.url ?? null,
              unitPriceCents: marais.priceCents,
              lensPriceCents: 0,
              quantity: 1,
              lineTotalCents: marais.priceCents,
              configuration: {
                hasCorrection: false,
                summary: "Sans correction — verres neutres inclus",
                lensPriceCents: 0,
                treatments: [],
                lensTypePriceCents: 0,
                lensIndexPriceCents: 0,
              },
            },
          ],
        },
        history: {
          create: [
            { toStatus: OrderStatus.PENDING, note: "Commande créée", createdAt: placedAt },
            { fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.CONFIRMED, note: "Confirmée par téléphone", createdAt: new Date(placedAt.getTime() + 3600_000) },
            { fromStatus: OrderStatus.CONFIRMED, toStatus: OrderStatus.IN_PRODUCTION, note: "Préparation en atelier", createdAt: new Date(placedAt.getTime() + 7200_000) },
            { fromStatus: OrderStatus.IN_PRODUCTION, toStatus: OrderStatus.SHIPPED, note: "Remise au transporteur", createdAt: new Date(placedAt.getTime() + 86400_000) },
            { fromStatus: OrderStatus.SHIPPED, toStatus: OrderStatus.DELIVERED, note: "Colis remis au client", createdAt: new Date(placedAt.getTime() + 259200_000) },
          ],
        },
        payments: {
          create: [
            {
              method: PaymentMethod.CASH_ON_DELIVERY,
              status: PaymentStatus.PAID,
              amountCents: marais.priceCents,
              reference: "COD-DEMO-0001",
            },
          ],
        },
        shipments: {
          create: [
            {
              method: "standard",
              carrier: "Transporteur partenaire (placeholder)",
              trackingNumber: "DEMO-TRACK-0001",
              status: ShipmentStatus.DELIVERED,
              shippedAt: new Date(placedAt.getTime() + 86400_000),
              deliveredAt: new Date(placedAt.getTime() + 259200_000),
            },
          ],
        },
      },
    });
    console.log(`   • Commande ${order.reference}`);

    await db.wishlistItem.createMany({
      data: [
        { userId: customer.id, productId: marais.id },
        { userId: customer.id, productId: titane.id },
      ],
    });
  }

  console.log("→ Terminé.");
  console.log("");
  console.log("Comptes de démonstration :");
  console.log(`  Admin    : ${admin.email}`);
  console.log(
    `  Opticien : ${process.env.SEED_STAFF_EMAIL ?? "opticien@agharas.local"}`,
  );
  console.log(
    `  Client (historique uniquement) : ${customer.email}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
