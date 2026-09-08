import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';import { FormsModule } from '@angular/forms';
import { TuiIcon, TuiTextfield, TuiInputDirective } from '@taiga-ui/core';
import { OrgChartNode } from '../../components/org-chart-node/org-chart-node';
import { buildOrgTree, computeSearchMatches, OrgNode } from '../../model/org-chart.model';
import { MainHeading } from "../../../../../shared/components/main-heading/main-heading";
import { EmployeeService } from '../../services/employee.service';


@Component({
  selector: 'app-org-chart',
  standalone: true,
imports: [OrgChartNode, FormsModule, TuiTextfield, TuiIcon, TuiInputDirective, MainHeading],
  templateUrl: './org-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgChart implements OnInit {
  private readonly employeeService = inject(EmployeeService);

  protected isLoading = signal(false);
  protected allEmployees = computed(() => this.employeeService.allEmployees() ?? []);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.employeeService.getAllEmployees().subscribe({
      complete: () => this.isLoading.set(false),
    });
  }

  protected roots = computed<OrgNode[]>(() => buildOrgTree(this.allEmployees()));

  protected totalHeadcount = computed(() => this.allEmployees().length);

  @ViewChild('scrollContainer') private scrollContainerRef!: ElementRef<HTMLDivElement>;

protected isDragging = signal(false);
private dragStartX = 0;
private dragStartY = 0;
private scrollStartLeft = 0;
private scrollStartTop = 0;

protected onDragStart(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (target.closest('button, input, a')) return;

  const el = this.scrollContainerRef.nativeElement;
  this.isDragging.set(true);
  this.dragStartX = event.pageX;
  this.dragStartY = event.pageY;
  this.scrollStartLeft = el.scrollLeft;
  this.scrollStartTop = el.scrollTop;
  event.preventDefault();
}

@HostListener('window:mousemove', ['$event'])
protected onDragMove(event: MouseEvent): void {
  if (!this.isDragging()) return;
  const el = this.scrollContainerRef.nativeElement;
  el.scrollLeft = this.scrollStartLeft - (event.pageX - this.dragStartX);
  el.scrollTop = this.scrollStartTop - (event.pageY - this.dragStartY);
}

@HostListener('window:mouseup')
@HostListener('window:mouseleave')
protected onDragEnd(): void {
  this.isDragging.set(false);
}

protected zoom = signal(1);
private readonly minZoom = 0.4;
private readonly maxZoom = 2;

protected onWheelZoom(event: WheelEvent): void {
  event.preventDefault();

  const delta = -event.deltaY * 0.0015;
  this.zoom.update((z) => Math.min(this.maxZoom, Math.max(this.minZoom, z + delta)));
}


protected zoomIn(): void {
  this.zoom.update((z) => Math.min(this.maxZoom, z + 0.1));
}

protected zoomOut(): void {
  this.zoom.update((z) => Math.max(this.minZoom, z - 0.1));
}

protected resetZoom(): void {
  
}}