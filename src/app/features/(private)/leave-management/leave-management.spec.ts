import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveManagement } from './leave-management';

describe('LeaveManagement', () => {
  let component: LeaveManagement;
  let fixture: ComponentFixture<LeaveManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
