// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Helper function to set auth token
function setAuthToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

// Helper function to make authenticated API calls
function apiCall(method, endpoint, data = null) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const token = getAuthToken();
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  return fetch(`${API_BASE_URL}${endpoint}`, options)
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || `HTTP Error: ${response.status}`);
        });
      }
      return response.json();
    });
}

// Authentication APIs

/**
 * Register a new user
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
function registerUser(username, email, password, role) {
  return apiCall('POST', '/register', {
    username,
    email,
    password,
    role
  });
}

/**
 * Login user
 * @param {string} username
 * @param {string} password
 * @returns {Promise}
 */
function loginUser(username, password) {
  return apiCall('POST', '/login', {
    username,
    password
  });
}

/**
 * Get current logged-in user
 * @returns {Promise}
 */
function getCurrentUser() {
  return apiCall('GET', '/me');
}

/**
 * Logout user (clears local token)
 */
function logoutUser() {
  setAuthToken(null);
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userRole');
}

// Course/Enrollment APIs

/**
 * Get user's enrolled courses
 * @returns {Promise}
 */
function getEnrollments() {
  return apiCall('GET', '/enrollments');
}

/**
 * Enroll user in a course
 * @param {string} courseTitle
 * @param {string} courseImg
 * @returns {Promise}
 */
function enrollCourse(courseTitle, courseImg = null) {
  return apiCall('POST', '/enroll', {
    courseTitle,
    courseImg
  });
}

/**
 * Unenroll from a course
 * @param {string} courseTitle
 * @returns {Promise}
 */
function unenrollCourse(courseTitle) {
  return apiCall('DELETE', `/enrollments/${encodeURIComponent(courseTitle)}`);
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
  return !!getAuthToken();
}
