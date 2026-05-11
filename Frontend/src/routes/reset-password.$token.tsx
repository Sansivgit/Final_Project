import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { requestResetPassword } from "@/lib/api";
import { navigateAfterAuth } from "@/lib/authRedirect";

export const Route = createFileRoute("/reset-password/$token")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset password — VOLT" },
      { name: "description", content: "Choose a new password for your VOLT account." },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(100)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Include uppercase, lowercase, and a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function ResetPasswordPage() {
  const { token } = Route.useParams();
  const { redirect } = Route.useSearch();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await requestResetPassword(token, data.password);
      toast.success("Password updated");
      if (res.token) {
        await loginWithToken(res.token);
        navigateAfterAuth(navigate, redirect);
      } else {
        navigate({ to: "/login" });
      }
    } catch (e) {
      toast.error((e as Error).message || "Could not reset password");
    }
  });

  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-12 md:py-20">
      <h1 className="font-display text-4xl uppercase">New password</h1>
      <p className="text-sm text-muted-foreground mt-2">Choose a strong password for your account.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <div className="text-xs font-display uppercase tracking-widest mb-2">New password</div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              className="input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Toggle password visibility"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password?.message && (
            <div className="text-xs text-destructive mt-1.5">{errors.password.message}</div>
          )}
        </label>

        <label className="block">
          <div className="text-xs font-display uppercase tracking-widest mb-2">Confirm password</div>
          <div className="relative">
            <input
              type={showPw2 ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className="input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw2((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Toggle confirm password visibility"
            >
              {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword?.message && (
            <div className="text-xs text-destructive mt-1.5">{errors.confirmPassword.message}</div>
          )}
        </label>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 volt-primary-btn font-display uppercase tracking-widest"
        >
          {isSubmitting ? "Saving…" : "Update password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        <Link to="/login" className="text-foreground font-medium hover:underline">
          Back to sign in
        </Link>
      </p>

      <style>{`.input{height:48px;width:100%;border-radius:8px;border:1px solid var(--color-border);background:transparent;padding:0 14px;font-size:14px;outline:none;transition:border-color .2s}.input:focus{border-color:var(--color-foreground)}`}</style>
    </div>
  );
}
