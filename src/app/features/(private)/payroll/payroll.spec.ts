import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Payroll } from './payroll';

describe('Payroll', () => {
  let component: Payroll;
  let fixture: ComponentFixture<Payroll>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Payroll],
    }).compileComponents();

    fixture = TestBed.createComponent(Payroll);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
