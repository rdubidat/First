/**
 * GoHighLevel API Integration
 * Handles OAuth, contacts, calendars, and custom fields
 * Docs: https://highlevel.stoplight.io/docs/integrations
 */

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Read config from localStorage (set during OAuth callback or manual setup)
function getConfig() {
  const stored = localStorage.getItem('ghl_config');
  if (stored) return JSON.parse(stored);
  return {
    accessToken: '',
    refreshToken: '',
    locationId: '',
    companyId: '',
    apiKey: '',
  };
}

function saveConfig(config) {
  localStorage.setItem('ghl_config', JSON.stringify(config));
}

function getHeaders() {
  const config = getConfig();
  const token = config.accessToken || config.apiKey;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Version: '2021-07-28',
  };
}

// Generic fetch wrapper with error handling
async function ghlFetch(endpoint, options = {}) {
  const config = getConfig();
  if (!config.accessToken && !config.apiKey) {
    throw new Error('GHL not configured. Please connect your GoHighLevel account.');
  }

  const url = `${GHL_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });

  if (response.status === 401) {
    // Try to refresh the token
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryResponse = await fetch(url, {
        ...options,
        headers: { ...getHeaders(), ...options.headers },
      });
      if (!retryResponse.ok) {
        throw new Error(`GHL API error: ${retryResponse.status}`);
      }
      return retryResponse.json();
    }
    throw new Error('Authentication failed. Please reconnect your GoHighLevel account.');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GHL API error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

// OAuth token refresh
async function refreshAccessToken() {
  const config = getConfig();
  if (!config.refreshToken) return false;

  try {
    const response = await fetch(`${GHL_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: config.refreshToken,
        client_id: config.clientId || '',
        client_secret: config.clientSecret || '',
      }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    saveConfig({
      ...config,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });
    return true;
  } catch {
    return false;
  }
}

// ===== CONTACTS =====

export async function searchContacts(query = '', limit = 100) {
  const config = getConfig();
  const params = new URLSearchParams({
    locationId: config.locationId,
    limit: String(limit),
  });
  if (query) params.set('query', query);
  return ghlFetch(`/contacts/?${params}`);
}

export async function getContact(contactId) {
  return ghlFetch(`/contacts/${contactId}`);
}

export async function updateContactTags(contactId, tags) {
  return ghlFetch(`/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify({ tags }),
  });
}

export async function addContactNote(contactId, body) {
  return ghlFetch(`/contacts/${contactId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

// ===== CALENDARS =====

export async function getCalendars() {
  const config = getConfig();
  return ghlFetch(`/calendars/?locationId=${config.locationId}`);
}

export async function createCalendarEvent(calendarId, eventData) {
  return ghlFetch(`/calendars/events`, {
    method: 'POST',
    body: JSON.stringify({
      calendarId,
      ...eventData,
    }),
  });
}

export async function getCalendarEvents(calendarId, startTime, endTime) {
  const params = new URLSearchParams({
    calendarId,
    startTime,
    endTime,
  });
  return ghlFetch(`/calendars/events?${params}`);
}

export async function deleteCalendarEvent(eventId) {
  return ghlFetch(`/calendars/events/${eventId}`, {
    method: 'DELETE',
  });
}

// ===== CUSTOM FIELDS (for attendance data) =====

export async function getCustomFields() {
  const config = getConfig();
  return ghlFetch(`/locations/${config.locationId}/customFields`);
}

// ===== OPPORTUNITIES / PIPELINES (for tracking) =====

export async function createOpportunity(pipelineId, stageId, contactId, name) {
  return ghlFetch('/opportunities/', {
    method: 'POST',
    body: JSON.stringify({
      pipelineId,
      stageId,
      contactId,
      name,
      status: 'open',
    }),
  });
}

// ===== CONFIGURATION =====

export function isConfigured() {
  const config = getConfig();
  return !!(config.accessToken || config.apiKey) && !!config.locationId;
}

export function getGHLConfig() {
  return getConfig();
}

export function saveGHLConfig(config) {
  saveConfig(config);
}

export function clearGHLConfig() {
  localStorage.removeItem('ghl_config');
}

// Generate OAuth URL for app installation
export function getOAuthUrl(clientId, redirectUri, scopes) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
  });
  return `https://marketplace.gohighlevel.com/oauth/chooselocation?${params}`;
}

// Handle OAuth callback code exchange
export async function exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
  const response = await fetch(`${GHL_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) throw new Error('OAuth token exchange failed');
  const data = await response.json();

  saveConfig({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    locationId: data.locationId,
    companyId: data.companyId,
    clientId,
    clientSecret,
  });

  return data;
}
