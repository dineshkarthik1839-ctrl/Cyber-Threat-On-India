import { useState, useEffect } from "react";
import type { Investigation } from "../../services/investigationService";
import { investigationService } from "../../services/investigationService";
import { FaCircleNotch, FaExclamationTriangle } from "react-icons/fa";

interface Props {
  investigation: Investigation;
}

export default function TimelinePanel({ investigation }: Props) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, [investigation.id]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const data = await investigationService.getTimeline(investigation.id);
      setTimeline(data);
      setError(null);
    } catch (err) {
      setError("Failed to load timeline.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    try {
      setSavingNote(true);
      await investigationService.addNote(investigation.id, newNote);
      setNewNote("");
      await loadTimeline(); // Reload to fetch the updated timeline
    } catch (err) {
      alert("Failed to save note. Please try again.");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 64, color: "#7889a3" }}>
        <FaCircleNotch className="fa-spin" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "rgba(255, 99, 116, 0.1)", padding: 24, borderRadius: 12, color: "#ff6374", display: "flex", gap: 12 }}>
        <FaExclamationTriangle size={20} />
        <div>
          <h4 style={{ margin: 0, marginBottom: 8 }}>Timeline Error</h4>
          <p style={{ margin: 0 }}>{error}</p>
          <button onClick={loadTimeline} className="btn btn-secondary" style={{ marginTop: 12 }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <h2 className="section-title" style={{ fontSize: 20, margin: 0, color: "#fff" }}>Investigation Timeline</h2>
      
      <div style={{ borderLeft: "2px solid #1a2d45", paddingLeft: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        {timeline.map((item, idx) => (
          <div key={idx} style={{ position: "relative" }}>
            <div style={{ 
              position: "absolute", left: -31, top: 4, width: 12, height: 12, borderRadius: "50%", 
              background: item.type === "DETECTION" ? "#ff6374" : item.type === "AI_ANALYSIS" ? "#5ac2f0" : "#3be2a5", 
              border: "2px solid #0b121e" 
            }} />
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
              {new Date(item.timestamp).toLocaleString()} • {item.author}
            </div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{item.title}</div>
            <div style={{ color: "#7889a3", fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>
              {item.description}
            </div>
          </div>
        ))}

        {timeline.length === 0 && (
          <div style={{ color: "#7889a3", fontStyle: "italic" }}>No timeline events found.</div>
        )}
      </div>

      <div style={{ marginTop: 16, background: "#09121f", padding: 24, borderRadius: 12, border: "1px solid #1a2d45" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Add Analyst Note</div>
        <textarea 
          className="field" 
          rows={4} 
          placeholder="Type investigation findings here..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          style={{ background: "#0b121e", marginBottom: 12, resize: "vertical", width: "100%", padding: 12, color: "#fff", border: "1px solid #1a2d45", borderRadius: 8 }}
          disabled={savingNote}
        />
        <button 
          className="btn btn-primary" 
          onClick={handleSaveNote} 
          disabled={savingNote || !newNote.trim()}
          style={{ opacity: savingNote || !newNote.trim() ? 0.5 : 1 }}
        >
          {savingNote ? "Saving..." : "Save Note"}
        </button>
      </div>
    </div>
  );
}
