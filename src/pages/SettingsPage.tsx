import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogOut, AlertTriangle, Save, Pencil, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BackLink } from "@/components/layout/BackLink";
import { PageContainer } from "@/components/layout/PageContainer";
import { FormField } from "@/components/form/FormField";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { useUpdateProfile } from "@/features/auth/hooks/use-update-profile";
import { useUpdatePassword } from "@/features/auth/hooks/use-update-password";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { useDeleteAccount } from "@/features/auth/hooks/use-delete-account";
import { DeleteAccountDialog } from "@/features/auth/components/DeleteAccountDialog";
import {
  profileSchema,
  passwordChangeSchema,
  type ProfileFormValues,
  type PasswordChangeFormValues,
} from "@/features/auth/schemas/auth-schema";
import { formatDate } from "@/lib/format";
import type { AuthUser } from "@/features/auth/types/auth";

export default function SettingsPage() {
  const { user } = useAuth();

  // ProtectedRouteの内側なのでuserは必ず存在する
  if (!user) return null;

  return (
    <PageContainer className="space-y-6">
      <AppHeader leading={<BackLink to="/jobs" label="求人一覧に戻る" />} />

      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">設定</h1>
        <p className="text-sm text-muted-foreground">アカウント情報の確認や変更ができます。</p>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        <AccountInfoSection user={user} />
        <PasswordSection />
        <AccountSection />
        <DangerZoneSection />
      </Card>

      {user.createdAt && (
        <p className="text-right text-xs text-muted-foreground">
          アカウント作成日：{formatDate(user.createdAt)}
        </p>
      )}
    </PageContainer>
  );
}

function SectionHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
      <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-secondary [&_svg]:size-4">
        {icon}
      </span>
      {children}
    </h2>
  );
}

type SectionStatus = { type: "success" | "error"; message: string } | null;

function StatusAlert({ status }: { status: SectionStatus }) {
  if (!status) return null;
  return (
    <Alert variant={status.type === "error" ? "destructive" : "default"}>
      <AlertDescription>{status.message}</AlertDescription>
    </Alert>
  );
}

function AccountInfoSection({ user }: { user: AuthUser }) {
  const updateProfile = useUpdateProfile();
  const [status, setStatus] = useState<SectionStatus>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: user.displayName ?? "", email: user.email },
  });

  const onSubmit = (values: ProfileFormValues) => {
    setStatus(null);
    const emailChanged = values.email.trim() !== user.email;
    updateProfile.mutate(
      { ...values, emailChanged },
      {
        onSuccess: () =>
          setStatus({
            type: "success",
            message: emailChanged
              ? "変更を保存しました。メールアドレスの変更には確認メールでの認証が必要です。"
              : "変更を保存しました。",
          }),
        onError: (error) => setStatus({ type: "error", message: error.message }),
      },
    );
  };

  return (
    <div className="space-y-4 p-6 sm:p-8">
      <SectionHeading icon={<User />}>アカウント情報</SectionHeading>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="表示名" error={errors.displayName?.message}>
            <Input aria-invalid={Boolean(errors.displayName)} {...register("displayName")} />
          </FormField>
          <FormField label="メールアドレス" error={errors.email?.message}>
            <Input type="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
          </FormField>
        </div>
        <StatusAlert status={status} />
        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfile.isPending}>
            <Save />
            {updateProfile.isPending ? "保存中..." : "変更を保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PasswordSection() {
  const updatePassword = useUpdatePassword();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<SectionStatus>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeFormValues>({ resolver: zodResolver(passwordChangeSchema) });

  const onSubmit = (values: PasswordChangeFormValues) => {
    setStatus(null);
    updatePassword.mutate(values.newPassword, {
      onSuccess: () => {
        setStatus({ type: "success", message: "パスワードを変更しました。" });
        setEditing(false);
        reset();
      },
      onError: (error) => setStatus({ type: "error", message: error.message }),
    });
  };

  return (
    <div className="space-y-4 p-6 sm:p-8">
      <SectionHeading icon={<Lock />}>セキュリティ</SectionHeading>

      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="新しいパスワード" required error={errors.newPassword?.message}>
              <Input
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword)}
                {...register("newPassword")}
              />
            </FormField>
            <FormField
              label="新しいパスワード（確認）"
              required
              error={errors.confirmPassword?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register("confirmPassword")}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={updatePassword.isPending}
              onClick={() => {
                setEditing(false);
                reset();
              }}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={updatePassword.isPending}>
              {updatePassword.isPending ? "変更中..." : "変更する"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <FormField label="パスワード">
              <Input type="password" value="••••••••••••" disabled readOnly />
            </FormField>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStatus(null);
              setEditing(true);
            }}
          >
            <Pencil />
            パスワードを変更
          </Button>
        </div>
      )}

      {!editing && <StatusAlert status={status} />}
    </div>
  );
}

function AccountSection() {
  const navigate = useNavigate();
  const signOut = useSignOut();

  return (
    <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="space-y-1">
        <SectionHeading icon={<LogOut />}>アカウント</SectionHeading>
        <p className="text-sm text-muted-foreground">アカウントからログアウトします。</p>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={signOut.isPending}
        onClick={() =>
          signOut.mutate(undefined, {
            onSuccess: () => navigate("/login", { replace: true }),
          })
        }
        className="sm:shrink-0"
      >
        <LogOut />
        {signOut.isPending ? "ログアウト中..." : "ログアウト"}
      </Button>
    </div>
  );
}

function DangerZoneSection() {
  const navigate = useNavigate();
  const deleteAccount = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    deleteAccount.mutate(undefined, {
      onSuccess: () => navigate("/login", { replace: true }),
      onError: (e) => setError(e.message),
    });
  };

  return (
    <div className="space-y-3 p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base font-bold text-destructive">
            <AlertTriangle className="size-4" />
            危険な操作
          </h2>
          <p className="text-sm text-muted-foreground">
            アカウントを削除すると、すべてのデータが完全に削除され、復元できません。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 sm:shrink-0"
        >
          <Trash2 />
          アカウントを削除
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DeleteAccountDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        isDeleting={deleteAccount.isPending}
      />
    </div>
  );
}
