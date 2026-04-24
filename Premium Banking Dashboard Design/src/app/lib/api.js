const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (typeof payload === "object" && payload?.detail) ||
      (typeof payload === "string" && payload) ||
      "Une erreur serveur est survenue.";
    throw new Error(message);
  }

  return payload;
}

export function fetchClientIds(query = "") {
  const params = new URLSearchParams();
  if (query) {
    params.set("query", query);
  }

  return apiRequest(`/api/clients${params.toString() ? `?${params.toString()}` : ""}`);
}

export function fetchClientDetails(clientId) {
  return apiRequest(`/api/clients/${encodeURIComponent(clientId)}`);
}

export function fetchClientInsights(clientId) {
  return apiRequest(`/api/insights/${encodeURIComponent(clientId)}`);
}

export function fetchManagerClients({
  managerEmail,
  managerName,
  query = "",
  churnStatus = "all",
  segment = "all",
  limit = 250,
  sortBy = "churn",
} = {}) {
  const params = new URLSearchParams();

  if (managerEmail) {
    params.set("manager_email", managerEmail);
  }
  if (managerName) {
    params.set("manager_name", managerName);
  }
  if (query) {
    params.set("query", query);
  }
  if (churnStatus && churnStatus !== "all") {
    params.set("churn_status", churnStatus);
  }
  if (segment && segment !== "all") {
    params.set("segment", segment);
  }
  if (sortBy) {
    params.set("sort_by", sortBy);
  }
  if (limit) {
    params.set("limit", String(limit));
  }

  return apiRequest(`/api/manager/clients?${params.toString()}`);
}

export function submitAdvisorFeedback(payload) {
  return apiRequest("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generatePitch(payload) {
  return fetch(`${API_BASE_URL}/api/generate-pitch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    if (!response.ok) {
      const isJson = response.headers.get("content-type")?.includes("application/json");
      const payloadError = isJson ? await response.json() : await response.text();
      const message =
        (typeof payloadError === "object" && payloadError?.detail) ||
        (typeof payloadError === "string" && payloadError) ||
        "Une erreur serveur est survenue.";
      throw new Error(message);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return {
        model: response.headers.get("X-LLM-Model") || "mistral",
        pitch: "",
        source: "ollama-stream",
      };
    }

    const decoder = new TextDecoder("utf-8");
    let pitch = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      pitch += decoder.decode(value, { stream: true });
    }

    return {
      model: response.headers.get("X-LLM-Model") || "mistral",
      pitch: pitch.trim(),
      source: "ollama-stream",
    };
  });
}

export { API_BASE_URL };
