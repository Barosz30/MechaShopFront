import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HomeComponent } from './home';
import { provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the hero title with highlight', () => {
    const titleElement = fixture.debugElement.query(By.css('h1'));
    const highlightElement = fixture.debugElement.query(By.css('.highlight'));

    expect(titleElement.nativeElement.textContent).toContain('Mechanika w Twoich');
    expect(highlightElement.nativeElement.textContent).toContain('Rękach');
  });

  it('should render correct number of category cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('.category-card'));
    expect(cards.length).toBe(6);
  });

  it('should update CSS variables on mouse move (Spotlight Effect)', () => {
    const cardDebugEl = fixture.debugElement.query(By.css('.category-card'));
    const cardEl = cardDebugEl.nativeElement;

    vi.spyOn(cardEl, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      bottom: 300,
      right: 300,
      x: 100,
      y: 100,
      toJSON: () => {}
    } as DOMRect);

    const event = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 150
    });

    component.handleMouseMove(event, cardEl);

    expect(cardEl.style.getPropertyValue('--mouse-x')).toBe('50px');
    expect(cardEl.style.getPropertyValue('--mouse-y')).toBe('50px');
  });

  it('should apply correct icon classes', () => {
    const firstIcon = fixture.debugElement.query(By.css('.category-card .icon-wrapper i'));

    expect(firstIcon.classes['fas']).toBe(true);
    expect(firstIcon.classes['fa-bicycle']).toBe(true);
  });
});
