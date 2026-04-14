import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrdersService, OrderSummary } from '../../core/orders/orders.service';
import { PaymentsService } from '../../core/payments/payments.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private ordersService = inject(OrdersService);
  private paymentsService = inject(PaymentsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  user = this.authService.currentUser;
  showHistory = signal(false);
  orders = signal<OrderSummary[]>([]);
  loading = signal(false);
  historyError = signal<string | null>(null);
  changePasswordError = signal<string | null>(null);
  changePasswordSuccess = signal<string | null>(null);
  isChangingPassword = signal(false);

  changePasswordForm = this.fb.group({
    oldPassword: ['', [Validators.required, Validators.minLength(8)]],
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

  isLoggedIn = computed(() => !!this.user());

  payForOrder(orderId: number) {
    this.paymentsService.createCheckoutSessionForOrder(orderId).subscribe();
  }

  loadHistory() {
    if (!this.showHistory()) {
      this.showHistory.set(true);
      this.loading.set(true);
      this.historyError.set(null);
      this.ordersService.getUserOrders().subscribe({
        next: (list) => {
          this.orders.set(list ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.historyError.set('Nie udało się pobrać historii zakupów.');
          this.loading.set(false);
        },
      });
    } else {
      this.showHistory.set(false);
    }
  }

  submitPasswordChange() {
    this.changePasswordError.set(null);
    this.changePasswordSuccess.set(null);

    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const { oldPassword, newPassword, confirmPassword } = this.changePasswordForm.getRawValue();

    if (newPassword !== confirmPassword) {
      this.changePasswordError.set('Nowe hasła muszą być identyczne.');
      return;
    }

    if (!oldPassword || !newPassword) {
      this.changePasswordError.set('Uzupełnij wszystkie pola.');
      return;
    }

    this.isChangingPassword.set(true);
    this.authService.changePassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.changePasswordSuccess.set('Hasło zostało zmienione.');
        this.changePasswordForm.reset();
        this.isChangingPassword.set(false);
      },
      error: (err) => {
        const backendMessage =
          err?.error?.message && typeof err.error.message === 'string'
            ? err.error.message
            : 'Nie udało się zmienić hasła.';
        this.changePasswordError.set(backendMessage);
        this.isChangingPassword.set(false);
      },
    });
  }

  ngOnInit() {
    if (!this.user()) {
      this.router.navigate(['/']);
    }
  }
}
