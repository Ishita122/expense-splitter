import { useEffect, useState } from "react";
import AddMember from "./components/AddMember";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [user, setUser] = useState(null);

  // Authentication
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Groups
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseMessage, setExpenseMessage] = useState("");

  // Balances
  const [balances, setBalances] = useState([]);

  // =====================================================
  // CURRENT USER
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
  // GROUPS
  // =====================================================

  useEffect(() => {
    if (isLoggedIn) {
      loadGroups();
    }
  }, [isLoggedIn]);

  const loadGroups = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setGroups(data);
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
        console.error(error);
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
      console.error(error);
      setMessage("Cannot connect to the backend.");
    }
  };

  // =====================================================
  // CREATE GROUP
  // =====================================================

  const createGroup = async (e) => {
    e.preventDefault();

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
        setGroupName("");
        setGroupMessage("Group created successfully!");

        await loadGroups();

        setTimeout(() => {
          setShowCreateGroup(false);
          setGroupMessage("");
        }, 1200);
      } else {
        setGroupMessage(data.detail || "Could not create group.");
      }
    } catch (error) {
      console.error(error);
      setGroupMessage("Cannot connect to backend.");
    }
  };

  // =====================================================
  // OPEN GROUP
  // =====================================================

  const openGroup = async (group) => {
    setSelectedGroup(group);
    setExpenseMessage("");

    await loadExpenses(group.id);
    await loadBalances(group.id);
  };

  // =====================================================
  // EXPENSES
  // =====================================================

  const loadExpenses = async (groupId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/groups/${groupId}/expenses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setExpenses(data);
      }
    } catch (error) {
      console.error("Expense loading error:", error);
    }
  };

  const loadBalances = async (groupId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/groups/${groupId}/balances`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBalances(data);
      }
    } catch (error) {
      console.error("Balance loading error:", error);
    }
  };

  const createExpense = async (e) => {
    e.preventDefault();

    if (!user || !selectedGroup) return;

    const rupees = Number(amount);

    if (
      !description.trim() ||
      !Number.isFinite(rupees) ||
      rupees <= 0
    ) {
      setExpenseMessage(
        "Enter a valid description and amount."
      );
      return;
    }

    const amountCents = Math.round(rupees * 100);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/groups/${selectedGroup.id}/expenses`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            description,
            paid_by: user.id,
            amount_cents: amountCents,

            splits: [
              {
                user_id: user.id,
                share_cents: amountCents,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDescription("");
        setAmount("");

        setExpenseMessage(
          "Expense added successfully!"
        );

        await loadExpenses(selectedGroup.id);
        await loadBalances(selectedGroup.id);
      } else {
        setExpenseMessage(
          data.detail || "Could not add expense."
        );
      }
    } catch (error) {
      console.error(error);
      setExpenseMessage(
        "Cannot connect to backend."
      );
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
    setSelectedGroup(null);

    setExpenses([]);
    setBalances([]);

    setShowCreateGroup(false);

    setEmail("");
    setPassword("");
    setMessage("");
  };

  // =====================================================
  // CALCULATED VALUES
  // =====================================================

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + expense.amount_cents,
    0
  );

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // =====================================================
  // GROUP DETAILS
  // =====================================================

  if (isLoggedIn && selectedGroup) {
    return (
      <div className="app-background">

        {/* NAVBAR */}

        <nav className="app-navbar">
          <div className="nav-inner">

            <div className="nav-brand">
              <div className="nav-logo">
                ₹
              </div>

              <span>
                Splitly
              </span>
            </div>

            <div className="nav-user">

              <div className="user-avatar">
                {userInitials}
              </div>

              <div className="user-details">
                <strong>
                  {user?.name || "User"}
                </strong>

                <span>
                  {user?.email || ""}
                </span>
              </div>

              <button
                className="nav-logout"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          </div>
        </nav>

        {/* PAGE */}

        <main className="app-content">

          <button
            className="modern-back-btn"
            onClick={() => {
              setSelectedGroup(null);
              setExpenses([]);
              setBalances([]);
              setExpenseMessage("");
            }}
          >
            ← Back to groups
          </button>

          {/* GROUP HEADER */}

          <section className="group-page-header">

            <div>
              <span className="page-eyebrow">
                GROUP OVERVIEW
              </span>

              <h1>
                {selectedGroup.name}
              </h1>

              <p>
                Manage expenses and review the
                group balance.
              </p>
            </div>

            <div className="group-number">
              Group #{selectedGroup.id}
            </div>

          </section>

          {/* STATS */}

          <section className="group-stats">

            <div className="stat-card">

              <div className="stat-icon purple">
                ₹
              </div>

              <div>
                <span>
                  Total Expenses
                </span>

                <strong>
                  ₹
                  {(totalExpenses / 100).toFixed(2)}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon blue">
                ▤
              </div>

              <div>
                <span>
                  Transactions
                </span>

                <strong>
                  {expenses.length}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon green">
                ◎
              </div>

              <div>
                <span>
                  Your Balance
                </span>

                <strong>
                  ₹
                  {(
                    (
                      balances.find(
                        (balance) =>
                          balance.user_id ===
                          user?.id
                      )?.net_cents || 0
                    ) / 100
                  ).toFixed(2)}
                </strong>
              </div>

            </div>

          </section>

          {/* =========================================
              ADD MEMBER
          ========================================= */}

          <AddMember
            groupId={selectedGroup.id}
          />

          {/* =========================================
              ADD EXPENSE
          ========================================= */}

          <section className="modern-section">

            <div className="section-heading">

              <div>
                <span className="section-eyebrow">
                  NEW TRANSACTION
                </span>

                <h2>
                  Add an expense
                </h2>
              </div>

            </div>

            <form
              className="modern-expense-form"
              onSubmit={createExpense}
            >

              <div className="field">

                <label>
                  Description
                </label>

                <input
                  type="text"
                  placeholder="e.g. Dinner, hotel, cab..."
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

              <div className="field">

                <label>
                  Amount
                </label>

                <div className="money-input">

                  <span>
                    ₹
                  </span>

                  <input
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>

              <button
                className="primary-action"
                type="submit"
              >
                Add Expense +
              </button>

            </form>

            {expenseMessage && (
              <div className="success-message">
                {expenseMessage}
              </div>
            )}

          </section>

          {/* =========================================
              EXPENSE HISTORY
          ========================================= */}

          <section className="modern-section">

            <div className="section-heading">

              <div>
                <span className="section-eyebrow">
                  ACTIVITY
                </span>

                <h2>
                  Recent expenses
                </h2>
              </div>

              <span className="transaction-count">
                {expenses.length} transaction
                {expenses.length !== 1
                  ? "s"
                  : ""}
              </span>

            </div>

            {expenses.length === 0 ? (

              <div className="modern-empty">

                <div>
                  ₹
                </div>

                <h3>
                  No expenses yet
                </h3>

                <p>
                  Add your first expense to
                  this group.
                </p>

              </div>

            ) : (

              <div className="modern-expense-list">

                {expenses.map((expense) => (

                  <div
                    className="modern-expense-row"
                    key={expense.id}
                  >

                    <div className="expense-symbol">
                      ₹
                    </div>

                    <div className="expense-info">

                      <strong>
                        {expense.description}
                      </strong>

                      <span>
                        Paid by User #
                        {expense.paid_by}
                      </span>

                    </div>

                    <strong className="modern-expense-amount">
                      ₹
                      {(
                        expense.amount_cents /
                        100
                      ).toFixed(2)}
                    </strong>

                  </div>

                ))}

              </div>

            )}

          </section>

          {/* =========================================
              BALANCES
          ========================================= */}

          <section className="modern-section">

            <div className="section-heading">

              <div>

                <span className="section-eyebrow">
                  SETTLEMENT
                </span>

                <h2>
                  Group balances
                </h2>

              </div>

            </div>

            {balances.length === 0 ? (

              <p className="muted-text">
                No balance information
                available.
              </p>

            ) : (

              <div className="modern-balance-list">

                {balances.map((balance) => (

                  <div
                    className="modern-balance-row"
                    key={balance.user_id}
                  >

                    <div className="balance-person">

                      <div className="small-avatar">

                        {balance.user_id ===
                        user?.id
                          ? userInitials
                          : "U"}

                      </div>

                      <div>

                        <strong>
                          {balance.user_id ===
                          user?.id
                            ? user?.name
                            : `User #${balance.user_id}`}
                        </strong>

                        <span>
                          {balance.user_id ===
                          user?.id
                            ? "You"
                            : `Member #${balance.user_id}`}
                        </span>

                      </div>

                    </div>

                    <strong>
                      ₹
                      {(
                        balance.net_cents /
                        100
                      ).toFixed(2)}
                    </strong>

                  </div>

                ))}

              </div>

            )}

          </section>

        </main>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  if (isLoggedIn) {
    return (
      <div className="app-background">

        <nav className="app-navbar">

          <div className="nav-inner">

            <div className="nav-brand">

              <div className="nav-logo">
                ₹
              </div>

              <span>
                Splitly
              </span>

            </div>

            <div className="nav-links">

              <button className="active">
                Dashboard
              </button>

              <button>
                Groups
              </button>

            </div>

            <div className="nav-user">

              <div className="user-avatar">
                {userInitials}
              </div>

              <div className="user-details">

                <strong>
                  {user?.name || "User"}
                </strong>

                <span>
                  {user?.email || ""}
                </span>

              </div>

              <button
                className="nav-logout"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          </div>

        </nav>

        <main className="app-content">

          {/* WELCOME */}

          <section className="welcome-section">

            <div>

              <span className="page-eyebrow">
                YOUR DASHBOARD
              </span>

              <h1>
                Welcome back,{" "}
                <span>
                  {user?.name || "there"}!
                </span>{" "}
                👋
              </h1>

              <p>
                Here's an overview of your
                shared expenses and groups.
              </p>

            </div>

            <button
              className="primary-action create-group-top"
              onClick={() => {
                setShowCreateGroup(
                  !showCreateGroup
                );

                setGroupMessage("");
              }}
            >
              {showCreateGroup
                ? "Close"
                : "+ New Group"}
            </button>

          </section>

          {/* STATS */}

          <section className="dashboard-stats">

            <div className="dashboard-stat-card">

              <div className="stat-icon purple">
                ◉
              </div>

              <div>

                <span>
                  My Groups
                </span>

                <strong>
                  {groups.length}
                </strong>

                <small>
                  Active expense groups
                </small>

              </div>

            </div>

            <div className="dashboard-stat-card">

              <div className="stat-icon blue">
                ₹
              </div>

              <div>

                <span>
                  Expense Tracking
                </span>

                <strong>
                  Active
                </strong>

                <small>
                  Connected to FastAPI
                </small>

              </div>

            </div>

            <div className="dashboard-stat-card">

              <div className="stat-icon green">
                ✓
              </div>

              <div>

                <span>
                  Account
                </span>

                <strong>
                  Secure
                </strong>

                <small>
                  JWT authenticated
                </small>

              </div>

            </div>

          </section>

          {/* CREATE GROUP */}

          {showCreateGroup && (

            <section className="create-group-panel">

              <div>

                <span className="section-eyebrow">
                  CREATE GROUP
                </span>

                <h2>
                  Start a new expense group
                </h2>

                <p>
                  Create a group for a trip,
                  flat, event or anything
                  you're sharing with friends.
                </p>

              </div>

              <form
                className="modern-group-form"
                onSubmit={createGroup}
              >

                <input
                  type="text"
                  placeholder="e.g. Manali Trip"
                  value={groupName}
                  onChange={(e) =>
                    setGroupName(
                      e.target.value
                    )
                  }
                  required
                />

                <button type="submit">
                  Create Group →
                </button>

              </form>

              {groupMessage && (
                <div className="success-message">
                  {groupMessage}
                </div>
              )}

            </section>

          )}

          {/* GROUPS */}

          <section className="groups-section">

            <div className="section-heading">

              <div>

                <span className="section-eyebrow">
                  YOUR GROUPS
                </span>

                <h2>
                  Shared expenses
                </h2>

              </div>

              <span className="group-count">
                {groups.length} group
                {groups.length !== 1
                  ? "s"
                  : ""}
              </span>

            </div>

            {groups.length === 0 ? (

              <div className="modern-empty">

                <div>
                  ₹
                </div>

                <h3>
                  No groups yet
                </h3>

                <p>
                  Create your first group
                  to start splitting expenses.
                </p>

              </div>

            ) : (

              <div className="modern-groups-grid">

                {groups.map(
                  (group, index) => (

                    <button
                      type="button"
                      className="modern-group-card"
                      key={group.id}
                      onClick={() =>
                        openGroup(group)
                      }
                    >

                      <div
                        className={`group-card-icon ${
                          index % 3 === 0
                            ? "purple"
                            : index % 3 === 1
                            ? "blue"
                            : "green"
                        }`}
                      >
                        ₹
                      </div>

                      <div className="group-card-content">

                        <span>
                          GROUP #{group.id}
                        </span>

                        <h3>
                          {group.name}
                        </h3>

                        <p>
                          Track and manage
                          shared expenses.
                        </p>

                      </div>

                      <div className="group-arrow">
                        →
                      </div>

                    </button>

                  )
                )}

              </div>

            )}

          </section>

        </main>
      </div>
    );
  }

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  return (
    <div className="auth-page">

      <div className="auth-shell">

        {/* LEFT SIDE */}

        <section className="auth-hero">

          <div className="brand">

            <div className="brand-icon">
              ₹
            </div>

            <span>
              Splitly
            </span>

          </div>

          <div className="hero-content">

            <span className="hero-badge">
              SMART EXPENSE SHARING
            </span>

            <h1>
              Split smarter.
              <br />

              <span>
                Live lighter.
              </span>
            </h1>

            <p>
              Keep trips, dinners and shared
              bills simple. Track expenses,
              organize groups and know exactly
              where your money went.
            </p>

            <div className="feature-list">

              <div className="feature-item">

                <span className="feature-check">
                  ✓
                </span>

                <div>

                  <strong>
                    Simple group expenses
                  </strong>

                  <small>
                    Create groups for trips,
                    friends and roommates.
                  </small>

                </div>

              </div>

              <div className="feature-item">

                <span className="feature-check">
                  ✓
                </span>

                <div>

                  <strong>
                    Clear expense history
                  </strong>

                  <small>
                    Keep every shared payment
                    organized.
                  </small>

                </div>

              </div>

              <div className="feature-item">

                <span className="feature-check">
                  ✓
                </span>

                <div>

                  <strong>
                    Balance tracking
                  </strong>

                  <small>
                    See your group balances
                    without messy calculations.
                  </small>

                </div>

              </div>

            </div>

          </div>

          <p className="hero-footer">
            Built for easier shared spending.
          </p>

        </section>

        {/* RIGHT SIDE */}

        <section className="auth-panel">

          <div className="mobile-brand">

            <div className="brand-icon">
              ₹
            </div>

            <span>
              Splitly
            </span>

          </div>

          <div className="auth-panel-content">

            <span className="auth-eyebrow">
              {isLogin
                ? "WELCOME BACK"
                : "GET STARTED"}
            </span>

            <h2>
              {isLogin
                ? "Sign in to your account"
                : "Create your account"}
            </h2>

            <p className="auth-description">
              {isLogin
                ? "Continue managing your shared expenses."
                : "Start splitting expenses without the awkward maths."}
            </p>

            <div className="auth-tabs">

              <button
                type="button"
                className={
                  isLogin
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                Sign In
              </button>

              <button
                type="button"
                className={
                  !isLogin
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
              >
                Register
              </button>

            </div>

            <form
              className="modern-auth-form"
              onSubmit={handleSubmit}
            >

              {!isLogin && (

                <div className="modern-form-group">

                  <label>
                    Full name
                  </label>

                  <div className="input-wrapper">

                    <span className="input-icon">
                      👤
                    </span>

                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>

                </div>

              )}

              <div className="modern-form-group">

                <label>
                  Email address
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ✉
                  </span>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>

              <div className="modern-form-group">

                <label>
                  Password
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ⌑
                  </span>

                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>

              <button
                className="modern-submit-btn"
                type="submit"
              >
                {isLogin
                  ? "Sign In"
                  : "Create Account"}

                <span>
                  →
                </span>
              </button>

            </form>

            {message && (
              <div className="auth-message">
                {message}
              </div>
            )}

            <p className="auth-switch-text">

              {isLogin
                ? "New to Splitly?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
              >
                {isLogin
                  ? "Create an account"
                  : "Sign in"}
              </button>

            </p>

          </div>

        </section>

      </div>

    </div>
  );
}

export default App;