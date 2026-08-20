import { ChangeDetectionStrategy, Component, Input, computed, effect, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { TuiIcon } from '@taiga-ui/core';
import { countDescendants, OrgNode } from '../../model/org-chart.model';

@Component({
  selector: 'app-org-chart-node',
  standalone: true,
  imports: [NgClass, TuiIcon],
  templateUrl: './org-chart-node.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgChartNode {
  @Input({ required: true }) node!: OrgNode;
  @Input() isRoot = false;
  /** Lowercased search term from the parent chart, '' means no active search. */
  @Input() searchTerm = '';

  @Input() matchIds: ReadonlySet<string> = new Set();

constructor() {
  effect(() => {
    this.searchTerm;
    this.userToggled.set(null);
  }, { allowSignalWrites: true });
}

private userToggled = signal<boolean | null>(null);

/** True only when this node itself is the reason its branch is in the result set — kept simple by reusing matchIds for both self and subtree, since the set already includes ancestors of matches. Distinguish self-match separately: */
protected isMatch = computed(() => {
  if (!this.searchTerm) return false;
  const emp = this.node.employee;
  const term = this.searchTerm;
  return (
    emp.fullName.toLowerCase().includes(term) ||
    (emp.departmentName?.toLowerCase().includes(term) ?? false)
  );
});

protected subtreeHasMatch = computed(() => this.matchIds.has(this.node.employee.id));

  /** Expanded state: manual toggle wins; otherwise auto-expand while a search is revealing a match below. */
  protected expanded = computed(() => {
    const manual = this.userToggled();
    if (manual !== null) return manual;
    if (this.searchTerm) return this.subtreeHasMatch();
    return true;
  });

  protected toggle(): void {
    this.userToggled.set(!this.expanded());
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }

  protected teamSize = computed(() => countDescendants(this.node) - 1);
}