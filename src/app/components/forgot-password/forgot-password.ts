import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  isLoading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
  });

  submit() {
    this.message.set(null);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const username = this.form.getRawValue().username;
    if (!username) {
      return;
    }

    this.isLoading.set(true);
    this.authService.forgotPassword({ username }).subscribe({
      next: (res) => {
        this.message.set(
          res.message ||
            'Jeżeli konto istnieje, link resetu został wysłany.',
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się rozpocząć resetu hasła.');
        this.isLoading.set(false);
      },
    });
  }
}
