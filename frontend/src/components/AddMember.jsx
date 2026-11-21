import { useState } from "react";
import { addGroupMember } from "../api/api";
import StatusMessage from "./StatusMessage";

function AddMember({ groupId }) {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!userId.trim()) {
      setMessage("Please enter a User ID.");
      setMessageType("error");
      return;
    }

    const numericUserId = Number(userId);

    if (
      !Number.isInteger(numericUserId) ||
      numericUserId <= 0
    ) {
      setMessage("Please enter a valid User ID.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { response, data } =
        await addGroupMember(
          groupId,
          numericUserId
        );

      if (response.ok) {
        setMessage(
          "Member added successfully!"
        );

        setMessageType("success");
        setUserId("");
      } else {
        setMessage(
          data.detail ||
            "Could not add member."
        );

        setMessageType("error");
      }
    } catch (error) {
      console.error(
        "Add member error:",
        error
      );

      setMessage(
        "Cannot connect to the backend."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="modern-section">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">
            GROUP MEMBERS
          </span>

          <h2>Add a member</h2>
        </div>
      </div>

      <p className="muted-text">
        Add another registered SplitEase user
        using their User ID.
      </p>

      <form
        className="member-form"
        onSubmit={handleAddMember}
      >
        <div className="member-input-group">
          <label htmlFor="member-user-id">
            User ID
          </label>

          <input
            id="member-user-id"
            type="number"
            min="1"
            step="1"
            placeholder="Enter User ID, e.g. 4"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);

              if (message) {
                setMessage("");
              }
            }}
            autoComplete="off"
            disabled={loading}
            required
          />
        </div>

        <button
          className="member-add-btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Adding member..."
            : "Add Member +"}
        </button>
      </form>

      <StatusMessage
        message={message}
        type={messageType}
      />
    </section>
  );
}

export default AddMember;