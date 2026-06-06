export default function PageHero({ eyebrow, title, copy, metric, metricLabel, actions, className = '' }) {
  const hasMetric = metric !== undefined || metricLabel

  return (
    <section className={`page-hero${className ? ` ${className}` : ''}`}>
      <div className="page-hero-copy">
        {eyebrow && <div className="page-kicker">{eyebrow}</div>}
        <h1>{title}</h1>
        {copy && <p>{copy}</p>}
        {actions && <div className="page-hero-actions">{actions}</div>}
      </div>

      {hasMetric && (
        <div className="page-hero-metric">
          <strong>{metric}</strong>
          <span>{metricLabel}</span>
        </div>
      )}
    </section>
  )
}
