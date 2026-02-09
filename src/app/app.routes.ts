import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { LoginComponent } from './components/login/login';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  { path: '', component: Home, pathMatch: 'full' }
];
