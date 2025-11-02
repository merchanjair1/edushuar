import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { Dictionary } from './features/dictionary/dictionary';
import { Stories } from './features/stories/stories';
import { Games } from './features/games/games';
import { Profile } from './features/profile/profile';
import { Lecciones } from './features/lecciones/lecciones';
import { Biblioteca } from './features/biblioteca/biblioteca';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ContribuirComponent } from './features/contribuir/contribuir';
import { authGuard } from './core/guards/auth-guard';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { Moderation } from './features/moderation/moderation';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
    ],
  },
  {
    path: 'stories',
    component: MainLayout,
    children: [{ path: '', component: Stories }],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'dictionary', component: Dictionary },
      { path: 'games', component: Games },
      { path: 'profile', component: Profile },
      { path: 'lecciones', component: Lecciones },
      { path: 'contribuir', component: ContribuirComponent },
      { path: 'biblioteca', component: Biblioteca },
      { path: 'moderation', component: Moderation, canActivate: [adminGuard] },
    ],
  },
  {
    path: '**',
    redirectTo: 'stories',
  },
];