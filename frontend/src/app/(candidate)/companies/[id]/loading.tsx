export default function CompanyDetailLoading() {
  return (
    <div className="container section">
      <div className="app-skeleton-card" style={{ padding: 24, marginBottom: 24 }}>
        <div className="app-skeleton app-skeleton--title" style={{ width: '48%', marginBottom: 12 }} />
        <div className="app-skeleton app-skeleton--line" style={{ width: '65%', marginBottom: 16 }} />
        <div className="app-skeleton app-skeleton--line" />
        <div className="app-skeleton app-skeleton--line app-skeleton--mid" />
      </div>
      <div className="app-skeleton-grid">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="app-skeleton-card">
            <div className="app-skeleton app-skeleton--line" />
            <div className="app-skeleton app-skeleton--line app-skeleton--short" />
          </div>
        ))}
      </div>
    </div>
  );
}
