import { useState } from "react";
import { Send } from "lucide-react";

interface BotButton {
  id: string;
  row: number;
}

interface ButtonDef {
  id: string;
  label: string;
  icon: string;
  action_type: string;
  action_value: string;
  description: string;
}

interface Props {
  welcomeMessage: string;
  confirmMessage: string;
  buttons: BotButton[];
  buttonLibrary: ButtonDef[];
  botName: string;
}

interface ChatMessage {
  from: "bot" | "user";
  text: string;
}

export function BotPreview({ welcomeMessage, confirmMessage, buttons, buttonLibrary, botName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);

  const getButtonDef = (id: string) => buttonLibrary.find(b => b.id === id);

  const groupedButtons = buttons.reduce<Record<number, BotButton[]>>((acc, btn) => {
    if (!acc[btn.row]) acc[btn.row] = [];
    acc[btn.row].push(btn);
    return acc;
  }, {});

  const handleStart = () => {
    setMessages([{ from: "bot", text: welcomeMessage || "👋 Добро пожаловать!" }]);
    setStarted(true);
  };

  const handleButtonClick = (btn: BotButton) => {
    const def = getButtonDef(btn.id);
    if (!def) return;
    setMessages(prev => [
      ...prev,
      { from: "user", text: def.label },
      { from: "bot", text: def.action_type === "message" ? (def.action_value || "Обработка...") : `[${def.label}] — обработка команды...` },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { from: "user", text: input },
      { from: "bot", text: confirmMessage || "✅ Сообщение получено!" },
    ]);
    setInput("");
  };

  const handleReset = () => {
    setMessages([]);
    setStarted(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-sm">
        {/* Phone frame */}
        <div className="bg-[#1a2234] rounded-2xl overflow-hidden shadow-2xl border border-border/20">
          {/* Header */}
          <div className="bg-[#1e2c3f] px-4 py-3 flex items-center gap-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {botName?.[0]?.toUpperCase() || "B"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{botName || "Bot"}</p>
              <p className="text-blue-300/60 text-[10px]">бот</p>
            </div>
          </div>

          {/* Chat area */}
          <div className="h-[380px] overflow-y-auto p-3 space-y-2 bg-[#0e1621]">
            {!started ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {botName?.[0]?.toUpperCase() || "B"}
                </div>
                <p className="text-white/60 text-sm">{botName || "Bot"}</p>
                <button
                  onClick={handleStart}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  /start
                </button>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                        msg.from === "user"
                          ? "bg-blue-500 text-white rounded-br-sm"
                          : "bg-[#1e2c3f] text-white/90 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Keyboard buttons */}
          {started && buttons.length > 0 && (
            <div className="bg-[#17212b] border-t border-white/5 p-2 space-y-1.5">
              {Object.keys(groupedButtons).sort((a, b) => +a - +b).map(rowStr => (
                <div key={rowStr} className="flex gap-1.5">
                  {groupedButtons[+rowStr].map((btn, i) => {
                    const def = getButtonDef(btn.id);
                    return (
                      <button
                        key={i}
                        onClick={() => handleButtonClick(btn)}
                        className="flex-1 bg-[#2b3a4e] hover:bg-[#364d65] text-white/90 text-xs py-2 px-2 rounded-md transition-colors truncate"
                      >
                        {def?.label || btn.id}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          {started && (
            <div className="bg-[#17212b] border-t border-white/5 p-2 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Написать сообщение..."
                className="flex-1 bg-[#242f3d] text-white text-sm rounded-full px-4 py-2 outline-none placeholder:text-white/30"
              />
              <button onClick={handleSend} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors">
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Reset button */}
        {started && (
          <button onClick={handleReset} className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors">
            🔄 Сбросить имитацию
          </button>
        )}
      </div>
    </div>
  );
}
