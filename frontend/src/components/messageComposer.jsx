import { useRef, useState } from "react";
import "./messageComposer.css";

function MessageComposer({ onSend, onTyping, disabled }) {
  const [value, setValue] = useState("");
  const lastTypingRef = useRef(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = value.trim();
    if (!content) return;
    onSend(content);
    setValue("");
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    if (!onTyping) return;
    const now = Date.now();
    if (now - lastTypingRef.current >= 2000) {
      lastTypingRef.current = now;
      onTyping();
    }
  };

  return (
    <form className="message-composer" onSubmit={handleSubmit}>
      <input
        className="message-composer-input"
        type="text"
        placeholder="Type a message..."
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
      <button
        className="message-composer-send"
        type="submit"
        aria-label="Send message"
        disabled={disabled || !value.trim()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </form>
  );
}

export default MessageComposer;
