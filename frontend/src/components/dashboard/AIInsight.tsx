import { useEffect, useState, useRef } from "react";
import { queryAiAnalyst } from "../../services/threatApi";
import { FaRobot, FaUser, FaPaperPlane, FaCompass, FaTimes, FaMicrophone } from "react-icons/fa";

interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function AIInsight() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isSendingQuery, setIsSendingQuery] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    // Seed initial AI message
    setMessages([
      {
        sender: "ai",
        text: "System initialized. I am your ICTIP AI Co-Pilot. You can speak to me in any language (English, Telugu, etc.)! Ask me details on live attacks in India, Hyderabad, critical threats, or specific CVEs.",
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submitQuery = async (query: string) => {
    if (!query || isSendingQuery) return;

    setInputQuery("");
    setMessages((prev) => [...prev, { sender: "user", text: query, timestamp: new Date() }]);
    setIsSendingQuery(true);

    try {
      const response = await queryAiAnalyst(query);
      setMessages((prev) => [...prev, { sender: "ai", text: response.answer, timestamp: new Date() }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I encountered an error querying the intelligence dataset. Please verify network connectivity.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsSendingQuery(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    void submitQuery(inputQuery.trim());
  };

  const selectSuggested = (query: string) => {
    void submitQuery(query);
  };

  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = ""; // Auto-detect any language (e.g. Telugu/English)
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    finalTranscriptRef.current = "";

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      finalTranscriptRef.current += final;
      setInputQuery(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscriptRef.current.trim()) {
        void submitQuery(finalTranscriptRef.current.trim());
        finalTranscriptRef.current = "";
      } else if (inputQuery.trim()) {
         void submitQuery(inputQuery.trim());
      }
    };

    recognition.start();
  };

  const formatMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("# ")) {
        return <h3 key={idx} style={{ fontSize: 16, fontWeight: 800, margin: "18px 0 8px", color: "#f8fafc" }}>{line.substring(2)}</h3>;
      }
      if (line.startsWith("### ")) {
        return <h4 key={idx} style={{ fontSize: 13, fontWeight: 700, margin: "14px 0 6px", color: "#fb8b32" }}>{line.substring(4)}</h4>;
      }
      if (line.startsWith("* ") || line.startsWith("- ")) {
        return <li key={idx} style={{ marginLeft: 16, marginBottom: 4, fontSize: 12, color: "#cbd5e1", listStyleType: "square" }}>{parseBold(line.substring(2))}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <div key={idx} style={{ margin: "4px 0 4px 12px", fontSize: 12, color: "#cbd5e1" }}>{parseBold(line)}</div>;
      }
      if (line.trim() === "---") {
        return <hr key={idx} style={{ border: "none", borderTop: "1px solid #1e2e42", margin: "12px 0" }} />;
      }
      return <p key={idx} style={{ fontSize: 12, margin: "6px 0", lineHeight: 1.5, color: "#cbd5e1" }}>{parseBold(line)}</p>;
    });
  };

  const parseBold = (str: string) => {
    const parts = str.split("**");
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ color: "#ffffff" }}>{part}</strong> : part));
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 30,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 20px rgba(14, 165, 233, 0.4)",
            fontSize: 14,
            fontWeight: 700
          }}
        >
          <FaRobot size={18} />
          ASK AI
        </button>
      )}

      {isOpen && (
        <div
          className="panel"
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            width: 380,
            height: 560,
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px #1e2c40",
            animation: "slide-up 0.2s ease-out"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#060a12", borderBottom: "1px solid #1e2c40", borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#3ab7f5", fontSize: 13, fontWeight: 700 }}>
              <FaRobot /> ICTIP Co-Pilot
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost"
              style={{ padding: 6, color: "#6a7b95" }}
            >
              <FaTimes />
            </button>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%"
                  }}
                >
                  {msg.sender === "ai" && (
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#0d5c8a", display: "grid", placeItems: "center", color: "#3ab7f5" }}>
                      <FaRobot size={12} />
                    </div>
                  )}
                  
                  <div
                    style={{
                      background: msg.sender === "user" ? "#1b375a" : "#0a1322",
                      border: msg.sender === "user" ? "1px solid #28548a" : "1px solid #16263b",
                      padding: "10px 14px",
                      borderRadius: 10,
                      color: "#cbd5e1"
                    }}
                  >
                    {formatMarkdown(msg.text)}
                    <span style={{ fontSize: 8, color: "#6a7b95", display: "block", marginTop: 6, textAlign: "right" }}>
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {msg.sender === "user" && (
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#263f5c", display: "grid", placeItems: "center", color: "#9ac0ea" }}>
                      <FaUser size={12} />
                    </div>
                  )}
                </div>
              ))}
              {isSendingQuery && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", alignSelf: "flex-start", color: "#6a7b95", fontSize: 11 }}>
                  <FaRobot size={14} className="spin" style={{ animation: "spin 1s linear infinite" }} /> Analyzing live feeds...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: "0 20px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { label: "India Attacks", q: "How many attacks are happening in India right now?" },
                { label: "Hyderabad", q: "Are there any attacks targeting Hyderabad?" }
              ].map((hint, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSuggested(hint.q)}
                  style={{
                    fontSize: 9,
                    background: "#080f1a",
                    border: "1px solid #192b42",
                    borderRadius: 6,
                    padding: "4px 8px",
                    color: "#7dd3fc",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <FaCompass size={8} /> {hint.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSend}
              style={{
                display: "flex",
                gap: 8,
                padding: "10px 16px 16px",
                borderTop: "1px solid #1e2c40",
                background: "#070b13"
              }}
            >
              <input
                className="field"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={isListening ? "Listening... Speak now" : "Ask or click mic to dictate..."}
                disabled={isSendingQuery}
                style={{
                  flex: 1,
                  background: isListening ? "#101827" : "#03060c",
                  borderColor: isListening ? "#fb8b32" : "#192d47",
                  fontSize: 12,
                  color: "#e2effc",
                  transition: "all 0.2s"
                }}
              />
              <button
                type="button"
                onClick={handleListen}
                disabled={isSendingQuery}
                className="action-button"
                style={{
                  padding: "10px",
                  background: isListening ? "rgba(251, 139, 50, 0.2)" : "transparent",
                  color: isListening ? "#fb8b32" : "#6a7b95",
                  border: `1px solid ${isListening ? "#fb8b32" : "#192d47"}`,
                  animation: isListening ? "pulse-dot 1.5s infinite" : "none"
                }}
                title="Speak to dictate and auto-send"
              >
                <FaMicrophone size={14} />
              </button>
              <button
                className="action-button"
                type="submit"
                disabled={isSendingQuery || isListening}
                style={{
                  padding: "10px 14px",
                  background: "#167bb8",
                  color: "white",
                  border: "none",
                  boxShadow: "0 0 10px rgba(22,123,184,0.3)",
                  opacity: isListening ? 0.5 : 1
                }}
              >
                <FaPaperPlane size={11} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
