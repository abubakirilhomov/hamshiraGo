import { APIRequestContext } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

function uniquePhone(): string {
  return `+99890${Date.now().toString().slice(-7)}`;
}

export async function registerClient(request: APIRequestContext) {
  const phone = uniquePhone();
  const password = 'Test1234!';
  const res = await request.post(`${API_URL}/auth/register`, {
    data: { phone, password, name: 'Test Client' },
  });
  const json = await res.json();
  return { phone, password, token: json.access_token as string, user: json.user };
}

export async function loginClient(request: APIRequestContext, phone: string, password: string) {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { phone, password },
  });
  const json = await res.json();
  return { token: json.access_token as string, user: json.user };
}

export async function registerMedic(request: APIRequestContext) {
  const phone = uniquePhone();
  const password = 'Test1234!';
  const res = await request.post(`${API_URL}/medics/register`, {
    data: { phone, password, name: 'Test Medic', experienceYears: 3 },
  });
  const json = await res.json();
  return { phone, password, token: json.access_token as string, medic: json.medic };
}

export async function loginAdmin(request: APIRequestContext) {
  const res = await request.post(`${API_URL}/auth/admin/login`, {
    data: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
    },
  });
  const json = await res.json();
  return { token: json.access_token as string };
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}
