import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

interface Category {
  name: string;
  count: number;
  icon: string;
  image: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent {

  constructor() {
    // #region agent log
    fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'home.ts:18',message:'HomeComponent constructor',data:{timestamp:Date.now()},timestamp:Date.now(),runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }

  categories: Category[] = [
    {
      name: 'Rowery i Akcesoria',
      count: 124,
      icon: 'fas fa-bicycle',
      image: 'images/bike.webp'
    },
    {
      name: 'Części zamienne',
      count: 850,
      icon: 'fas fa-cogs',
      image: 'images/screws.webp'
    },
    {
      name: 'Skutery Elektryczne',
      count: 12,
      icon: 'fas fa-bolt',
      image: 'images/scooter.webp'
    },
    {
      name: 'Śruby i Łączniki',
      count: 2300,
      icon: 'fas fa-screwdriver',
      image: 'images/screws.webp'
    },
    {
      name: 'Oleje i Chemia',
      count: 45,
      icon: 'fas fa-oil-can',
      image: 'images/oil.webp'
    },
    {
      name: 'Odzież Ochronna',
      count: 88,
      icon: 'fas fa-hard-hat',
      image: 'images/protective-gear.webp'
    }
  ];

  handleMouseMove(event: MouseEvent, card: HTMLElement) {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }
}
