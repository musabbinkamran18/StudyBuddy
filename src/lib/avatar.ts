export const AVATAR_OPTIONS = [
  // Animals
  "🐼", "🦊", "🐯", "🦁", "🐸", "🐧", "🦄", "🐨", "🐙", "🦋",
  // Fantasy / Characters
  "🧙", "🦸", "🤖", "👾", "🧚", "🧜", "🧝", "👻", "🎩", "🦝",
  // Nature / Energy
  "🌻", "⭐", "🔥", "❄️", "⚡", "🌈", "🌙", "🍀", "🌊", "🌸",
] as const;

export type AvatarEmoji = (typeof AVATAR_OPTIONS)[number];

function avatarKey(userId: string) {
  return `avatar:${userId}`;
}

export function loadAvatar(userId: string): AvatarEmoji {
  try {
    const raw = localStorage.getItem(avatarKey(userId));
    if (raw && AVATAR_OPTIONS.includes(raw as AvatarEmoji)) return raw as AvatarEmoji;
  } catch {}
  return "⭐";
}

export function saveAvatar(userId: string, avatar: AvatarEmoji): void {
  localStorage.setItem(avatarKey(userId), avatar);
}
