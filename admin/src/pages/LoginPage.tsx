import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff, Zap } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

export function LoginPage() {
  const { login, useBackend } = useAdmin();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@volt.com", password: "admin123" },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data.email, data.password);
      toast.success("Welcome, admin");
      navigate("/", { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <div className="relative grid min-h-screen place-items-center bg-muted/30 px-4 py-16">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2 font-display text-xl uppercase tracking-widest">
          <Zap className="h-5 w-5 text-volt" /> VOLT Admin
        </div>
        <h1 className="mt-6 font-display text-3xl uppercase">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Authorized personnel only.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider">Email</label>
            <Input type="email" autoComplete="email" {...register("email")} />
            {errors.email && <div className="mt-1 text-xs text-destructive">{errors.email.message}</div>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider">Password</label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Toggle password"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <div className="mt-1 text-xs text-destructive">{errors.password.message}</div>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {!useBackend && (
          <div className="mt-6 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Demo (offline): <span className="font-mono">admin@volt.com</span> /{" "}
            <span className="font-mono">admin123</span>
          </div>
        )}
      </div>
    </div>
  );
}
