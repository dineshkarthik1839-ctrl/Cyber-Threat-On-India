import type { Threat } from "../../types/threat";

const cls = (s: string) => s.toLowerCase();

export default function ThreatTable({ items }: { items: Threat[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>Indicator</th>
            <th>Origin</th>
            <th>Target</th>
            <th>Technique</th>
            <th>Severity</th>
            <th>Seen</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} style={{ transition: "background 0.2s ease" }}>
              <td>
                <b style={{ color: "#3ab7f5", fontFamily: "monospace", fontSize: 13, letterSpacing: "0.02em" }}>{t.sourceIp}</b>
                <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>
                  {t.id}
                </div>
              </td>
              <td style={{ color: "#cbd5e1" }}>
                {t.countryCode} · {t.sourceCountry}
              </td>
              <td style={{ color: "#cbd5e1" }}>{t.targetState}</td>
              <td>
                <span style={{ color: "#e2effc", fontWeight: 500 }}>{t.attackType}</span>
                <div className="muted" style={{ fontSize: 10, marginTop: 4, fontFamily: "monospace", color: "#6a7b95" }}>
                  {t.mitre}
                </div>
              </td>
              <td>
                <span className={`severity ${cls(t.severity)}`}>{t.severity}</span>
              </td>
              <td className="muted" style={{ fontSize: 11 }}>{t.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}