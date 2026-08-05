import Link from "next/link";
import type { Category } from "@/lib/types";
import Icon from "./Icon";

function initials(name: string) {
  return name.split(/\s|&/).map((part) => part.trim()).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export default function CategoryStories({ categories, variant = "stories" }: { categories: Category[]; variant?: "stories" | "cards" }) {
  if (!categories.length) return null;

  return (
    <div className={`hs-categories hs-categories-${variant}`} aria-label="Categorias">
      {categories.map((category, index) => (
        <Link href={`/categoria/${category.slug}`} key={category.id} style={{ "--category-accent": category.accent_color || "var(--brand)" } as React.CSSProperties}>
          <span className="hs-category-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="hs-category-image">
            {category.image_url ? (
              <img src={category.image_url} alt="" />
            ) : (
              <span className="hs-category-fallback">{initials(category.name)}</span>
            )}
          </span>
          <span className="hs-category-copy">
            <strong>{category.name}</strong>
            {variant === "cards" && category.description ? <small>{category.description}</small> : null}
            <em>Explorar <Icon name="arrow" size={14} /></em>
          </span>
        </Link>
      ))}
    </div>
  );
}
