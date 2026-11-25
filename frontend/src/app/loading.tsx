export default function AppLoading() {
  return (
    <div className="container section">
      <div className="app-skeleton-head">
        <div className="app-skeleton app-skeleton--title" />
        <div className="app-skeleton app-skeleton--subtitle" />
      </div>
      <div className="app-skeleton-grid">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} className="app-skeleton-card">
            <div className="app-skeleton app-skeleton--line" />
            <div className="app-skeleton app-skeleton--line app-skeleton--short" />
            <div className="app-skeleton app-skeleton--line app-skeleton--mid" />
          </div>
        ))}
      </div>
    </div>
  );
}
