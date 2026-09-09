import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmployeeService } from './employee.service';
import { EMPTY_EMPLOYEE_FILTER, Employee, filterEmployees } from '../model/employee.model';

function buildEmployee(overrides: Partial<Employee>): Employee {
  return {
    id: 'e1',
    userId: 'u1',
    staffNo: 'S1',
    title: 'Mr',
    firstName: 'Jane',
    lastName: 'Doe',
    fullName: 'Jane Doe',
    dateOfBirth: '1990-01-01',
    gender: 'Female',
    workEmail: 'jane.doe@example.com',
    mobile: '123',
    niNumber: 'NI1',
    startDate: '2020-01-01',
    employmentType: 'Full-Time',
    isActive: true,
    createdAtUtc: null,
    ...overrides,
  };
}

describe('filterEmployees', () => {
  const employees: Employee[] = [
    buildEmployee({
      id: 'e1',
      firstName: 'Jane',
      lastName: 'Doe',
      workEmail: 'jane.doe@example.com',
      departmentId: 'dept-1',
      branchId: 'branch-1',
      managerId: 'mgr-1',
      designationTitle: 'Engineer',
      isActive: true,
    }),
    buildEmployee({
      id: 'e2',
      firstName: 'John',
      lastName: 'Smith',
      workEmail: 'john.smith@example.com',
      departmentId: 'dept-2',
      branchId: 'branch-2',
      managerId: 'mgr-2',
      designationTitle: 'Manager',
      isActive: false,
    }),
  ];

  it('returns everyone when the filter is empty', () => {
    expect(filterEmployees(employees, EMPTY_EMPLOYEE_FILTER)).toHaveLength(2);
  });

  it('matches search against first name, last name, and email, case-insensitively', () => {
    expect(filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, search: 'JANE' })).toEqual([employees[0]]);
    expect(filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, search: 'smith' })).toEqual([employees[1]]);
    expect(
      filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, search: 'john.smith@example.com' }),
    ).toEqual([employees[1]]);
  });

  it('filters by department, branch, and manager independently', () => {
    expect(filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, departmentId: 'dept-2' })).toEqual([
      employees[1],
    ]);
    expect(filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, branchId: 'branch-1' })).toEqual([
      employees[0],
    ]);
    expect(filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, managerId: 'mgr-2' })).toEqual([
      employees[1],
    ]);
  });

  it('filters by role using designationTitle, case-insensitively', () => {
    expect(filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, role: 'engineer' })).toEqual([
      employees[0],
    ]);
  });

  // Regression coverage: isActive is a tri-state (null = no filter). A naive
  // `!filter.isActive || ...` check is truthy-broken for isActive:false (Inactive), since
  // `!false` is true and short-circuits to "always match" regardless of the employee's status.
  it('isActive:false (the "Inactive" filter) returns only inactive employees, not everyone', () => {
    const result = filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, isActive: false });
    expect(result).toEqual([employees[1]]);
  });

  it('isActive:true (the "Active" filter) returns only active employees', () => {
    const result = filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, isActive: true });
    expect(result).toEqual([employees[0]]);
  });

  it('isActive:null applies no status filter at all', () => {
    expect(filterEmployees(employees, { ...EMPTY_EMPLOYEE_FILTER, isActive: null })).toHaveLength(2);
  });
});

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAllEmployees fetches once and serves subsequent calls from cache', () => {
    const employees = [buildEmployee({ id: 'e1' })];

    service.getAllEmployees().subscribe();
    httpMock.expectOne('/api/Employees').flush({ isSuccess: true, data: employees, message: '' });
    expect(service.allEmployees()).toEqual(employees);

    let cached: any;
    service.getAllEmployees().subscribe((r) => (cached = r));
    httpMock.expectNone('/api/Employees');
    expect(cached.data).toEqual(employees);
  });

  // Regression coverage: updateEmployee() previously left the cache-invalidation line commented
  // out, so an edited employee's changes never showed up in the List/View until a hard refresh.
  it('updateEmployee invalidates the employee cache so the next fetch goes to the network', () => {
    service.getAllEmployees().subscribe();
    httpMock
      .expectOne('/api/Employees')
      .flush({ isSuccess: true, data: [buildEmployee({ id: 'e1' })], message: '' });
    expect(service.hasCachedEmployees()).toBe(true);

    service.updateEmployee('e1', {
      title: 'Mr',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'Female',
      workEmail: 'jane.doe@example.com',
      mobile: null,
      niNumber: null,
      startDate: null,
      department: null,
      isActive: true,
      employmentType: null,
      departmentId: null,
      branchId: null,
      designationId: null,
      managerId: null,
    }).subscribe();
    httpMock.expectOne('/api/Employees/e1').flush({ isSuccess: true, data: null, message: '' });

    expect(service.hasCachedEmployees()).toBe(false);

    service.getAllEmployees().subscribe();
    httpMock
      .expectOne('/api/Employees') // fetched again instead of being served from a stale cache
      .flush({ isSuccess: true, data: [], message: '' });
  });
});
