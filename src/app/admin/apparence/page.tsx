import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { featuredCategoryIds, homeSectionOrder } from "@/lib/home-layout";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { HomeLayoutForm } from "@/components/admin/HomeLayoutForm";

export const dynamic = "force-dynamic";
export default async function AppearancePage() {
  await requirePermission("content.manage");
  const [settings, categories] = await Promise.all([getSettings(), db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, isActive: true } })]);
  const available = new Set(categories.map((category) => category.id));
  const selected = (featuredCategoryIds(settings["home.featured_categories"]) ?? categories.filter((category) => category.isActive).map((category) => category.id)).filter((id) => available.has(id));
  return <><AdminPageHeader eyebrow="Boutique" title="Apparence de l'accueil" description="Choisissez les catégories et l'ordre des sections sans modifier le design." /><HomeLayoutForm initialOrder={homeSectionOrder(settings["home.section_order"])} categories={categories} selected={selected} /></>;
}
