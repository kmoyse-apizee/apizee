import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OneToOneComponent } from './one-to-one.component';

describe('OneToOneComponent', () => {
  let component: OneToOneComponent;
  let fixture: ComponentFixture<OneToOneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OneToOneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OneToOneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
