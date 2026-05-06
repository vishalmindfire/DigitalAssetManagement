const API_URL = import.meta.env.VITE_API_URL;
interface LoginResponse {
  success: boolean;
  user: { id: string; name: string; email: string };
}
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const bodyContent = {
    email: email,
    password: password,
  };
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyContent),
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.message || 'Invalid Credentials');
  }
  return { success: true, user: data.user };
};
