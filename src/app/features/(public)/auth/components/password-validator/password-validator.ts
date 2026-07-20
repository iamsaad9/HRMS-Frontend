import { CommonModule } from '@angular/common';
import { Component, computed, Input, signal } from '@angular/core';

@Component({
  selector: 'app-password-validator',
  imports: [CommonModule],
  templateUrl: './password-validator.html',
})
export class PasswordValidator {
  @Input() position: 'left' | 'right' = 'right';
  @Input({ required: true }) set password(val: string) {
    this.passwordSignal.set(val || '');
  }

  passwordSignal = signal<string>('');

  hasLowercase = computed(() => /[a-z]/.test(this.passwordSignal()));
  hasUppercase = computed(() => /[A-Z]/.test(this.passwordSignal()));
  hasNumber = computed(() => /[0-9]/.test(this.passwordSignal()));
  hasSpecial = computed(() => /[^A-Za-z0-9]/.test(this.passwordSignal()));
  isLongEnough = computed(() => this.passwordSignal().length >= 8);

  strengthScore = computed(() => {
    let score = 0;
    if (this.hasLowercase()) score++;
    if (this.hasUppercase()) score++;
    if (this.hasNumber()) score++;
    if (this.hasSpecial()) score++;
    if (this.isLongEnough()) score++;
    return score;
  });

  strengthText = computed(() => {
    const score = this.strengthScore();
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Fair';
    return 'Strong';
  });
}
