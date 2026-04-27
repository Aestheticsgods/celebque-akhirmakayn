"use client";
import { useEffect, useState } from "react";

export default function MaintenanceTogglePage() {
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch current maintenance mode from API
  useEffect(() => {
    fetch("/api/maintenance")
      .then((res) => res.json())
      .then((data) => {
        setMaintenance(data.maintenance);
        setLoading(false);
      });
  }, []);

  // Toggle maintenance mode via API
  const toggleMaintenance = async () => {
    setLoading(true);
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenance: !maintenance }),
    });
    const data = await res.json();
    setMaintenance(data.maintenance);
    setLoading(false);
    alert(`Maintenance mode is now ${data.maintenance ? "ON" : "OFF"}`);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Maintenance Mode Toggle</h1>
      <p>Current status: <b>{loading ? "Loading..." : maintenance ? "ON" : "OFF"}</b></p>
      <button
        style={{
          padding: "10px 20px",
          background: maintenance ? "#e53e3e" : "#38a169",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 18
        }}
        onClick={toggleMaintenance}
        disabled={loading}
      >
        {maintenance ? "Disable" : "Enable"} Maintenance Mode
      </button>
      <p style={{marginTop: 20, color: '#888'}}>Only you should know this URL.</p>
    </div>
  );
}
