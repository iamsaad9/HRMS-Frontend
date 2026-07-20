import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Attendence } from './attendence';

describe('Attendence', () => {
  let component: Attendence;
  let fixture: ComponentFixture<Attendence>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Attendence],
    }).compileComponents();

    fixture = TestBed.createComponent(Attendence);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
