const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthResponse {
  user: AuthUser;
}

async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${apiUrl}/api/auth/csrf`, {
    credentials: "include",
  });
  const result = (await response.json()) as { csrfToken?: string; error?: string };

  if (!response.ok || !result.csrfToken) {
    throw new Error(result.error ?? "No se pudo iniciar una solicitud segura.");
  }

  return result.csrfToken;
}

async function sendAuthRequest(
  path: string,
  body?: { email: string; password: string },
): Promise<AuthResponse | undefined> {
  const csrfToken = await getCsrfToken();
  const response = await fetch(`${apiUrl}/api/auth/${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined;
  }

  const result = (await response.json()) as AuthResponse & { error?: string };

  if (!response.ok) {
    throw new Error(result.error ?? "No se pudo completar la solicitud.");
  }

  return result;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthUser> {
    const result = await sendAuthRequest("login", { email, password });
    if (!result) throw new Error("Respuesta inválida del servidor.");
    return result.user;
  },

  async register(email: string, password: string): Promise<AuthUser> {
    const result = await sendAuthRequest("register", { email, password });
    if (!result) throw new Error("Respuesta inválida del servidor.");
    return result.user;
  },

  async me(): Promise<AuthUser | null> {
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      credentials: "include",
    });

    if (response.status === 401) {
      return null;
    }

    const result = (await response.json()) as AuthResponse & { error?: string };
    if (!response.ok) {
      throw new Error(result.error ?? "No se pudo comprobar la sesión.");
    }
    return result.user;
  },

  async logout(): Promise<void> {
    await sendAuthRequest("logout");
  },
};
