import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { FormField } from "@/components/form/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSignIn } from "@/features/auth/hooks/use-sign-in";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/auth-schema";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useSignIn();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginFormValues) => {
    signIn.mutate(values, {
      onSuccess: () => {
        const from = (location.state as { from?: Location })?.from?.pathname ?? "/jobs";
        navigate(from, { replace: true });
      },
    });
  };

  return (
    <AuthLayout title="ログイン" description="メールアドレスとパスワードでログインしてください。">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="メールアドレス" required error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="例）you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        <FormField label="パスワード" required error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </FormField>

        {signIn.isError && (
          <Alert variant="destructive">
            <AlertDescription>{signIn.error.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        アカウントをお持ちでない方は{" "}
        <Link to="/signup" className="font-bold text-secondary hover:underline">
          アカウントを作成
        </Link>
      </p>
    </AuthLayout>
  );
}
