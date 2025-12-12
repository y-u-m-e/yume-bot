/**
 * =============================================================================
 * YUME API CLIENT
 * =============================================================================
 * 
 * HTTP client for interacting with the yume-api backend.
 * Provides methods for all available API endpoints.
 * 
 * @module lib/api
 */

/**
 * Create an API client instance
 * @param {string} baseUrl - Base URL for the API
 * @param {string} [apiKey] - Optional API key for authenticated requests
 * @returns {object} API client with methods for each endpoint
 */
export function createApiClient(baseUrl, apiKey = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  /**
   * Make an HTTP request to the API
   * @param {string} endpoint - API endpoint path
   * @param {object} options - Fetch options
   * @returns {Promise<object>} JSON response
   */
  async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  }

  return {
    // =========================================================================
    // HEALTH
    // =========================================================================
    
    /**
     * Check API health status
     * @returns {Promise<object>} Health status
     */
    async health() {
      return request('/health');
    },

    // =========================================================================
    // ATTENDANCE / LEADERBOARD
    // =========================================================================

    /**
     * Get attendance leaderboard
     * @param {object} params - Query parameters
     * @param {string} [params.event] - Filter by event name
     * @param {string} [params.start] - Start date (YYYY-MM-DD)
     * @param {string} [params.end] - End date (YYYY-MM-DD)
     * @param {number} [params.limit] - Results limit
     * @returns {Promise<object>} Leaderboard data
     */
    async getLeaderboard(params = {}) {
      const query = new URLSearchParams();
      if (params.event) query.set('event', params.event);
      if (params.start) query.set('start', params.start);
      if (params.end) query.set('end', params.end);
      if (params.limit) query.set('limit', params.limit.toString());
      
      const queryString = query.toString();
      return request(`/attendance${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get attendance records
     * @param {object} params - Query parameters
     * @param {string} [params.name] - Filter by player name
     * @param {string} [params.event] - Filter by event name
     * @param {string} [params.start] - Start date (YYYY-MM-DD)
     * @param {string} [params.end] - End date (YYYY-MM-DD)
     * @param {number} [params.page] - Page number
     * @param {number} [params.limit] - Results per page
     * @returns {Promise<object>} Attendance records
     */
    async getAttendanceRecords(params = {}) {
      const query = new URLSearchParams();
      if (params.name) query.set('name', params.name);
      if (params.event) query.set('event', params.event);
      if (params.start) query.set('start', params.start);
      if (params.end) query.set('end', params.end);
      if (params.page) query.set('page', params.page.toString());
      if (params.limit) query.set('limit', params.limit.toString());
      
      const queryString = query.toString();
      return request(`/attendance/records${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Create an attendance record
     * @param {object} data - Record data
     * @param {string} data.name - Player name
     * @param {string} data.event - Event name
     * @param {string} data.date - Date (YYYY-MM-DD)
     * @returns {Promise<object>} Created record
     */
    async createAttendanceRecord(data) {
      return request('/attendance/records', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // =========================================================================
    // TILE EVENTS
    // =========================================================================

    /**
     * Get list of tile events
     * @returns {Promise<object>} List of tile events
     */
    async getTileEvents() {
      return request('/tile-events');
    },

    /**
     * Get tile event details including tiles
     * @param {number} eventId - Event ID
     * @returns {Promise<object>} Event details with tiles
     */
    async getTileEventDetails(eventId) {
      return request(`/tile-events/${eventId}`);
    },

    /**
     * Get participant progress for an event
     * @param {number} eventId - Event ID
     * @param {string} [discordId] - Optional Discord ID to filter
     * @returns {Promise<object>} Participant progress
     */
    async getTileEventProgress(eventId, discordId = null) {
      const query = discordId ? `?discord_id=${discordId}` : '';
      return request(`/tile-events/${eventId}/progress${query}`);
    },

    // =========================================================================
    // ADMIN USERS
    // =========================================================================

    /**
     * Get admin user info
     * @param {string} discordId - Discord user ID
     * @returns {Promise<object>} User info with permissions
     */
    async getUser(discordId) {
      return request(`/admin/users?discord_id=${discordId}`);
    },
  };
}

/**
 * Default API client instance
 */
export const api = createApiClient(
  process.env.API_BASE_URL || 'https://api.itai.gg',
  process.env.API_KEY
);

