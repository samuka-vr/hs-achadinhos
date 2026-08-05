import Link from "next/link";
import type { CSSProperties } from "react";
import type { Category } from "@/lib/types";
import Icon from "./Icon";

function initials(name: string) {
  return name.split(/\s|&/).map((part) => part.trim()).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export default function CategoryStories({ categories }: { categories: Category[]; variant?: "stories" | "cards" }) {
  return (
    <div className="hs-category-grid">
      {categories.map((category, index) => (
        <Link
          href={`/categoria/${category.slug}`}
          className="hs-category-card"
          key={category.id}
          style={{ "--category-accent": category.accent_color || "#e86f80", "--category-index": index } as CSSProperties}
        >
          <span className="hs-category-card__media">
            {category.image_url ? <img src={category.image_url} alt="" /> : <b>{initials(category.name)}</b>}
          </span>
          <span className="hs-category-card__copy">
            <small>Categoria {String(index + 1).padStart(2, "0")}</small>
            <strong>{category.name}</strong>
            <em>{category.description || "Veja os produtos selecionados"}</em>
          </span>
          <span className="hs-category-card__arrow"><Icon name="arrow" size={16} /></span>
        </Link>
      ))}
    </div>
  );
}
