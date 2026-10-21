export type HierarchyNode = {
  id: string;
  title: string;
  parentId: string | null;
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
    if (candidate.parentId === node.id) add(candidate);
  }
  return ordered;
}

function climb(start: HierarchyNode, byId: Map<string, HierarchyNode>) {
  const seen = new Set<string>([start.id]);
  let current = start;
  while (current.parentId && byId.has(current.parentId)) {
    if (seen.has(current.parentId)) return { root: current, cyclic: true };
    seen.add(current.parentId);
    current = byId.get(current.parentId)!;
  }
  return { root: current, cyclic: false };
}

function ranksFrom(
  frontier: HierarchyNode[],
  byId: Map<string, HierarchyNode>,
  placed: Set<string>,
) {
  const ranks: HierarchyNode[][] = [];
  let current = frontier;
  while (current.length) {
    const rank = current.filter((node) => !placed.has(node.id));
    if (!rank.length) break;
    for (const node of rank) placed.add(node.id);
    ranks.push(rank);
    current = rank.flatMap((node) => childrenOf(node, byId, placed));
  }
  return ranks;
}

/**
 * Camino de un ticket: la raíz de su árbol y los pasos (rangos) bajo ella. Los hermanos comparten
 * paso y un hijo anidado es el paso siguiente. La raíz no es un paso: es el título del recorrido.
 * Con un ciclo, la raíz es el primer ticket repetido y `cyclic` es true.
 */
export function hierarchyRanks(nodes: HierarchyNode[], focusId: string | undefined) {
  const focus = focusId ? nodes.find((node) => node.id === focusId) : undefined;
  if (!focus) return null;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const { root, cyclic } = climb(focus, byId);
  const placed = new Set<string>();
  let ranks: HierarchyNode[][];
  if (cyclic) {
    ranks = ranksFrom([root], byId, placed);
  } else {
    placed.add(root.id);
    ranks = ranksFrom(childrenOf(root, byId, placed), byId, placed);
  }
  return { focus, root, cyclic, ranks };
}

export type HierarchyStep = { step: number; total: number; rootId: string };

/**
 * Número de paso de cada ticket del tablero que cuelga de una raíz, el mismo que dibuja el diagrama.
 * Las raíces no se numeran. Si un ticket aparece bajo dos raíces, vale la primera.
 */
export function hierarchySteps(nodes: HierarchyNode[]): Map<string, HierarchyStep> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const steps = new Map<string, HierarchyStep>();
  for (const root of nodes) {
    if (root.parentId && byId.has(root.parentId)) continue;
    const placed = new Set<string>([root.id]);
    const ranks = ranksFrom(childrenOf(root, byId, placed), byId, placed);
    ranks.forEach((rank, index) => {
      for (const node of rank) if (!steps.has(node.id)) steps.set(node.id, { step: index + 1, total: ranks.length, rootId: root.id });
    });
  }
  return steps;
}

export function hierarchySvg(nodes: HierarchyNode[], options: DiagramOptions = {}): string | null {
  const layout = hierarchyRanks(nodes, options.focusId);
  if (!layout) return null;
  const { focus, root, cyclic, ranks } = layout;
  if (!ranks.length) return null;

  const kicker = options.kicker ?? "PATH";
  const note = options.note ?? "Siblings on one step run together.";
  const heading = cyclic ? focus : root;
  const title = heading.title;
  const titleFill = heading.archived ? "#5E7695" : "#13233C";
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
