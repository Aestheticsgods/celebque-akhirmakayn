export default function MaintenancePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff' }}>
      <h1 style={{ fontSize: 48, marginBottom: 24 }}>Site Offline</h1>
      <p style={{ fontSize: 20 }}>We are currently performing maintenance.<br />Please check back later.</p>
    </div>
  );
}
