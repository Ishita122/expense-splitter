import { useEffect, useState } from "react";
import AddMember from "./components/AddMember";
import SplitExpense from "./components/SplitExpense";

import {
  loginUser,
  registerUser,
  getCurrentUser,
  getGroups,
  createGroup as createGroupApi,
  getExpenses,
  getBalances,
  saveToken,
  removeToken,
  getToken,
} from "./api/api";

import "./App.css";
import "./responsive.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()));
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);

  // =====================================================
  // CURRENT USER
  // =====================================================

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadCurrentUser = async () => {
      try {
        const { response, data } = await getCurrentUser();

        if (response.ok) {
          setUser(data);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("User loading error:", error);
      }
    };

    loadCurrentUser();
  }, [isLoggedIn]);

  // =====================================================
  // LOAD GROUPS AFTER LOGIN
  // =====================================================

  useEffect(() => {
    if (isLoggedIn) {
      loadGroups();
    }
  }, [isLoggedIn]);

  // =====================================================
  // LOAD GROUPS
  // =====================================================

  const loadGroups = async () => {
    try {
      const { response, data } = await getGroups();

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

    if (isLogin) {
      try {
        const { response, data } = await loginUser(email, password);

        if (response.ok) {
          saveToken(data.access_token);

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

    try {
      const { response, data } = await registerUser(
        name,
        email,
        password
      );

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

    try {
      const { response, data } = await createGroupApi(
        groupName.trim()
      );

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
      console.error("Create group error:", error);
      setGroupMessage("Cannot connect to backend.");
    }
  };

  // =====================================================
  // GROUP DATA
  // =====================================================

  const loadExpenses = async (groupId) => {
    try {
      const { response, data } = await getExpenses(groupId);

      if (response.ok) {
        setExpenses(data);
      }
    } catch (error) {
      console.error("Expense loading error:", error);
    }
  };

  const loadBalances = async (groupId) => {
    try {
      const { response, data } = await getBalances(groupId);

      if (response.ok) {
        setBalances(data);
      }
    } catch (error) {
      console.error("Balance loading error:", error);
    }
  };

  const openGroup = async (group) => {
    setSelectedGroup(group);
    setExpenses([]);
    setBalances([]);

    await Promise.all([
      loadExpenses(group.id),
      loadBalances(group.id),
    ]);
  };

  const refreshGroupData = async () => {
    if (!selectedGroup) return;

    await Promise.all([
      loadExpenses(selectedGroup.id),
      loadBalances(selectedGroup.id),
    ]);
  };

  const backToGroups = () => {
    setSelectedGroup(null);
    setExpenses([]);
    setBalances([]);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    removeToken();

    setIsLoggedIn(false);
    setUser(null);
    setGroups([]);
    setSelectedGroup(null);
    setExpenses([]);
    setBalances([]);
    setShowCreateGroup(false);

    setName("");
    setEmail("");
    setPassword("");
    setMessage("");
    setGroupMessage("");
  };

  // =====================================================
  // CALCULATED VALUES
  // =====================================================

  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount_cents,
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

  const currentBalance =
    balances.find(
      (balance) => balance.user_id === user?.id
    )?.net_cents || 0;

  // =====================================================
  // GROUP DETAILS
  // =====================================================

  if (isLoggedIn && selectedGroup) {
    return (
      <div className="app-background">
        <nav className="app-navbar">
          <div className="nav-inner">
            <div className="nav-brand">
              <div className="nav-logo">₹</div>
              <span>SplitEase</span>
            </div>

            <div className="nav-user">
              <div className="user-avatar">{userInitials}</div>

              <div className="user-details">
                <strong>{user?.name || "User"}</strong>
                <span>{user?.email || ""}</span>
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
          <button
            className="modern-back-btn"
            onClick={backToGroups}
          >
            ← Back to groups
          </button>

          <section className="group-page-header">
            <div>
              <span className="page-eyebrow">
                GROUP OVERVIEW
              </span>

              <h1>{selectedGroup.name}</h1>

              <p>
                Manage members, split expenses and review the
                group balance.
              </p>
            </div>

            <div className="group-number">
              Group #{selectedGroup.id}
            </div>
          </section>

          <section className="group-stats">
            <div className="stat-card">
              <div className="stat-icon purple">₹</div>

              <div>
                <span>Total Expenses</span>
                <strong>
                  ₹{(totalExpenses / 100).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">▤</div>

              <div>
                <span>Transactions</span>
                <strong>{expenses.length}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">◎</div>

              <div>
                <span>Your Balance</span>

                <strong>
                  {currentBalance > 0 ? "+" : ""}
                  ₹{(currentBalance / 100).toFixed(2)}
                </strong>
              </div>
            </div>
          </section>

          <AddMember groupId={selectedGroup.id} />

          {user && user.id && (
            <SplitExpense
              groupId={selectedGroup.id}
              currentUser={user}
              onExpenseCreated={refreshGroupData}
            />
          )}

          <section className="modern-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  ACTIVITY
                </span>
                <h2>Recent expenses</h2>
              </div>

              <span className="transaction-count">
                {expenses.length} transaction
                {expenses.length !== 1 ? "s" : ""}
              </span>
            </div>

            {expenses.length === 0 ? (
              <div className="modern-empty">
                <div>₹</div>
                <h3>No expenses yet</h3>
                <p>
                  Add your first shared expense to this group.
                </p>
              </div>
            ) : (
              <div className="modern-expense-list">
                {expenses.map((expense) => (
                  <div
                    className="modern-expense-row"
                    key={expense.id}
                  >
                    <div className="expense-symbol">₹</div>

                    <div className="expense-info">
                      <strong>{expense.description}</strong>
                      <span>
                        Paid by User #{expense.paid_by}
                      </span>
                    </div>

                    <strong className="modern-expense-amount">
                      ₹
                      {(expense.amount_cents / 100).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="modern-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  SETTLEMENT
                </span>
                <h2>Group balances</h2>
              </div>
            </div>

            {balances.length === 0 ? (
              <p className="muted-text">
                No balance information available.
              </p>
            ) : (
              <div className="modern-balance-list">
                {balances.map((balance) => {
                  const balanceAmount =
                    balance.net_cents / 100;

                  return (
                    <div
                      className="modern-balance-row"
                      key={balance.user_id}
                    >
                      <div className="balance-person">
                        <div className="small-avatar">
                          {balance.user_id === user?.id
                            ? userInitials
                            : "U"}
                        </div>

                        <div>
                          <strong>
                            {balance.user_id === user?.id
                              ? user?.name
                              : `User #${balance.user_id}`}
                          </strong>

                          <span>
                            {balance.user_id === user?.id
                              ? "You"
                              : `Member #${balance.user_id}`}
                          </span>
                        </div>
                      </div>

                      <strong>
                        {balanceAmount > 0 ? "+" : ""}
                        ₹{balanceAmount.toFixed(2)}
                      </strong>
                    </div>
                  );
                })}
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
              <div className="nav-logo">₹</div>
              <span>SplitEase</span>
            </div>

            <div className="nav-links">
              <button className="active">
                Dashboard
              </button>

              <button>Groups</button>
            </div>

            <div className="nav-user">
              <div className="user-avatar">{userInitials}</div>

              <div className="user-details">
                <strong>{user?.name || "User"}</strong>
                <span>{user?.email || ""}</span>
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
          <section className="welcome-section">
            <div>
              <span className="page-eyebrow">
                YOUR DASHBOARD
              </span>

              <h1>
                Welcome back,{" "}
                <span>{user?.name || "there"}!</span>{" "}
                👋
              </h1>

              <p>
                Here's an overview of your shared expenses
                and groups.
              </p>
            </div>

            <button
              className="primary-action create-group-top"
              onClick={() => {
                setShowCreateGroup(!showCreateGroup);
                setGroupMessage("");
              }}
            >
              {showCreateGroup
                ? "Close"
                : "+ New Group"}
            </button>
          </section>

          <section className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="stat-icon purple">◉</div>

              <div>
                <span>My Groups</span>
                <strong>{groups.length}</strong>
                <small>Active expense groups</small>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon blue">₹</div>

              <div>
                <span>Expense Tracking</span>
                <strong>Active</strong>
                <small>Connected to FastAPI</small>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon green">✓</div>

              <div>
                <span>Account</span>
                <strong>Secure</strong>
                <small>JWT authenticated</small>
              </div>
            </div>
          </section>

          {showCreateGroup && (
            <section className="create-group-panel">
              <div>
                <span className="section-eyebrow">
                  CREATE GROUP
                </span>

                <h2>Start a new expense group</h2>

                <p>
                  Create a group for a trip, flat, event or
                  anything you're sharing with friends.
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
                    setGroupName(e.target.value)
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

          <section className="groups-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  YOUR GROUPS
                </span>

                <h2>Shared expenses</h2>
              </div>

              <span className="group-count">
                {groups.length} group
                {groups.length !== 1 ? "s" : ""}
              </span>
            </div>

            {groups.length === 0 ? (
              <div className="modern-empty">
                <div>₹</div>
                <h3>No groups yet</h3>

                <p>
                  Create your first group to start splitting
                  expenses.
                </p>
              </div>
            ) : (
              <div className="modern-groups-grid">
                {groups.map((group, index) => (
                  <button
                    type="button"
                    className="modern-group-card"
                    key={group.id}
                    onClick={() => openGroup(group)}
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
                      <span>GROUP #{group.id}</span>
                      <h3>{group.name}</h3>

                      <p>
                        Track and manage shared expenses.
                      </p>
                    </div>

                    <div className="group-arrow">→</div>
                  </button>
                ))}
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
        <section className="auth-hero">
          <div className="brand">
            <div className="brand-icon">₹</div>
            <span>SplitEase</span>
          </div>

          <div className="hero-content">
            <span className="hero-badge">
              SMART EXPENSE SHARING
            </span>

            <h1>
              Split smarter.
              <br />
              <span>Live lighter.</span>
            </h1>

            <p>
              Keep trips, dinners and shared bills simple.
              Track expenses, organize groups and know
              exactly where your money went.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-check">✓</span>

                <div>
                  <strong>
                    Simple group expenses
                  </strong>

                  <small>
                    Create groups for trips, friends and
                    roommates.
                  </small>
                </div>
              </div>

              <div className="feature-item">
                <span className="feature-check">✓</span>

                <div>
                  <strong>
                    Clear expense history
                  </strong>

                  <small>
                    Keep every shared payment organized.
                  </small>
                </div>
              </div>

              <div className="feature-item">
                <span className="feature-check">✓</span>

                <div>
                  <strong>Balance tracking</strong>

                  <small>
                    See your group balances without messy
                    calculations.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <p className="hero-footer">
            Built for easier shared spending.
          </p>
        </section>

        <section className="auth-panel">
          <div className="mobile-brand">
            <div className="brand-icon">₹</div>
            <span>SplitEase</span>
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
                className={isLogin ? "active" : ""}
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                Sign In
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

            <form
              className="modern-auth-form"
              onSubmit={handleSubmit}
            >
              {!isLogin && (
                <div className="modern-form-group">
                  <label>Full name</label>

                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>

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
                </div>
              )}

              <div className="modern-form-group">
                <label>Email address</label>

                <div className="input-wrapper">
                  <span className="input-icon">✉</span>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <label>Password</label>

                <div className="input-wrapper">
                  <span className="input-icon">⌑</span>

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
              </div>

              <button
                className="modern-submit-btn"
                type="submit"
              >
                {isLogin
                  ? "Sign In"
                  : "Create Account"}

                <span>→</span>
              </button>
            </form>

            {message && (
              <div className="auth-message">
                {message}
              </div>
            )}

            <p className="auth-switch-text">
              {isLogin
                ? "New to SplitEase?"
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