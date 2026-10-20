
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [user, setUser] = useState(null);

  // Authentication form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Groups
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");

  // Messages
  const [message, setMessage] = useState("");
  const [groupMessage, setGroupMessage] = useState("");

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  useEffect(() => {
    if (!isLoggedIn) return;

    const getUser = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("User loading error:", error);
      }
    };

    getUser();
  }, [isLoggedIn]);

  // =====================================================
  // GET GROUPS
  // =====================================================

  useEffect(() => {
    if (!isLoggedIn) return;

    loadGroups();
  }, [isLoggedIn]);

  const loadGroups = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/groups`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setGroups(data);
      } else {
        console.error("Failed to load groups:", data);
      }
    } catch (error) {
      console.error("Group loading error:", error);
    }
  };

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    // LOGIN
    if (isLogin) {
      try {
        const formData = new URLSearchParams();

        formData.append("username", email);
        formData.append("password", password);

        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("token", data.access_token);

          setIsLoggedIn(true);
          setEmail("");
          setPassword("");
          setMessage("");
        } else {
          setMessage(data.detail || "Invalid email or password.");
        }
      } catch (error) {
        console.error("Login error:", error);
        setMessage("Cannot connect to the backend.");
      }

      return;
    }

    // REGISTER
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          name,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Account created successfully!");

        setName("");
        setEmail("");
        setPassword("");

        setTimeout(() => {
          setIsLogin(true);
          setMessage("");
        }, 1500);
      } else {
        setMessage(data.detail || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Cannot connect to the backend.");
    }
  };

  // =====================================================
  // CREATE GROUP
  // =====================================================

  const createGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) return;

    setGroupMessage("");

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/groups`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: groupName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGroupMessage("Group created successfully!");
        setGroupName("");

        // Reload groups from backend
        await loadGroups();
      } else {
        setGroupMessage(data.detail || "Could not create group.");
      }
    } catch (error) {
      console.error("Create group error:", error);
      setGroupMessage("Cannot connect to the backend.");
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");

    setIsLoggedIn(false);
    setUser(null);
    setGroups([]);

    setName("");
    setEmail("");
    setPassword("");

    setMessage("");
    setGroupMessage("");
  };

  // =====================================================
  // DASHBOARD
  // =====================================================

  if (isLoggedIn) {
    return (
      <div className="page">
        <div className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <h1>Expense Splitter</h1>

              <p className="subtitle dashboard-subtitle">
                {user
                  ? `Welcome, ${user.name}!`
                  : "Loading your account..."}
              </p>
            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <div className="dashboard-section">
            <h2>Create a Group</h2>

            <p className="section-description">
              Create a group for friends, roommates or trips.
            </p>

            <form
              className="group-form"
              onSubmit={createGroup}
            >
              <input
                type="text"
                placeholder="Example: Goa Trip"
                value={groupName}
                onChange={(e) =>
                  setGroupName(e.target.value)
                }
                required
              />

              <button type="submit">
                Create Group
              </button>
            </form>

            {groupMessage && (
              <p className="group-message">
                {groupMessage}
              </p>
            )}
          </div>

          <div className="dashboard-section">
            <h2>My Groups</h2>

            {groups.length === 0 ? (
              <div className="empty-groups">
                <div className="empty-icon">₹</div>

                <h3>No groups yet</h3>

                <p>
                  Create your first group above to start
                  splitting expenses.
                </p>
              </div>
            ) : (
              <div className="groups-grid">
                {groups.map((group) => (
                  <div
                    className="group-card"
                    key={group.id}
                  >
                    <div className="group-icon">
                      ₹
                    </div>

                    <div>
                      <h3>{group.name}</h3>
                      <p>Group #{group.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  return (
    <div className="page">
      <div className="auth-card">
        <div className="logo">₹</div>

        <h1>Expense Splitter</h1>

        <p className="subtitle">
          Split expenses with friends without the headache.
        </p>

        <div className="tabs">
          <button
            type="button"
            className={isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(true);
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(false);
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          <button
            className="submit-btn"
            type="submit"
          >
            {isLogin
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        {message && (
          <p className="bottom-text">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;