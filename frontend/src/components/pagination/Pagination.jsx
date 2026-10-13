/**
 * Pagination — a numbered page switcher for paginated admin lists.
 *
 * Renders "previous"/"next" buttons plus numbered page buttons, collapsing
 * long ranges with an ellipsis. Renders nothing when there is a single page.
 *
 * @param {number} page      1-based current page.
 * @param {number} pageCount Total number of pages.
 * @param {(page: number) => void} onChange Called with the requested page.
 */
function pageItems(page, pageCount) {
  const wanted = new Set([1, pageCount, page, page - 1, page + 1])
  const pages = [...wanted]
    .filter((entry) => entry >= 1 && entry <= pageCount)
    .sort((a, b) => a - b)

  const items = []
  let previous = 0
  for (const entry of pages) {
    if (previous && entry - previous > 1) items.push(null)
    items.push(entry)
    previous = entry
  }
  return items
}

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null

  const items = pageItems(page, pageCount)

  return (
    <nav className="pagination" aria-label="ترقيم الصفحات">
      <button
        className="pagination__btn"
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        السابق
      </button>

      {items.map((item, index) =>
        item === null ? (
          <span className="pagination__gap" key={`gap-${index}`} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            className={`pagination__btn${
              item === page ? ' pagination__btn--active' : ''
            }`}
            key={item}
            type="button"
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        className="pagination__btn"
        type="button"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        التالي
      </button>
    </nav>
  )
}
