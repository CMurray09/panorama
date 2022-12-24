import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PannellumComponent } from './pannellum.component';

describe('PannellumComponent', () => {
  let component: PannellumComponent;
  let fixture: ComponentFixture<PannellumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PannellumComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PannellumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
