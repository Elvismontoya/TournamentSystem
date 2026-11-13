import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Field, Input } from '../../components/ui/form.tsx';

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Iniciar sesión"
      description="Entra para crear y administrar tus torneos."
    >
      {/* Mockup: submitting only closes the popup. */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
        className="space-y-5"
      >
        <Field id="login-email" label="Correo electrónico">
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
          />
        </Field>
        <Field id="login-password" label="Contraseña">
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Field>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-neutral-400">
            <input type="checkbox" name="remember" className="size-4 accent-primary-500" />
            Recordarme
          </label>
          <button type="button" className="font-medium text-primary-300 hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <Button type="submit" className="w-full">
          Iniciar sesión
        </Button>

        <p className="text-center text-sm text-neutral-400">
          ¿No tienes cuenta?{' '}
          <button type="button" className="font-medium text-primary-300 hover:underline">
            Regístrate gratis
          </button>
        </p>
      </form>
    </Modal>
  );
}
