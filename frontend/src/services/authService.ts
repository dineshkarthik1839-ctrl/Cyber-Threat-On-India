import api from "./api";

export interface UserSession {
  accessToken: string;
  email: string;
  role: string;
}

export async function loginAnalyst(email: string, password: string): Promise<UserSession> {
  const response = await api.post<{ access_token: string; token_type: string; role: string; email: string }>(
    "/auth/login",
    { email, password }
  );
  
  const { access_token, role, email: resEmail } = response.data;
  
  localStorage.setItem("ictip_token", access_token);
  localStorage.setItem("ictip_user_email", resEmail);
  localStorage.setItem("ictip_user_role", role);
  
  return {
    accessToken: access_token,
    email: resEmail,
    role
  };
}

export function logoutAnalyst(): void {
  localStorage.removeItem("ictip_token");
  localStorage.removeItem("ictip_user_email");
  localStorage.removeItem("ictip_user_role");
  window.location.href = "/login";
}

export function getSessionUser(): { email: string | null; role: string | null } {
  return {
    email: localStorage.getItem("ictip_user_email"),
    role: localStorage.getItem("ictip_user_role")
  };
}

export function hasActiveSession(): boolean {
  return !!localStorage.getItem("ictip_token");
}

export async function verifyCurrentSession(): Promise<boolean> {
  if (!hasActiveSession()) return false;
  try {
    await api.get("/auth/me");
    return true;
  } catch {
    return false;
  }
}
