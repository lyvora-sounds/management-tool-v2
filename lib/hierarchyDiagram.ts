export type HierarchyNode = {
  id: string;
  title: string;
  parentId: string | null;
  parentIds?: string[];
  childIds: string[];
  archived?: boolean;
  completed?: boolean;
  listTitle?: string;
};

type DiagramOptions = {
  focusId?: string;
  kicker?: string;
  note?: string;
};

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function charsFor(width: number, fontSize: number) {
  return Math.max(8, Math.floor(width / (fontSize * 0.62)));
}

function fitText(value: string, maxChars: number) {
  const compact = value.replace(/\s+/g, " ").trim();
  const chars = [...compact];
  if (chars.length <= maxChars) return compact;
  return `${chars.slice(0, Math.max(1, maxChars - 1)).join("").trimEnd()}…`;
}

function directParentIds(node: HierarchyNode): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const add = (id: string | null | undefined) => {
    if (!id || id === node.id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };
  for (const id of node.parentIds ?? []) add(id);
  add(node.parentId);
  return ids;
}

function parentsOf(
  node: HierarchyNode,
  byId: Map<string, HierarchyNode>,
) {
  const ordered: HierarchyNode[] = [];
  const seen = new Set<string>();
  const add = (parent: HierarchyNode | undefined) => {
    if (!parent || parent.id === node.id || seen.has(parent.id)) return;
    seen.add(parent.id);
    ordered.push(parent);
  };
  for (const id of directParentIds(node)) add(byId.get(id));
  for (const candidate of byId.values()) {
    if (candidate.childIds.includes(node.id)) add(candidate);
  }
  return ordered;
}

function childrenOf(
  node: HierarchyNode,
  byId: Map<string, HierarchyNode>,
  placed: Set<string>,
) {
  const ordered: HierarchyNode[] = [];
  const seen = new Set<string>();
  const add = (child: HierarchyNode | undefined) => {
    if (!child || child.id === node.id || placed.has(child.id) || seen.has(child.id)) return;
    seen.add(child.id);
    ordered.push(child);
  };
  for (const id of node.childIds) add(byId.get(id));
  for (const candidate of byId.values()) {
    if (directParentIds(candidate).includes(node.id)) add(candidate);
  }
  return ordered;
}

function linkedNodes(start: HierarchyNode, byId: Map<string, HierarchyNode>) {
  const members: HierarchyNode[] = [];
  const seen = new Set<string>();
  const queue = [start];
  while (queue.length) {
    const node = queue.shift()!;
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    members.push(node);
    for (const next of [...parentsOf(node, byId), ...childrenOf(node, byId, new Set())]) {
      if (!seen.has(next.id)) queue.push(next);
    }
  }
  return members;
}

function ranksForMembers(
  members: HierarchyNode[],
  byId: Map<string, HierarchyNode>,
  order: HierarchyNode[],
  focus: HierarchyNode,
) {
  const memberIds = new Set(members.map((node) => node.id));
  const roots = order.filter((node) => memberIds.has(node.id) && parentsOf(node, byId).length === 0);
  if (!roots.length) {
    return { roots: [focus], root: focus, cyclic: true, ranks: ranksFrom([focus], byId, new Set()) };
  }
  const placed = new Set(roots.map((node) => node.id));
  const seen = new Set<string>();
  const frontier: HierarchyNode[] = [];
  for (const root of roots) {
    for (const child of childrenOf(root, byId, placed)) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      frontier.push(child);
    }
  }
  return { roots, root: roots[0], cyclic: false, ranks: ranksFrom(frontier, byId, placed) };
}

function collectReachable(
  frontier: HierarchyNode[],
  byId: Map<string, HierarchyNode>,
  initialPlaced: Set<string>,
) {
  const reachable = new Set<string>();
  const visited = new Set<string>(initialPlaced);
  const queue = [...frontier];
  while (queue.length) {
    const node = queue.shift()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    reachable.add(node.id);
    for (const child of childrenOf(node, byId, visited)) {
      queue.push(child);
    }
  }
  return reachable;
}

function ranksFrom(
  frontier: HierarchyNode[],
  byId: Map<string, HierarchyNode>,
  placed: Set<string>,
) {
  const reachable = collectReachable(frontier, byId, placed);
  const ranks: HierarchyNode[][] = [];
  let current = frontier;
  while (current.length) {
    const seen = new Set<string>();
    const pending = current.filter((node) => {
      if (placed.has(node.id) || seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    });
    if (!pending.length) break;

    const ready = pending.filter((node) =>
      parentsOf(node, byId).every((parent) => !reachable.has(parent.id) || placed.has(parent.id)),
    );
    const rank = ready.length > 0 ? ready : pending;
    const rankIds = new Set(rank.map((node) => node.id));
    for (const node of rank) placed.add(node.id);
    ranks.push(rank);

    const waiting = pending.filter((node) => !rankIds.has(node.id));
    current = [
      ...waiting,
      ...rank.flatMap((node) => childrenOf(node, byId, placed)),
    ];
  }
  return ranks;
}

/**
 * Camino de un ticket: las raíces de su grafo y los pasos bajo ellas. Los hermanos comparten
 * paso. Un ticket espera a todos sus padres, también si esos padres cuelgan de otra raíz.
 * Las raíces no son un paso: son el título del recorrido. Sin raíz (ciclo puro), `cyclic` es true.
 */
export function hierarchyRanks(nodes: HierarchyNode[], focusId: string | undefined) {
  const focus = focusId ? nodes.find((node) => node.id === focusId) : undefined;
  if (!focus) return null;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const members = linkedNodes(focus, byId);
  return { focus, ...ranksForMembers(members, byId, nodes, focus) };
}

export type HierarchyStep = { step: number; total: number; rootId: string };

/**
 * Número de paso de cada ticket, el mismo que dibuja el diagrama de su grafo.
 * Las raíces no se numeran. Si un ticket está bloqueado desde otra raíz, el paso es el más largo.
 */
export function hierarchySteps(nodes: HierarchyNode[]): Map<string, HierarchyStep> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const steps = new Map<string, HierarchyStep>();
  const seen = new Set<string>();
  for (const start of nodes) {
    if (seen.has(start.id)) continue;
    const members = linkedNodes(start, byId);
    for (const member of members) seen.add(member.id);
    const { root, cyclic, ranks } = ranksForMembers(members, byId, nodes, start);
    if (cyclic) continue;
    ranks.forEach((rank, index) => {
      for (const node of rank) steps.set(node.id, { step: index + 1, total: ranks.length, rootId: root.id });
    });
  }
  return steps;
}

export function hierarchySvg(nodes: HierarchyNode[], options: DiagramOptions = {}): string | null {
  const layout = hierarchyRanks(nodes, options.focusId);
  if (!layout) return null;
  const { focus, roots, cyclic, ranks } = layout;
  if (!ranks.length) return null;

  const kicker = options.kicker ?? "PATH";
  const note = options.note ?? "Siblings on one step run together.";
  const heading = cyclic ? [focus] : roots;
  const title = heading.map((node) => node.title).join(" · ");
  const titleFill = heading.every((node) => node.archived) ? "#5E7695" : "#13233C";
  const nodeWidth = 200;
  const nodeGap = 28;
  const rankHeight = 118;
  const header = 118;
  const pad = 32;
  const widest = Math.max(...ranks.map((rank) => rank.length));
  const width = Math.max(640, pad * 2 + widest * nodeWidth + (widest - 1) * nodeGap);
  const height = header + ranks.length * rankHeight + pad;
  const stepChars = charsFor(nodeWidth - 8, 18);
  const headingLabel = escapeXml(fitText(title, charsFor(width - 64, 24)));

  const rankMarkup = ranks.map((rank, rankIndex) => {
    const rowWidth = rank.length * nodeWidth + (rank.length - 1) * nodeGap;
    const originX = Math.round((width - rowWidth) / 2);
    const y = header + rankIndex * rankHeight;
    const step = String(rankIndex + 1).padStart(2, "0");
    const line =
      rank.length > 1
        ? `<line x1="${originX + 17}" y1="${y + 17}" x2="${originX + rowWidth - nodeWidth + 17}" y2="${y + 17}" stroke="#D3A05B" stroke-width="1" stroke-opacity="0.85"/>`
        : "";
    const cards = rank.map((node, index) => {
      const x = originX + index * (nodeWidth + nodeGap);
      const clipId = `h-label-${rankIndex}-${index}`;
      const full = escapeXml(node.title);
      const label = escapeXml(fitText(node.title, stepChars));
      const fill = node.archived ? "#5E7695" : "#13233C";
      return `<g data-id="${escapeXml(node.id)}" data-step="${rankIndex + 1}"><title>${full}</title><clipPath id="${clipId}"><rect x="${x}" y="${y + 44}" width="${nodeWidth - 8}" height="32"/></clipPath><rect x="${x}" y="${y}" width="34" height="34" rx="4" fill="#FFFFFF" stroke="#DCDCDC" stroke-width="1"/><text x="${x + 17}" y="${y + 22}" text-anchor="middle" font-family="${MONO}" font-size="12" fill="#D3A05B">${step}</text><text clip-path="url(#${clipId})" x="${x}" y="${y + 62}" font-family="${FONT}" font-size="18" font-weight="600" fill="${fill}">${label}</text></g>`;
    }).join("");
    return `${line}${cards}`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="hierarchy-title hierarchy-desc"><title id="hierarchy-title">${escapeXml(title)}</title><desc id="hierarchy-desc">${escapeXml(note)}</desc><rect width="${width}" height="${height}" fill="#F7F7F7"/><rect x="32" y="28" width="1" height="16" fill="#D3A05B"/><text x="42" y="41" font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="0.22em" fill="#D3A05B">${escapeXml(kicker)}</text><text x="${width - 32}" y="41" text-anchor="end" font-family="${FONT}" font-size="12" fill="#5E7695">${escapeXml(note)}</text><clipPath id="h-heading"><rect x="32" y="52" width="${width - 64}" height="32"/></clipPath><text clip-path="url(#h-heading)" x="32" y="76" font-family="${FONT}" font-size="24" font-weight="600" letter-spacing="-0.025em" fill="${titleFill}">${headingLabel}</text><rect x="32" y="90" width="40" height="2" fill="#D3A05B"/>${rankMarkup}</svg>`;
}
