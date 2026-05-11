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

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create account — VOLT" },
      { name: "description", content: "Create a VOLT account for early drops and member perks." },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Include uppercase, lowercase, and a number"),
});

function RegisterPage() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signup(data.name, data.email, data.password);
      toast.success("Welcome to VOLT");
      navigateAfterAuth(navigate, redirect);
    } catch (e) {
      toast.error((e as Error).message || "Could not create account");
    }
  });

  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-12 md:py-20">
      <h1 className="font-display text-4xl uppercase">Create account</h1>
      <p className="text-sm text-muted-foreground mt-2">Early drops. Member-only colors. Always free shipping.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Name" error={errors.name?.message}>
          <input autoComplete="name" {...register("name")} className="input" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" {...register("email")} className="input" />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input type={show ? "text" : "password"} autoComplete="new-password" {...register("password")} className="input pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            8+ characters with uppercase, lowercase, and a number.
          </p>
        </Field>
        <Button type="submit" disabled={isSubmitting} className="w-full h-12 volt-primary-btn font-display uppercase tracking-widest">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-xs text-muted-foreground">By creating an account you agree to our Terms and Privacy Policy.</p>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account?{" "}
        <Link to="/login" search={redirect ? { redirect } : undefined} className="text-foreground font-medium hover:underline">
          Sign in
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
