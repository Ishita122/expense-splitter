import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function AddMember({ groupId }) {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!userId.trim()) {
      setMessage("Please enter a User ID.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/groups/${groupId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: Number(userId),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Member added successfully!");
        setUserId("");
      } else {
        setMessage(
          data.detail || "Could not add member."
        );
      }
    } catch (error) {
      console.error("Add member error:", error);
      setMessage("Cannot connect to the backend.");
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
        Add another registered Splitly user using their User ID.
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
            type="text"
            placeholder="Enter User ID, e.g. 4"
            value={userId}
            onChange={(e) =>
              setUserId(e.target.value)
            }
            autoComplete="off"
          />
        </div>

        <button
          className="member-add-btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Adding..."
            : "Add Member +"}
        </button>
      </form>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}
    </section>
  );
}

export default AddMember;