import { UserRole } from '../../theme/ThemeContext';

export interface DemoAccount {
  label: string;
  email: string;
  pass: string;
  role: UserRole;
}

/** Seeded accounts. Shared by the sign-in sheet's quick login and the role switcher. */
export const SAMPLE_ACCOUNTS: DemoAccount[] = [
  { label: 'Customer (Amina)', email: 'amina@gmail.com', pass: 'password123', role: 'customer' },
  { label: 'Customer (Emeka)', email: 'emeka@gmail.com', pass: 'password123', role: 'customer' },
  { label: 'Artisan (Tunde - Plumber)', email: 'tunde@plumbing.ng', pass: 'password123', role: 'artisan' },
  { label: 'Artisan (Ibrahim - Electrician)', email: 'ibrahim@sparks.ng', pass: 'password123', role: 'artisan' },
  { label: 'Artisan (Chidi - Carpenter)', email: 'chidi@woodcraft.ng', pass: 'password123', role: 'artisan' },
  { label: 'System Admin', email: 'admin@artisanhub.ng', pass: 'password123', role: 'admin' },
];
