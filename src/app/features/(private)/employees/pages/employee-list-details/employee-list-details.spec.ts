import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeListDetails } from './employee-list-details';

describe('EmployeeListDetails', () => {
  let component: EmployeeListDetails;
  let fixture: ComponentFixture<EmployeeListDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeListDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeListDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
