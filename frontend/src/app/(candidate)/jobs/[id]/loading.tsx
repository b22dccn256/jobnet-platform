export default function JobDetailLoading() {
  return (
    <div className="container section">
      <div className="app-skeleton app-skeleton--short" style={{ marginBottom: 18, height: 18 }} />
      <div className="job-detail-layout">
        <div className="app-skeleton-card" style={{ padding: 24 }}>
          <div className="app-skeleton app-skeleton--title" style={{ width: '68%', marginBottom: 14 }} />
          <div className="app-skeleton app-skeleton--line" style={{ width: '42%', marginBottom: 24 }} />
          <div className="app-skeleton app-skeleton--line" />
          <div className="app-skeleton app-skeleton--line" />
          <div className="app-skeleton app-skeleton--line app-skeleton--mid" />
          <div className="app-skeleton app-skeleton--line" style={{ marginTop: 20 }} />
          <div className="app-skeleton app-skeleton--line app-skeleton--short" />
        </div>
        <div className="app-skeleton-card" style={{ padding: 20 }}>
          <div className="app-skeleton app-skeleton--line" />
          <div className="app-skeleton app-skeleton--line app-skeleton--short" />
          <div className="app-skeleton app-skeleton--line app-skeleton--mid" />
        </div>
      </div>
    </div>
  );
}
