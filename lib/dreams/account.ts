import { getRedis } from '@/lib/redis';

export interface PrototypeAccount {
  email: string;
  displayName: string | null;
  claimedAt: number;
}

export interface AccountState {
  claimed: boolean;
  emailMasked: string | null;
  displayName: string | null;
  claimedAt: number | null;
}

function accountKey(fpHash: string): string {
  return `account:${fpHash}`;
}

export function normalizeEmail(email: string): string | null {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return null;
  return clean;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const head = local.slice(0, 2);
  return `${head}${local.length > 2 ? '...' : ''}@${domain}`;
}

export function publicAccountState(account: PrototypeAccount | null): AccountState {
  if (!account) {
    return {
      claimed: false,
      emailMasked: null,
      displayName: null,
      claimedAt: null,
    };
  }
  return {
    claimed: true,
    emailMasked: maskEmail(account.email),
    displayName: account.displayName,
    claimedAt: account.claimedAt,
  };
}

export async function getPrototypeAccount(fpHash: string): Promise<PrototypeAccount | null> {
  const raw = await getRedis().get<PrototypeAccount | string>(accountKey(fpHash));
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as PrototypeAccount;
    } catch {
      return null;
    }
  }
  return raw;
}

export async function setPrototypeAccount(
  fpHash: string,
  input: { email: string; displayName?: string | null },
): Promise<AccountState> {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error('invalid_email');
  }
  const displayName = input.displayName?.trim() || null;
  const account: PrototypeAccount = {
    email,
    displayName,
    claimedAt: Date.now(),
  };
  await getRedis().set(accountKey(fpHash), JSON.stringify(account));
  return publicAccountState(account);
}
