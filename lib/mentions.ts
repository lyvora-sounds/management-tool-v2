export type Mentionable = { id: string; name: string | null; email: string };

// Lo que se escribe tras la «@»: el nombre, o el correo completo si no tiene nombre.
export const mentionHandle = (user: Mentionable) => user.name?.trim() || user.email;

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Ids de las personas mencionadas con «@Nombre» en un comentario. Coincide sin distinguir
 * mayúsculas y exige un límite tras el nombre, para que «@Ana» no cuente en «@Anabel». Los
 * nombres más largos se comprueban primero, así «@Ana María» no se confunde con «@Ana».
 */
export function findMentionedUserIds(content: string, users: Mentionable[]): string[] {
  const found = new Set<string>();
  let rest = content;
  const ordered = [...users].sort((a, b) => mentionHandle(b).length - mentionHandle(a).length);
  for (const user of ordered) {
    const pattern = new RegExp(`(^|[\\s(])@${escape(mentionHandle(user))}(?![\\p{L}\\p{N}_])`, "iu");
    if (pattern.test(rest)) {
      found.add(user.id);
      rest = rest.replace(new RegExp(pattern.source, "giu"), "$1");
    }
  }
  return [...found];
}
