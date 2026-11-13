import { Link, type LinkProps } from 'react-router-dom';
import { buttonClass, type ButtonVariant } from './buttonStyles.ts';

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
}

/** A router link that looks like a <Button>. */
export function ButtonLink({ variant = 'primary', className = '', ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
