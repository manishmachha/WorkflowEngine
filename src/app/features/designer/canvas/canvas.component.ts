import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DesignerStore } from '../designer.store';
import { NODE_KINDS, NodeKind, WorkflowNode } from '../../../domain/definition';

const NODE_W = 160;
const NODE_H = 60;

@Component({
  selector: 'designer-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let d = store.def();
    @if (d) {
      <div class="relative w-full h-full">
        <svg
          #svg
          class="w-full h-full select-none"
          [class.cursor-grab]="!panning()"
          [class.cursor-grabbing]="panning()"
          style="background:
            radial-gradient(circle at 20px 20px, #e2e8f0 1.2px, transparent 1.2px) 0 0 / 22px 22px,
            linear-gradient(180deg, #fbfbff, #f4f5fb);"
          (dragover)="$event.preventDefault()"
          (drop)="onDrop($event)"
          (click)="onCanvasClick()"
          (wheel)="onWheel($event)"
          (mousedown)="onCanvasMouseDown($event)"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#94a3b8" />
            </marker>
            <marker id="arrow-selected" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#4f46e5" />
            </marker>
          </defs>

          <g [attr.transform]="'translate(' + viewport().x + ',' + viewport().y + ') scale(' + viewport().k + ')'">
            @for (t of d.transitions; track t.id) {
              @let f = nodeById(t.from);
              @let g = nodeById(t.to);
              @if (f && g) {
                @let selected = t.id === store.selectedTransition()?.id;
                @let hovered = t.id === hoveredEdgeId();
                <g
                  class="designer-edge-group"
                  (mouseenter)="hoveredEdgeId.set(t.id)"
                  (mouseleave)="hoveredEdgeId.set(null)"
                >
                  <path
                    [attr.d]="edgePath(f, g)"
                    fill="none"
                    stroke="transparent"
                    stroke-width="22"
                    pointer-events="stroke"
                    (click)="onEdgeClick($event, t.id)"
                    class="cursor-pointer"
                  />
                  <path
                    [attr.d]="edgePath(f, g)"
                    fill="none"
                    pointer-events="none"
                    [attr.stroke]="selected ? '#4f46e5' : hovered ? '#6366f1' : '#94a3b8'"
                    [attr.stroke-width]="selected ? 3 : hovered ? 2.5 : 1.75"
                    [attr.marker-end]="selected || hovered ? 'url(#arrow-selected)' : 'url(#arrow)'"
                    [attr.opacity]="hovered && !selected ? 0.95 : 1"
                  />
                  @let mid = midPoint(f, g);
                  <g
                    (click)="onEdgeClick($event, t.id)"
                    class="cursor-pointer"
                    [attr.transform]="'translate(' + mid.x + ',' + mid.y + ')'"
                  >
                    <rect
                      x="-56"
                      y="-13"
                      width="112"
                      height="24"
                      rx="6"
                      [attr.fill]="selected ? '#eef2ff' : '#fff'"
                      [attr.stroke]="selected ? '#4f46e5' : hovered ? '#a5b4fc' : '#e2e8f0'"
                      stroke-width="1.5"
                    />
                    <text x="0" y="4" text-anchor="middle" font-size="10" fill="#1e293b" font-weight="600">
                      {{ edgeLabel(t) }}
                    </text>
                  </g>
                </g>
              }
            }

            @for (n of d.nodes; track n.id) {
              <g
                [attr.transform]="'translate(' + n.ui.x + ',' + n.ui.y + ')'"
                [attr.data-node-id]="n.id"
                (mousedown)="startDrag($event, n)"
                (click)="onNodeClick($event, n.id)"
                class="cursor-move"
              >
                <rect
                  [attr.width]="w"
                  [attr.height]="h"
                  rx="8"
                  fill="white"
                  [attr.stroke]="n.id === store.selectedNode()?.id ? '#4f46e5' : '#cbd5e1'"
                  [attr.stroke-width]="n.id === store.selectedNode()?.id ? 2 : 1"
                  filter="drop-shadow(0 1px 2px rgb(0 0 0 / 0.06))"
                />
                <rect [attr.width]="w" height="6" rx="8" [attr.fill]="colorFor(n.kind)" />
                <foreignObject x="8" y="14" [attr.width]="w - 16" [attr.height]="h - 20">
                  <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: inherit; color: #0f172a; font-size: 12px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <i class="bi {{ iconFor(n.kind) }}" [style.color]="colorFor(n.kind)"></i>
                      <span style="font-weight:600;">{{ n.label }}</span>
                    </div>
                    <div style="font-size:10px; color:#475569; margin-top:2px;">{{ n.kind }}</div>
                  </div>
                </foreignObject>
                <circle
                  [attr.cx]="w"
                  [attr.cy]="h / 2"
                  r="6"
                  fill="#4f46e5"
                  class="cursor-crosshair"
                  (mousedown)="startConnect($event, n)"
                />
              </g>
            }

            @if (connecting()) {
              <path [attr.d]="connectPath()" stroke="#4f46e5" stroke-width="2" stroke-dasharray="4" fill="none" />
            }
          </g>
        </svg>

        <div
          class="absolute bottom-4 right-4 flex flex-col gap-1 bg-white/95 border border-slate-200 rounded-lg shadow-md p-1"
        >
          <button class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="zoomBy(1.2)" title="Zoom in">
            <i class="bi bi-plus-lg"></i>
          </button>
          <div class="text-[10px] text-center text-slate-500 font-mono">
            {{ (viewport().k * 100) | number: '1.0-0' }}%
          </div>
          <button class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="zoomBy(1 / 1.2)" title="Zoom out">
            <i class="bi bi-dash-lg"></i>
          </button>
          <div class="border-t border-slate-100 my-1"></div>
          <button class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="fitToScreen()" title="Fit to screen">
            <i class="bi bi-arrows-angle-contract"></i>
          </button>
          <button class="wfe-btn wfe-btn-ghost wfe-btn-icon" (click)="resetView()" title="Reset zoom">
            <i class="bi bi-fullscreen-exit"></i>
          </button>
        </div>
        <div class="absolute bottom-4 left-4 text-[11px] text-slate-500 bg-white/80 rounded px-2 py-1 border border-slate-200">
          <i class="bi bi-mouse2 mr-1"></i> scroll = zoom · middle-drag or Space+drag = pan
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .designer-edge-group {
        transition: opacity 0.12s ease;
      }
    `,
  ],
  imports: [DecimalPipe],
})
export class CanvasComponent {
  store = inject(DesignerStore);
  w = NODE_W;
  h = NODE_H;
  svgRef = viewChild<ElementRef<SVGSVGElement>>('svg');
  private dragging = signal<{ id: string; dx: number; dy: number } | null>(null);
  private connectFrom = signal<{ id: string; x: number; y: number } | null>(null);
  private cursor = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  viewport = signal({ x: 0, y: 0, k: 1 });
  panning = signal(false);
  hoveredEdgeId = signal<string | null>(null);
  private spaceHeld = false;

  connecting = computed(() => this.connectFrom() != null);
  connectPath = computed(() => {
    const f = this.connectFrom();
    const c = this.cursor();
    if (!f) return '';
    return `M ${f.x} ${f.y} L ${c.x} ${c.y}`;
  });

  nodeById(id: string): WorkflowNode | undefined {
    return this.store.def()?.nodes.find((n) => n.id === id);
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
  midPoint(a: WorkflowNode, b: WorkflowNode) {
    return { x: (a.ui.x + NODE_W + b.ui.x) / 2, y: (a.ui.y + b.ui.y + NODE_H) / 2 };
  }

  edgeLabel(t: { actionLabel?: string; actionKey?: string; isDefault?: boolean }): string {
    return t.actionLabel || t.actionKey || (t.isDefault ? 'default' : 'transition');
  }

  onNodeClick(e: MouseEvent, id: string) {
    e.stopPropagation();
    this.store.selectNode(id);
  }
  onEdgeClick(e: MouseEvent, id: string) {
    e.stopPropagation();
    this.store.selectTransition(id);
  }
  onCanvasClick() {
    if (!this.panning()) this.store.selectNode(null);
  }

  startDrag(e: MouseEvent, n: WorkflowNode) {
    if (this.spaceHeld || e.button !== 0) return;
    e.stopPropagation();
    const svg = this.svgRef()!.nativeElement;
    const pt = this.toCanvas(e, svg);
    this.dragging.set({ id: n.id, dx: pt.x - n.ui.x, dy: pt.y - n.ui.y });
    const move = (ev: MouseEvent) => {
      const p = this.toCanvas(ev, svg);
      const dref = this.dragging();
      if (!dref) return;
      this.store.moveNode(dref.id, p.x - dref.dx, p.y - dref.dy);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      this.dragging.set(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  startConnect(e: MouseEvent, n: WorkflowNode) {
    e.stopPropagation();
    const svg = this.svgRef()!.nativeElement;
    const from = { id: n.id, x: n.ui.x + NODE_W, y: n.ui.y + NODE_H / 2 };
    this.connectFrom.set(from);
    this.cursor.set({ x: from.x, y: from.y });
    const move = (ev: MouseEvent) => this.cursor.set(this.toCanvas(ev, svg));
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as Element | null;
      const g = el?.closest('g[data-node-id]') as SVGGElement | null;
      const targetId = g?.getAttribute('data-node-id');
      if (targetId && targetId !== n.id) this.store.addTransition(n.id, targetId);
      this.connectFrom.set(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    const kind = e.dataTransfer?.getData('application/x-wfe-node') as NodeKind;
    if (!kind) return;
    const svg = e.currentTarget as SVGSVGElement;
    const p = this.toCanvas(e, svg);
    this.store.addNode(kind, p.x - NODE_W / 2, p.y - NODE_H / 2);
  }

  onCanvasMouseDown(e: MouseEvent) {
    // Middle-mouse or space+left → pan
    if (e.button === 1 || (this.spaceHeld && e.button === 0)) {
      e.preventDefault();
      e.stopPropagation();
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
  }

  onWheel(e: WheelEvent) {
    if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 4) return;
    e.preventDefault();
    const factor = Math.pow(1.0015, -e.deltaY);
    this.zoomAtClient(factor, e.clientX, e.clientY);
  }

  zoomBy(factor: number) {
    const svg = this.svgRef()?.nativeElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    this.zoomAtClient(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
  private zoomAtClient(factor: number, clientX: number, clientY: number) {
    const svg = this.svgRef()!.nativeElement;
    const rect = svg.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const v = this.viewport();
    const newK = Math.max(0.15, Math.min(3, v.k * factor));
    // Keep the point under the cursor stable.
    const nx = px - (px - v.x) * (newK / v.k);
    const ny = py - (py - v.y) * (newK / v.k);
    this.viewport.set({ x: nx, y: ny, k: newK });
  }

  resetView() {
    this.viewport.set({ x: 0, y: 0, k: 1 });
  }
  fitToScreen() {
    const def = this.store.def();
    const svg = this.svgRef()?.nativeElement;
    if (!def || !svg || !def.nodes.length) return this.resetView();
    const xs = def.nodes.map((n) => n.ui.x);
    const ys = def.nodes.map((n) => n.ui.y);
    const minX = Math.min(...xs) - 40;
    const minY = Math.min(...ys) - 40;
    const maxX = Math.max(...xs) + NODE_W + 40;
    const maxY = Math.max(...ys) + NODE_H + 40;
    const rect = svg.getBoundingClientRect();
    const k = Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY), 1.5);
    this.viewport.set({ x: -minX * k, y: -minY * k, k });
  }

  private toCanvas(e: { clientX: number; clientY: number }, svg: SVGSVGElement) {
    const rect = svg.getBoundingClientRect();
    const v = this.viewport();
    return { x: (e.clientX - rect.left - v.x) / v.k, y: (e.clientY - rect.top - v.y) / v.k };
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space') this.spaceHeld = true;
  }
  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') this.spaceHeld = false;
  }
}
