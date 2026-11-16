/**
 * ForgeCode Nexus: Code Radar Visualizer
 * Real-Time 2D Module Topology & Token Flow Graph
 * 
 * Generates an interactive SVG radar visualizer representing:
 * - Module Nodes: Radius proportional to token budget footprint
 * - Topological Edges: Import dependencies and call graph relations
 * - Dynamic Heat Rings: Live color shifts indicating agent edits (Emerald),
 *   dependency propagation (Cyan), and unvisited files (Slate).
 */

export interface RadarNode {
  id: string;
  label: string;
  tokens: number;
  x: number;
  y: number;
  status: 'modified' | 'active_context' | 'dependency' | 'dormant';
}

export interface RadarEdge {
  source: string;
  target: string;
  weight: number;
}

export class CodeRadarVisualizer {
  /**
   * Generates a dynamic SVG code radar diagram from a list of files and imports.
   */
  public generateSvgRadar(
    files: Array<{ path: string; tokens: number; status: 'modified' | 'active_context' | 'dependency' | 'dormant' }>,
    dependencies: Array<{ from: string; to: string }>
  ): string {
    const width = 640;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    // Arrange nodes in concentric orbital rings
    const nodes: RadarNode[] = [];
    const count = files.length || 1;
    const radius = 130;

    files.forEach((f, idx) => {
      const angle = (idx / count) * 2 * Math.PI;
      const x = Math.round(centerX + radius * Math.cos(angle));
      const y = Math.round(centerY + radius * Math.sin(angle));
      nodes.push({
        id: f.path,
        label: f.path.split('/').pop() || f.path,
        tokens: f.tokens,
        x,
        y,
        status: f.status
      });
    });

    // Build SVG elements
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background:#090d16;border-radius:8px;font-family:system-ui,-apple-system,sans-serif;">\n`;
    
    // Background Radar Grid & Rings
    svg += `  <defs>
    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#090d16" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#radarGlow)" />
  <circle cx="${centerX}" cy="${centerY}" r="70" fill="none" stroke="#1e293b" stroke-dasharray="4 4" stroke-width="1"/>
  <circle cx="${centerX}" cy="${centerY}" r="130" fill="none" stroke="#334155" stroke-width="1"/>
  <circle cx="${centerX}" cy="${centerY}" r="180" fill="none" stroke="#1e293b" stroke-dasharray="2 4" stroke-width="1"/>
  <line x1="${centerX}" y1="20" x2="${centerX}" y2="${height - 20}" stroke="#1e293b" stroke-width="0.8"/>
  <line x1="20" y1="${centerY}" x2="${width - 20}" y2="${centerY}" stroke="#1e293b" stroke-width="0.8"/>\n`;

    // Center Core Node (TrueForge Agent Harness)
    svg += `  <circle cx="${centerX}" cy="${centerY}" r="16" fill="#0284c7" filter="url(#glow)" />
  <text x="${centerX}" y="${centerY + 4}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">TrueForge</text>\n`;

    // Dependency Edges
    dependencies.forEach(d => {
      const srcNode = nodes.find(n => n.id === d.from);
      const tgtNode = nodes.find(n => n.id === d.to);
      if (srcNode && tgtNode) {
        svg += `  <line x1="${srcNode.x}" y1="${srcNode.y}" x2="${tgtNode.x}" y2="${tgtNode.y}" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="3 3"/>\n`;
      }
    });

    // File Nodes
    nodes.forEach(n => {
      let fillColor = '#64748b'; // dormant
      if (n.status === 'modified') fillColor = '#10b981'; // emerald
      else if (n.status === 'active_context') fillColor = '#06b6d4'; // cyan
      else if (n.status === 'dependency') fillColor = '#818cf8'; // indigo

      const nodeRadius = Math.max(12, Math.min(24, Math.round(Math.sqrt(n.tokens || 100))));

      svg += `  <!-- Node: ${n.id} -->
  <g>
    <circle cx="${n.x}" cy="${n.y}" r="${nodeRadius + 4}" fill="${fillColor}" opacity="0.25" filter="url(#glow)" />
    <circle cx="${n.x}" cy="${n.y}" r="${nodeRadius}" fill="${fillColor}" stroke="#ffffff" stroke-width="1.5" />
    <text x="${n.x}" y="${n.y + nodeRadius + 14}" fill="#e2e8f0" font-size="10" font-weight="600" text-anchor="middle">${n.label}</text>
    <text x="${n.x}" y="${n.y + nodeRadius + 24}" fill="#94a3b8" font-size="8" text-anchor="middle">${n.tokens} tk</text>
  </g>\n`;
    });

    svg += `</svg>`;
    return svg;
  }
}
