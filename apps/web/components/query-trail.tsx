type QueryTrailItem = Readonly<{
  id: string;
  label: string;
  onRemove: () => void;
}>;

type QueryTrailProps = Readonly<{
  items: QueryTrailItem[];
}>;

export function QueryTrail({ items }: QueryTrailProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="query-trail" aria-label="当前筛选条件">
      {items.map((item) => (
        <span className="query-trail-chip" key={item.id}>
          {item.label}
          <button
            aria-label={`移除筛选：${item.label}`}
            className="query-trail-remove"
            type="button"
            onClick={item.onRemove}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
