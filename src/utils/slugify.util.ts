export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special characters
    .replace(/\s+/g, "-")         // convert spaces to dashes
    .replace(/-+/g, "-");          // remove multiple dashes
}
