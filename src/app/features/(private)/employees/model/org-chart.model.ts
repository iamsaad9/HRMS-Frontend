import { Employee } from "./employee.model";


export interface OrgNode {
  employee: Employee;
  children: OrgNode[];
}

export function buildOrgTree(employees: Employee[]): OrgNode[] {
  const nodeMap = new Map<string, OrgNode>();

  employees.forEach((emp) => {
    nodeMap.set(emp.id, { employee: emp, children: [] });
  });

  const roots: OrgNode[] = [];

employees.forEach((emp) => {
  const node = nodeMap.get(emp.id)!;
  if (emp.managerId && emp.managerId !== emp.id && nodeMap.has(emp.managerId)) {
    let cursor: string | undefined = emp.managerId;
    const seen = new Set<string>();
    let cyclic = false;
    while (cursor) {
      if (cursor === emp.id) { cyclic = true; break; }
      if (seen.has(cursor)) break;
      seen.add(cursor);
      cursor = employees.find((e) => e.id === cursor)?.managerId;
    }
    if (cyclic) { roots.push(node); return; }
    nodeMap.get(emp.managerId)!.children.push(node);
  } else {
    roots.push(node);
  }
});

  // Sort children alphabetically for stable, predictable rendering
  nodeMap.forEach((node) => {
    node.children.sort((a, b) => a.employee.fullName.localeCompare(b.employee.fullName));
  });
  roots.sort((a, b) => a.employee.fullName.localeCompare(b.employee.fullName));

  return roots;
}

/** Total headcount under (and including) a node — handy for badges/counters. */
export function countDescendants(node: OrgNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countDescendants(child), 0);
}

export function computeSearchMatches(roots: OrgNode[], term: string): Set<string> {
  const matchIds = new Set<string>();
  if (!term) return matchIds;

  function visit(node: OrgNode): boolean {
    const emp = node.employee;
    const selfMatch =
      emp.fullName.toLowerCase().includes(term) ||
      (emp.jobTitleName?.toLowerCase().includes(term) ?? false) ||
      (emp.departmentName?.toLowerCase().includes(term) ?? false);
    const childMatch = node.children.map(visit).some(Boolean);
    if (selfMatch || childMatch) matchIds.add(node.employee.id);
    return selfMatch || childMatch;
  }
  roots.forEach(visit);
  return matchIds;
}