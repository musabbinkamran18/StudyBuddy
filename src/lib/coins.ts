// Coin economy: balance, shop items, inventory, login rewards

export interface CoinState {
  balance: number;
  xpBoosts: number;
  streakFreezes: number;
  loginCycleDay: number; // 0-6: which day of 7-day cycle was last claimed
  lastLoginClaimDate: string; // YYYY-MM-DD
}

export interface LoginReward {
  day: number; // 1-7
  emoji: string;
  label: string;
  coins?: number;
  xpBoost?: number;
  streakFreeze?: number;
}

export const LOGIN_REWARDS: LoginReward[] = [
  { day: 1, emoji: "💎", label: "10 Coins", coins: 10 },
  { day: 2, emoji: "💎", label: "15 Coins", coins: 15 },
  { day: 3, emoji: "⚡", label: "XP Boost", xpBoost: 1 },
  { day: 4, emoji: "💎", label: "20 Coins", coins: 20 },
  { day: 5, emoji: "🧊", label: "Streak Freeze", streakFreeze: 1 },
  { day: 6, emoji: "💎", label: "30 Coins", coins: 30 },
  { day: 7, emoji: "🎁", label: "50 Coins + Freeze", coins: 50, streakFreeze: 1 },
];

export interface ShopItem {
  id: "xpBoost" | "streakFreeze";
  emoji: string;
  label: string;
  description: string;
  price: number;
  inventoryKey: "xpBoosts" | "streakFreezes";
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "xpBoost",
    emoji: "⚡",
    label: "XP Boost",
    description: "2× XP for your next session",
    price: 30,
    inventoryKey: "xpBoosts",
  },
  {
    id: "streakFreeze",
    emoji: "🧊",
    label: "Streak Freeze",
    description: "Protect your streak on a missed day",
    price: 50,
    inventoryKey: "streakFreezes",
  },
];

function coinKey(userId: string) {
  return `coins:${userId}`;
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

export function loadCoinState(userId: string): CoinState {
  try {
    const raw = localStorage.getItem(coinKey(userId));
    if (raw) return JSON.parse(raw) as CoinState;
  } catch {}
  return {
    balance: 0,
    xpBoosts: 0,
    streakFreezes: 0,
    loginCycleDay: 0,
    lastLoginClaimDate: "",
  };
}

function saveCoinState(userId: string, state: CoinState): void {
  localStorage.setItem(coinKey(userId), JSON.stringify(state));
}

export function earnCoins(userId: string, amount: number): CoinState {
  const state = loadCoinState(userId);
  state.balance = Math.max(0, state.balance + amount);
  saveCoinState(userId, state);
  return state;
}

export function buyItem(
  userId: string,
  itemId: "xpBoost" | "streakFreeze",
): { success: boolean; state: CoinState; error?: string } {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { success: false, state: loadCoinState(userId), error: "Item not found" };

  const state = loadCoinState(userId);
  if (state.balance < item.price) {
    return { success: false, state, error: "Not enough coins" };
  }

  state.balance -= item.price;
  (state[item.inventoryKey] as number) += 1;
  saveCoinState(userId, state);
  return { success: true, state };
}

export function hasXpBoost(userId: string): boolean {
  return loadCoinState(userId).xpBoosts > 0;
}

export function useXpBoost(userId: string): boolean {
  const state = loadCoinState(userId);
  if (state.xpBoosts <= 0) return false;
  state.xpBoosts -= 1;
  saveCoinState(userId, state);
  return true;
}

export function hasStreakFreeze(userId: string): boolean {
  return loadCoinState(userId).streakFreezes > 0;
}

export function useStreakFreeze(userId: string): boolean {
  const state = loadCoinState(userId);
  if (state.streakFreezes <= 0) return false;
  state.streakFreezes -= 1;
  saveCoinState(userId, state);
  return true;
}

// Returns null if already claimed today; returns the reward if just claimed
export function checkAndClaimLoginReward(
  userId: string,
): { claimed: boolean; reward?: LoginReward; nextDay: number } {
  const state = loadCoinState(userId);
  const today = todayKey();

  if (state.lastLoginClaimDate === today) {
    return { claimed: false, nextDay: ((state.loginCycleDay) % 7) + 1 };
  }

  // Advance cycle (0-6 maps to day 1-7)
  const nextCycleDay = (state.loginCycleDay) % 7;
  const reward = LOGIN_REWARDS[nextCycleDay]!;

  state.loginCycleDay = (nextCycleDay + 1) % 7;
  state.lastLoginClaimDate = today;

  if (reward.coins) state.balance += reward.coins;
  if (reward.xpBoost) state.xpBoosts += reward.xpBoost;
  if (reward.streakFreeze) state.streakFreezes += reward.streakFreeze;

  saveCoinState(userId, state);
  return { claimed: true, reward, nextDay: state.loginCycleDay + 1 };
}
