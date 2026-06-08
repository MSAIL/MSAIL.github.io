import { PlaceholderPage } from "@/components/placeholder-page";

export default function NotFound() {
  return (
    <PlaceholderPage
      index="404"
      eyebrow="Not found"
      title="Page not found"
      lead="That route doesn't exist (yet). Head back to the homepage or pick a section from the navigation."
      note="Lost? Use the nav above to get back on track"
    />
  );
}
