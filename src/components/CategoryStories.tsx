"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { Category } from "@/lib/types";
import Icon from "./Icon";

function initials(name: string) {
  return name.split(/\s|&/).map((part) => part.trim()).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export default function CategoryStories({ categories }: { categories: Category[]; variant?: "stories" | "cards" }) {
  const [expanded, setExpanded] = useState(false);
  const visibleCategories = expanded ? categories : categories.slice(0, 4);

  return (
    <div className="hs-category-showcase">
      <div className={`hs-category-grid ${expanded ? "is-expanded" : "is-compact"}`}>
        {visibleCategories.map((category, index) => (
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
      {categories.length > 4 ? (
        <button
          type="button"
          className="hs-category-toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <span>{expanded ? "Mostrar menos" : `Ver todas as ${categories.length} categorias`}</span>
          <Icon name={expanded ? "up" : "down"} size={17} />
        </button>
      ) : null}
    </div>
  );
}
