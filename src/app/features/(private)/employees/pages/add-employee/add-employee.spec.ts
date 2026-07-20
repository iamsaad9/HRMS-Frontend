import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEmployee } from './add-employee';

describe('AddEmployee', () => {
  let component: AddEmployee;
  let fixture: ComponentFixture<AddEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEmployee],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEmployee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
