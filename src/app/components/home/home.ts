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
