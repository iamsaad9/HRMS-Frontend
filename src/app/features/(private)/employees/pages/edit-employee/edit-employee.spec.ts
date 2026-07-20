import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditEmployee } from './edit-employee';

describe('EditEmployee', () => {
  let component: EditEmployee;
  let fixture: ComponentFixture<EditEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEmployee],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEmployee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
