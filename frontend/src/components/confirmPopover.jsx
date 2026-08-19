import "./confirmPopover.css";

function ConfirmPopover({ onConfirm, onCancel }) {
  return (
    <div className="confirm-popover">
      <div className="confirm-popover-text">Delete this message?</div>
      <div className="confirm-popover-actions">
        <button className="confirm-popover-delete" onClick={onConfirm}>
          Delete
        </button>
        <button className="confirm-popover-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ConfirmPopover;
