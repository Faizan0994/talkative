const baseUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const TOKEN_KEY = "talkative_access_token";

export class ApiError extends Error {
  constructor(status, messages) {
    super(messages[0] || "Something went wrong");
    this.name = "ApiError";
    this.status = status;
    this.messages = messages;
  }
}

async function request(method, path, body) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, [
      "Unable to connect to server. Please check your connection.",
    ]);
  }

  if (res.status === 204 || res.status === 304) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const messages =
      Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors
        : [`Request failed (${res.status} ${res.statusText})`];
    throw new ApiError(res.status, messages);
  }

  return data;
}

export function get(path) {
  return request("GET", path);
}

export function post(path, body) {
  return request("POST", path, body);
}

export function put(path, body) {
  return request("PUT", path, body);
}

export function patch(path, body) {
  return request("PATCH", path, body);
}

export function del(path) {
  return request("DELETE", path);
}
