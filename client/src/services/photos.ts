import { apiBlob, apiRequest } from './api'

export type PhotoStatus = 'Pending' | 'Approved' | 'Rejected'

export interface MyPhoto {
  id: number
  isMain: boolean
  status: PhotoStatus
  uploadedAtUtc: string
}

// Same limits as PhotoService on the server
export const MAX_PHOTOS = 6
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const photosApi = {
  list: () => apiRequest<MyPhoto[]>('/profile/me/photos', { auth: true }),

  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file) // must match the controller parameter name
    return apiRequest<MyPhoto>('/profile/me/photos', { method: 'POST', body: form, auth: true })
  },

  remove: (id: number) => apiRequest<void>(`/profile/me/photos/${id}`, { method: 'DELETE', auth: true }),

  setMain: (id: number) => apiRequest<void>(`/profile/me/photos/${id}/main`, { method: 'PUT', auth: true }),

  image: (id: number) => apiBlob(`/photos/${id}`),
}
