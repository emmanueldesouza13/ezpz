import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";

// Resolves an icon by name stored in the DB (categories.icon, e.g. "Briefcase")
// to its lucide-react component. Falls back to a generic dot if unknown so a
// bad/typo'd icon name never crashes the page.
export default function Icon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const IconMap = Lucide as unknown as Record<
    string,
    React.ComponentType<LucideProps>
  >;
  const Cmp = IconMap[name] || Lucide.Circle;
  return <Cmp {...props} />;
}
