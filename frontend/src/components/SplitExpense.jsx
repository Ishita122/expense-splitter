import { useState } from "react";
import { createExpense } from "../api/api";
import StatusMessage from "./StatusMessage";
import "./SplitExpense.css";

function SplitExpense({
  groupId,
  currentUser,
  onExpenseCreated,
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [participantIds, setParticipantIds] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return (
      <section className="split-card">
        <StatusMessage
          message="Loading user information..."
          type="info"
        />
      </section>
    );
  }

  const currentUserId = Number(currentUser.id);

  const participants = participantIds
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "")
    .map((id) => Number(id))
    .filter(
      (id, index, array) =>
        Number.isInteger(id) &&
        id > 0 &&
        array.indexOf(id) === index
    );

  const numericAmount = Number(amount);

  const showPreview =
    participants.length > 0 &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0;

  const previewShare = showPreview
    ? numericAmount / participants.length
    : 0;

  const showError = (text) => {
    setMessage(text);
    setMessageType("error");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setMessage("");

    if (!description.trim()) {
      showError("Please enter a description.");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      showError("Please enter a valid amount.");
      return;
    }

    if (participants.length === 0) {
      showError("Please enter participant User IDs.");
      return;
    }

    if (!participants.includes(currentUserId)) {
      showError(
        `Include your User ID (${currentUserId}) in the split.`
      );
      return;
    }

    const amountCents = Math.round(
      numericAmount * 100
    );

    const baseShare = Math.floor(
      amountCents / participants.length
    );

    let remainder =
      amountCents -
      baseShare * participants.length;

    const splits = participants.map((userId) => {
      let share = baseShare;

      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }

      return {
        user_id: userId,
        share_cents: share,
      };
    });

    const expenseData = {
      description: description.trim(),
      paid_by: currentUserId,
      amount_cents: amountCents,
      splits,
    };

    setLoading(true);

    try {
      const { response, data } =
        await createExpense(
          groupId,
          expenseData
        );

      if (response.ok) {
        setMessage(
          "Split expense added successfully!"
        );
        setMessageType("success");

        setDescription("");
        setAmount("");
        setParticipantIds("");

        if (onExpenseCreated) {
          await onExpenseCreated();
        }
      } else {
        showError(
          data.detail ||
            "Could not create split expense."
        );
      }
    } catch (error) {
      console.error(
        "Split expense error:",
        error
      );

      showError(
        "Cannot connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="split-card">
      <div className="split-heading">
        <div>
          <span className="split-eyebrow">
            SPLIT EXPENSE
          </span>

          <h2>Add a shared expense</h2>

          <p>
            Divide an expense equally between
            registered group members.
          </p>
        </div>

        <div className="split-icon">
          ₹
        </div>
      </div>

      <form
        className="split-form"
        onSubmit={handleSubmit}
      >
        <div className="split-field">
          <label>Description</label>

          <input
            type="text"
            placeholder="e.g. Dinner"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setMessage("");
            }}
            disabled={loading}
            required
          />
        </div>

        <div className="split-field">
          <label>Total amount</label>

          <div className="split-money">
            <span>₹</span>

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="800"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setMessage("");
              }}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="split-field split-full">
          <label>Participant User IDs</label>

          <input
            type="text"
            placeholder={`e.g. ${currentUserId}, 4`}
            value={participantIds}
            onChange={(e) => {
              setParticipantIds(e.target.value);
              setMessage("");
            }}
            autoComplete="off"
            disabled={loading}
            required
          />

          <small>
            Your User ID is {currentUserId}. Separate
            multiple IDs using commas.
          </small>
        </div>

        {showPreview && (
          <div className="split-preview split-full">
            <div className="split-preview-title">
              <span>Equal split preview</span>

              <strong>
                Total ₹{numericAmount.toFixed(2)}
              </strong>
            </div>

            <div className="split-preview-list">
              {participants.map((id) => (
                <div
                  className="split-person"
                  key={id}
                >
                  <div>
                    <span className="split-avatar">
                      {id === currentUserId
                        ? "YOU"
                        : id}
                    </span>

                    <span>
                      User #{id}
                      {id === currentUserId
                        ? " (You)"
                        : ""}
                    </span>
                  </div>

                  <strong>
                    ₹{previewShare.toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="split-button split-full"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Adding expense..."
            : "Split & Add Expense →"}
        </button>
      </form>

      <StatusMessage
        message={message}
        type={messageType}
      />
    </section>
  );
}

export default SplitExpense;