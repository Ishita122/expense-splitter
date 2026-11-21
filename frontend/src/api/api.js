const API_URL = "https://splitease-backend-tcra.onrender.com";

// =====================================================
// TOKEN
// =====================================================

export const getToken = () => {
  return localStorage.getItem("token");
};

export const saveToken = (token) => {
  localStorage.setItem("token", token);
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

// =====================================================
// AUTH HEADERS
// =====================================================

export const getAuthHeaders = () => {
  const token = getToken();

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getJsonAuthHeaders = () => {
  return {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
};

// =====================================================
// AUTHENTICATION
// =====================================================

export const loginUser = async (email, password) => {
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

  return {
    response,
    data,
  };
};

export const registerUser = async (
  name,
  email,
  password
) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  const data = await response.json();

  return {
    response,
    data,
  };
};

export const getCurrentUser = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  return {
    response,
    data,
  };
};

// =====================================================
// GROUPS
// =====================================================

export const getGroups = async () => {
  const response = await fetch(`${API_URL}/groups`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  return {
    response,
    data,
  };
};

export const createGroup = async (name) => {
  const response = await fetch(`${API_URL}/groups`, {
    method: "POST",

    headers: getJsonAuthHeaders(),

    body: JSON.stringify({
      name,
    }),
  });

  const data = await response.json();

  return {
    response,
    data,
  };
};

export const addGroupMember = async (
  groupId,
  userId
) => {
  const response = await fetch(
    `${API_URL}/groups/${groupId}/members`,
    {
      method: "POST",

      headers: getJsonAuthHeaders(),

      body: JSON.stringify({
        user_id: Number(userId),
      }),
    }
  );

  const data = await response.json();

  return {
    response,
    data,
  };
};

// =====================================================
// EXPENSES
// =====================================================

export const getExpenses = async (groupId) => {
  const response = await fetch(
    `${API_URL}/groups/${groupId}/expenses`,
    {
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  return {
    response,
    data,
  };
};

export const createExpense = async (
  groupId,
  expenseData
) => {
  const response = await fetch(
    `${API_URL}/groups/${groupId}/expenses`,
    {
      method: "POST",

      headers: getJsonAuthHeaders(),

      body: JSON.stringify(expenseData),
    }
  );

  const data = await response.json();

  return {
    response,
    data,
  };
};

// =====================================================
// BALANCES
// =====================================================

export const getBalances = async (groupId) => {
  const response = await fetch(
    `${API_URL}/groups/${groupId}/balances`,
    {
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  return {
    response,
    data,
  };
};