"use client";
import { useActionState, useState } from "react";
import { saveHomeLayoutAction } from "@/app/actions/admin/home-layout";
import { HOME_SECTIONS, type HomeSection } from "@/lib/home-layout";
import { FormFeedback, SubmitButton } from "@/components/admin/FormBits";
import type { AdminState } from "@/lib/admin";

export function HomeLayoutForm({ initialOrder, categories, selected }: { initialOrder: HomeSection[]; categories: { id: string; name: string; isActive: boolean }[]; selected: string[] }) {
  const [order, setOrder] = useState(initialOrder);
  const [ids, setIds] = useState(selected);
  const [state, action] = useActionState<AdminState, FormData>(saveHomeLayoutAction, null);
  function move<T>(list: T[], index: number, delta: number, setter: (next: T[]) => void) {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list]; [next[index], next[target]] = [next[target]!, next[index]!]; setter(next);
  }
  return <form action={action} className="space-y-6">
    <input type="hidden" name="sections" value={JSON.stringify(order)} />
    <input type="hidden" name="categories" value={JSON.stringify(ids)} />
    <FormFeedback state={state} />
    <section className="space-y-3 border border-outline-variant bg-white p-4">
      <h2 className="font-serif text-xl">Ordre des sections</h2>
      <p className="text-body-sm">La visibilité se règle dans Paramètres ; la bannière principale se règle dans Pages et contenu.</p>
      <ol className="space-y-2">{order.map((id, i) => <li key={id} className="flex items-center gap-3">
        <span className="flex-1">{HOME_SECTIONS.find(([key]) => key === id)?.[1]}</span>
        <button className="btn-quiet btn-sm" type="button" disabled={i === 0} onClick={() => move(order, i, -1, setOrder)} aria-label={`Monter ${HOME_SECTIONS.find(([key]) => key === id)?.[1]}`}>↑</button>
        <button className="btn-quiet btn-sm" type="button" disabled={i === order.length - 1} onClick={() => move(order, i, 1, setOrder)} aria-label={`Descendre ${HOME_SECTIONS.find(([key]) => key === id)?.[1]}`}>↓</button>
      </li>)}</ol>
    </section>
    <section className="space-y-3 border border-outline-variant bg-white p-4">
      <h2 className="font-serif text-xl">Catégories mises en avant</h2>
      <p className="text-body-sm">Cochez les catégories puis classez la sélection. Les catégories masquées restent invisibles sur la boutique.</p>
      {categories.length === 0 && <p>Aucune catégorie disponible. Créez une catégorie dans Catalogue.</p>}
      {categories.map((category) => <label key={category.id} className="flex gap-2"><input type="checkbox" checked={ids.includes(category.id)} onChange={(e) => setIds(e.target.checked ? [...ids, category.id] : ids.filter((id) => id !== category.id))} />{category.name}{!category.isActive && " (masquée)"}</label>)}
      <ol className="space-y-2">{ids.map((id, i) => <li key={id} className="flex items-center gap-3"><span className="flex-1">{categories.find((category) => category.id === id)?.name ?? "Catégorie indisponible"}</span>
        <button className="btn-quiet btn-sm" type="button" disabled={i === 0} onClick={() => move(ids, i, -1, setIds)} aria-label={`Monter la catégorie ${categories.find((c) => c.id === id)?.name}`}>↑</button>
        <button className="btn-quiet btn-sm" type="button" disabled={i === ids.length - 1} onClick={() => move(ids, i, 1, setIds)} aria-label={`Descendre la catégorie ${categories.find((c) => c.id === id)?.name}`}>↓</button>
      </li>)}</ol>
    </section>
    <SubmitButton label="Enregistrer et publier l'accueil" />
    <a href="/" target="_blank" rel="noopener noreferrer" className="btn-quiet">Voir l'accueil publié</a>
  </form>;
}
