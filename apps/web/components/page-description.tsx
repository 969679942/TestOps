import { pageDescriptions, type PageDescriptionKey } from "../lib/design-spec-copy";

type PageDescriptionProps = Readonly<{
  page: PageDescriptionKey;
}>;

export function PageDescription({ page }: PageDescriptionProps) {
  return <p className="page-description">{pageDescriptions[page]}</p>;
}
