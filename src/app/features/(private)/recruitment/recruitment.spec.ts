import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recruitment } from './recruitment';

describe('Recruitment', () => {
  let component: Recruitment;
  let fixture: ComponentFixture<Recruitment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recruitment],
    }).compileComponents();

    fixture = TestBed.createComponent(Recruitment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
