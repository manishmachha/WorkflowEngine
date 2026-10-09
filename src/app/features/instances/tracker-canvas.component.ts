import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, HostListener, input, signal, viewChild } from '@angular/core';
import { NODE_KINDS, NodeKind, WorkflowDefinition, WorkflowNode } from '../../domain/definition';

const NODE_W = 176;
const NODE_H = 68;

@Component({
  selector: 'tracker-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    @let d = def();
    @if (d) {
      <div class="relative w-full h-full">
        <svg
          #svg
          class="w-full h-full rounded-lg select-none"
          [class.cursor-grabbing]="panning()"
          [class.cursor-grab]="!panning()"
          style="background:
            radial-gradient(circle at 20px 20px, #e2e8f0 1.2px, transparent 1.2px) 0 0 / 22px 22px,
            linear-gradient(180deg, #fbfbff, #f4f5fb);"
          (wheel)="onWheel($event)"
          (mousedown)="startPan($event)"
        >
          <defs>
            <marker id="tarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#94a3b8" />
            </marker>
            <marker id="tarrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#6366f1" />
            </marker>
            <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15" />
            </filter>
          </defs>

          <g [attr.transform]="'translate(' + viewport().x + ',' + viewport().y + ') scale(' + viewport().k + ')'">
            @for (t of d.transitions; track t.id) {
              @let f = nodeById(d, t.from);
              @let g = nodeById(d, t.to);
              @let taken = takenTransitions().has(t.id);
              @if (f && g) {
                <g>
                  <path
                    [attr.d]="edgePath(f, g)"
                    fill="none"
                    [attr.stroke]="taken ? '#6366f1' : '#cbd5e1'"
                    [attr.stroke-width]="taken ? 2.5 : 1.5"
                    [attr.marker-end]="taken ? 'url(#tarrow-active)' : 'url(#tarrow)'"
                    [class.wfe-active-edge]="taken && activeEdgeIds().has(t.id)"
                  />
                  @if (t.actionLabel) {
                    @let mid = edgeMid(f, g);
                    <g [attr.transform]="'translate(' + mid.x + ',' + mid.y + ')'">
                      <rect x="-42" y="-11" width="84" height="20" rx="10" fill="white" stroke="#e2e8f0" />
                      <text text-anchor="middle" y="3" font-size="10" fill="#1e293b" font-weight="600">
                        {{ t.actionLabel }}
                      </text>
                    </g>
                  }
                </g>
              }
            }

            @for (n of d.nodes; track n.id) {
              @let active = activeNodeIds().includes(n.id);
              <g [attr.transform]="'translate(' + n.ui.x + ',' + n.ui.y + ')'" filter="url(#nodeShadow)">
                <rect
                  [attr.width]="w"
                  [attr.height]="h"
                  rx="12"
                  fill="white"
                  [attr.stroke]="active ? '#6366f1' : '#e2e8f0'"
                  [attr.stroke-width]="active ? 2.5 : 1"
                />
                <rect [attr.width]="w" height="4" rx="12" [attr.fill]="colorFor(n.kind)" />
                <foreignObject x="10" y="12" [attr.width]="w - 20" [attr.height]="h - 20">
                  <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:inherit; color:#0f172a;">
                    <div style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600;">
                      <i class="bi {{ iconFor(n.kind) }}" [style.color]="colorFor(n.kind)"></i>
                      <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        {{ n.label }}
                      </span>
                    </div>
                    <div style="font-size:10px; color:#334155; text-transform: uppercase; letter-spacing:0.05em; margin-top: 2px; font-weight:600;">
                      {{ n.kind }}
                    </div>
                  </div>
                </foreignObject>
                @if (active) {
                  <circle [attr.cx]="w - 14" cy="14" r="6" fill="#6366f1">
                    <animate attributeName="r" values="5;9;5" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                }
              </g>
            }
          </g>
        </svg>

        <div class="absolute bottom-3 right-3 flex flex-col gap-1 bg-white/95 border border-slate-200 rounded-lg shadow-md p-1">
          <button class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="zoomBy(1.2)" title="Zoom in">
            <i class="bi bi-plus-lg"></i>
          </button>
          <div class="text-[10px] text-center text-slate-500 font-mono">{{ (viewport().k * 100) | number: '1.0-0' }}%</div>
          <button class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="zoomBy(1 / 1.2)" title="Zoom out">
            <i class="bi bi-dash-lg"></i>
          </button>
          <div class="border-t border-slate-100 my-1"></div>
          <button class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="fit()" title="Fit">
            <i class="bi bi-arrows-angle-contract"></i>
          </button>
        </div>
      </div>
    }
  `,
  styles: [':host { display:block; height:100%; }'],
})
export class TrackerCanvasComponent {
  def = input<WorkflowDefinition | null>(null);
  activeNodeIds = input<string[]>([]);
  takenTransitions = input<Set<string>>(new Set());
  activeEdgeIds = input<Set<string>>(new Set());

  w = NODE_W;
  h = NODE_H;

  svgRef = viewChild<ElementRef<SVGSVGElement>>('svg');
  viewport = signal({ x: 0, y: 0, k: 1 });
  panning = signal(false);
  private spaceHeld = false;
  private fitted = false;

  constructor() {
    effect(() => {
      const d = this.def();
      if (d && !this.fitted) {
        queueMicrotask(() => this.fit());
        this.fitted = true;
      }
    });
  }

  nodeById(d: WorkflowDefinition, id: string): WorkflowNode | undefined {
    return d.nodes.find((n) => n.id === id);
  }
  iconFor(k: NodeKind): string {
    return NODE_KINDS.find((x) => x.kind === k)?.icon ?? 'bi-square';
  }
  colorFor(k: NodeKind): string {
    return NODE_KINDS.find((x) => x.kind === k)?.color ?? '#64748b';
  }
  edgePath(a: WorkflowNode, b: WorkflowNode): string {
    const ax = a.ui.x + NODE_W;
    const ay = a.ui.y + NODE_H / 2;
    const bx = b.ui.x;
    const by = b.ui.y + NODE_H / 2;
    const midX = (ax + bx) / 2;
    return `M ${ax} ${ay} C ${midX} ${ay}, ${midX} ${by}, ${bx} ${by}`;
  }
  edgeMid(a: WorkflowNode, b: WorkflowNode) {
    return { x: (a.ui.x + NODE_W + b.ui.x) / 2, y: (a.ui.y + b.ui.y) / 2 + NODE_H / 2 };
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    const factor = Math.pow(1.0015, -e.deltaY);
    this.zoomAtClient(factor, e.clientX, e.clientY);
  }
  startPan(e: MouseEvent) {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    this.panning.set(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const v0 = this.viewport();
    const move = (ev: MouseEvent) => {
      this.viewport.set({ x: v0.x + (ev.clientX - startX), y: v0.y + (ev.clientY - startY), k: v0.k });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      this.panning.set(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }
  zoomBy(factor: number) {
    const svg = this.svgRef()?.nativeElement;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    this.zoomAtClient(factor, r.left + r.width / 2, r.top + r.height / 2);
  }
  private zoomAtClient(factor: number, clientX: number, clientY: number) {
    const svg = this.svgRef()!.nativeElement;
    const r = svg.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    const v = this.viewport();
    const newK = Math.max(0.15, Math.min(3, v.k * factor));
    const nx = px - (px - v.x) * (newK / v.k);
    const ny = py - (py - v.y) * (newK / v.k);
    this.viewport.set({ x: nx, y: ny, k: newK });
  }
  fit() {
    const d = this.def();
    const svg = this.svgRef()?.nativeElement;
    if (!d || !svg || !d.nodes.length) {
      this.viewport.set({ x: 0, y: 0, k: 1 });
      return;
    }
    const xs = d.nodes.map((n) => n.ui.x);
    const ys = d.nodes.map((n) => n.ui.y);
    const minX = Math.min(...xs) - 40;
    const minY = Math.min(...ys) - 40;
    const maxX = Math.max(...xs) + NODE_W + 40;
    const maxY = Math.max(...ys) + NODE_H + 40;
    const r = svg.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const k = Math.min(r.width / (maxX - minX), r.height / (maxY - minY), 1.5);
    this.viewport.set({ x: -minX * k + (r.width - (maxX - minX) * k) / 2, y: -minY * k + (r.height - (maxY - minY) * k) / 2, k });
  }

  @HostListener('window:keydown', ['$event']) onKD(e: KeyboardEvent) {
    if (e.code === 'Space') this.spaceHeld = true;
  }
  @HostListener('window:keyup', ['$event']) onKU(e: KeyboardEvent) {
    if (e.code === 'Space') this.spaceHeld = false;
  }
}
