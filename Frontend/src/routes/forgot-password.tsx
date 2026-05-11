import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestForgotPassword } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — VOLT" },
      { name: "description", content: "Reset your VOLT account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await requestForgotPassword(data.email);
      toast.success(res.message || "Reset link sent to your email.");
      navigate({ to: "/login" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    }
  });

  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-12 md:py-20">
      <h1 className="font-display text-4xl uppercase">Forgot password</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Enter your email — we’ll send a reset link if this account exists.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <div className="text-xs font-display uppercase tracking-widest mb-2">Email</div>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            className="input"
          />
          {errors.email?.message && (
            <div className="text-xs text-destructive mt-1.5">{errors.email.message}</div>
          )}
        </label>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 volt-primary-btn font-display uppercase tracking-widest"
        >
          {isSubmitting ? "Checking…" : "Verify email"}
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
