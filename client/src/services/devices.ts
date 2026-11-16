import { apiRequest } from './api'

// This phone's push notification address (see server DevicesController)
export const devicesApi = {
  register: (token: string) =>
    apiRequest<void>('/devices', { method: 'POST', body: { token, platform: 'Android' }, auth: true }),
  unregister: (token: string) =>
    apiRequest<void>('/devices', { method: 'DELETE', body: { token }, auth: true }),
}
