import type { ButtonHTMLAttributes } from 'react';
import { buttonClass, type ButtonVariant } from './buttonStyles.ts';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
