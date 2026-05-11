import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { navigateAfterAuth } from "@/lib/authRedirect";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in — VOLT" }, { name: "description", content: "Sign in to your VOLT account." }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(100),
  rememberMe: z.boolean().optional(),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data.email, data.password, data.rememberMe === true);
      toast.success("Welcome back");
      navigateAfterAuth(navigate, redirect);
    } catch (e) {
      toast.error((e as Error).message || "Sign in failed");
    }
  });

  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-12 md:py-20">
      <h1 className="font-display text-4xl uppercase">Sign in</h1>
      <p className="text-sm text-muted-foreground mt-2">Welcome back. Let's go.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" {...register("email")} className="input" />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input type={show ? "text" : "password"} autoComplete="current-password" {...register("password")} className="input pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-foreground"
              {...register("rememberMe", { valueAsBoolean: true })}
            />{" "}
            Remember me
          </label>
          <Link to="/forgot-password" className="text-muted-foreground hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full h-12 volt-primary-btn font-display uppercase tracking-widest">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        New here?{" "}
        <Link to="/register" search={redirect ? { redirect } : undefined} className="text-foreground font-medium hover:underline">
          Create account
        </Link>
      </p>

      <style>{`.input{height:48px;width:100%;border-radius:8px;border:1px solid var(--color-border);background:transparent;padding:0 14px;font-size:14px;outline:none;transition:border-color .2s}.input:focus{border-color:var(--color-foreground)}`}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-display uppercase tracking-widest mb-2">{label}</div>
      {children}
      {error && <div className="text-xs text-destructive mt-1.5">{error}</div>}
    </label>
  );
}

