import { apiRequest } from './api'
import type { Gender, ProfileFor } from './auth'
import type { MaritalStatus, PartnerPreference, ProfileStatus, Religiosity, Sect } from './profile'
import type { InterestBetween } from './interests'

export type SearchSort = 'Newest' | 'Youngest' | 'Oldest'

export interface ProfileCard {
  id: number
  displayName: string
  age: number
  heightCm: number | null
  city: string
  state: string | null
  education: string | null
  occupation: string | null
  maritalStatus: MaritalStatus
  sect: Sect | null
  religiosity: Religiosity | null
  profileFor: ProfileFor
  photoId: number | null // only set if you may see the photo
  photoLocked: boolean // there is a photo, shown after an interest is accepted
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface ProfileDetail {
  id: number
  displayName: string
  isOwnProfile: boolean
  status: ProfileStatus
  profileFor: ProfileFor
  gender: Gender
  age: number
  maritalStatus: MaritalStatus
  heightCm: number | null
  country: string
  state: string | null
  city: string
  education: string | null
  occupation: string | null
  sect: Sect | null
  religiosity: Religiosity | null
  motherTongue: string | null
  aboutMe: string | null
  fatherOccupation: string | null
  motherOccupation: string | null
  brothers: number | null
  sisters: number | null
  familyDetails: string | null
  partnerPreference: PartnerPreference | null
  photoIds: number[]
  photosLocked: boolean
  interest: InterestBetween | null // what is going on between you and this member
  viewerIsApproved: boolean // only approved members can send interests
}

// ---------- Filters <-> URL (so Back, refresh and sharing a link keep the search) ----------

export interface SearchFilters {
  ageMin: string
  ageMax: string
  heightMinCm: string
  heightMaxCm: string
  maritalStatuses: string[]
  sects: string[]
  religiosities: string[]
  city: string
  education: string
  withPhotoOnly: boolean
  sort: SearchSort
  page: number
}

export const EMPTY_FILTERS: SearchFilters = {
  ageMin: '',
  ageMax: '',
  heightMinCm: '',
  heightMaxCm: '',
  maritalStatuses: [],
  sects: [],
  religiosities: [],
  city: '',
  education: '',
  withPhotoOnly: false,
  sort: 'Newest',
  page: 1,
}

export function filtersFromParams(sp: URLSearchParams): SearchFilters {
  const sort = sp.get('sort')
  return {
    ageMin: sp.get('ageMin') ?? '',
    ageMax: sp.get('ageMax') ?? '',
    heightMinCm: sp.get('heightMinCm') ?? '',
    heightMaxCm: sp.get('heightMaxCm') ?? '',
    maritalStatuses: sp.getAll('maritalStatuses'),
    sects: sp.getAll('sects'),
    religiosities: sp.getAll('religiosities'),
    city: sp.get('city') ?? '',
    education: sp.get('education') ?? '',
    withPhotoOnly: sp.get('withPhotoOnly') === 'true',
    sort: sort === 'Youngest' || sort === 'Oldest' ? sort : 'Newest',
    page: Math.max(1, Number(sp.get('page')) || 1),
  }
}

export function filtersToParams(f: SearchFilters): URLSearchParams {
  const sp = new URLSearchParams()
  const set = (key: string, value: string) => value.trim() && sp.set(key, value.trim())
  set('ageMin', f.ageMin)
  set('ageMax', f.ageMax)
  set('heightMinCm', f.heightMinCm)
  set('heightMaxCm', f.heightMaxCm)
  f.maritalStatuses.forEach((v) => sp.append('maritalStatuses', v))
  f.sects.forEach((v) => sp.append('sects', v))
  f.religiosities.forEach((v) => sp.append('religiosities', v))
  set('city', f.city)
  set('education', f.education)
  if (f.withPhotoOnly) sp.set('withPhotoOnly', 'true')
  if (f.sort !== 'Newest') sp.set('sort', f.sort)
  if (f.page > 1) sp.set('page', String(f.page))
  return sp
}

export const searchApi = {
  search: (params: URLSearchParams) =>
    apiRequest<PagedResult<ProfileCard>>(`/profiles/search?${params.toString()}`, { auth: true }),

  getProfile: (id: number) => apiRequest<ProfileDetail>(`/profiles/${id}`, { auth: true }),
}
