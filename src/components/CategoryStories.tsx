import Link from "next/link";
import type { Category } from "@/lib/types";

export default function CategoryStories({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <div className="category-stories" aria-label="Categorias">
      {categories.map((category) => (
        <Link className="category-story" href={`/categoria/${category.slug}`} key={category.id}>
          <span className="category-story-ring">
            <span className="category-story-media">
              {category.image_url ? <img src={category.image_url} alt="" /> : <b>{category.icon || "✦"}</b>}
            </span>
          </span>
          <strong>{category.name}</strong>
        </Link>
      ))}
    </div>
  );
}
