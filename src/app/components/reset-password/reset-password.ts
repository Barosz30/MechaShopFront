import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  form = this.fb.group({
    token: [this.route.snapshot.queryParamMap.get('token') ?? '', [Validators.required]],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/),
      ],
    ],
    confirmPassword: ['', [Validators.required]],
  });

  submit() {
    this.message.set(null);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { token, newPassword, confirmPassword } = this.form.getRawValue();

    if (newPassword !== confirmPassword) {
      this.error.set('Nowe hasła muszą być identyczne.');
      return;
    }

    if (!token || !newPassword) {
      this.error.set('Uzupełnij wszystkie pola.');
      return;
    }

    this.isLoading.set(true);
    this.authService.resetPassword({ token, newPassword }).subscribe({
      next: () => {
        this.message.set('Hasło zostało zresetowane. Możesz się zalogować.');
        this.isLoading.set(false);
        setTimeout(() => this.router.navigate(['/']), 1200);
      },
      error: (err) => {
        const backendMessage =
          err?.error?.message && typeof err.error.message === 'string'
            ? err.error.message
            : 'Nie udało się zresetować hasła.';
        this.error.set(backendMessage);
        this.isLoading.set(false);
      },
    });
  }
}
