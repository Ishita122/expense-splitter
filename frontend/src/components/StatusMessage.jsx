import "./StatusMessage.css";
function StatusMessage({ message, type = "info" }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`status-message status-${type}`}>
      <span className="status-icon">
        {type === "success"
          ? "✓"
          : type === "error"
          ? "!"
          : "i"}
      </span>

      <span>{message}</span>
    </div>
  );
}

export default StatusMessage;