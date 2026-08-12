import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { FormField } from "@/components/form/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSignUp } from "@/features/auth/hooks/use-sign-up";
import { signupSchema, type SignupFormValues } from "@/features/auth/schemas/auth-schema";

export default function SignupPage() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const [confirmationSent, setConfirmationSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = (values: SignupFormValues) => {
    signUp.mutate(values, {
      onSuccess: (result) => {
        if (result.needsEmailConfirmation) {
          setConfirmationSent(true);
        } else {
          navigate("/jobs", { replace: true });
        }
      },
    });
  };

  if (confirmationSent) {
    return (
      <AuthLayout title="確認メールを送信しました">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <MailCheck className="size-6 text-secondary" />
          </div>
          <p className="text-sm text-muted-foreground">
            ご入力いただいたメールアドレス宛に確認メールを送信しました。メール内のリンクから認証を完了してください。
          </p>
          <Button asChild className="w-full">
            <Link to="/login">ログイン画面へ</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="アカウントを作成" description="必要な情報を入力してアカウントを作成してください。">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="表示名" required error={errors.displayName?.message}>
          <Input
            autoComplete="name"
            placeholder="例）山田 太郎"
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
          />
        </FormField>

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
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </FormField>

        <FormField label="パスワード確認" required error={errors.confirmPassword?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </FormField>

        {signUp.isError && (
          <Alert variant="destructive">
            <AlertDescription>{signUp.error.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={signUp.isPending}>
          {signUp.isPending ? "作成中..." : "アカウントを作成"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        すでにアカウントをお持ちの方はこちら{" "}
        <Link to="/login" className="font-bold text-secondary hover:underline">
          ログイン
        </Link>
      </p>
    </AuthLayout>
  );
}
