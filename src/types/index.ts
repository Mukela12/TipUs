export * from './database'

/** Auth user with role metadata */
export interface AuthUser {
  id: string
  email: string
  role: 'venue_owner' | 'employee' | 'admin'
  venue_id?: string
  employee_id?: string
  full_name?: string
  avatar_url?: string
}
