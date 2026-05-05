import slugify from "slugify";

export function generateSlug(seed: string, fallback = ""): string {
  const base = slugify(seed, { lower: true, strict: true }) || fallback;
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}
