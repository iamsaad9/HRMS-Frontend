import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeCard } from './employee-card';

describe('EmployeeCard', () => {
  let component: EmployeeCard;
  let fixture: ComponentFixture<EmployeeCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeCard],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
