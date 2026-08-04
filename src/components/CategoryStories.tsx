import Link from "next/link";
import type { Category } from "@/lib/types";

export default function CategoryStories({ categories, variant = "stories" }: { categories: Category[]; variant?: "stories" | "cards" }) {
  if (!categories.length) return null;
  return <div className={`hs-categories hs-categories-${variant}`} aria-label="Categorias">
    {categories.map((category) => <Link href={`/categoria/${category.slug}`} key={category.id}>
      <span className="hs-category-image" style={{ "--category-accent": category.accent_color || "var(--brand)" } as React.CSSProperties}>
        <span>{category.image_url ? <img src={category.image_url} alt="" /> : <b>{category.icon || "✦"}</b>}</span>
      </span>
      <span className="hs-category-copy"><strong>{category.name}</strong>{variant === "cards" && category.description ? <small>{category.description}</small> : null}</span>
    </Link>)}
  </div>;
}
