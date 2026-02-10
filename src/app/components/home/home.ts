import { Component, OnInit } from '@angular/core';

interface Category {
  name: string;
  count: number;
  icon: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {

  categories: Category[] = [
    { name: 'Rowery i Akcesoria', count: 124, icon: 'fas fa-bicycle' },
    { name: 'Części zamienne', count: 850, icon: 'fas fa-tools' },
    { name: 'Skutery Elektryczne', count: 12, icon: 'fas fa-bolt' },
    { name: 'Śruby i Łączniki', count: 2300, icon: 'fas fa-screwdriver' },
    { name: 'Oleje i Chemia', count: 45, icon: 'fas fa-oil-can' },
    { name: 'Odzież Ochronna', count: 88, icon: 'fas fa-hard-hat' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
