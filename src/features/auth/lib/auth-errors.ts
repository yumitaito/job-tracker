/** Supabase Authのエラーメッセージを、ユーザーに分かりやすい日本語へ変換する */
const MESSAGE_MAP: { match: string; message: string }[] = [
  { match: "Invalid login credentials", message: "メールアドレスまたはパスワードが正しくありません。" },
  { match: "User already registered", message: "このメールアドレスは既に登録されています。" },
  { match: "already registered", message: "このメールアドレスは既に登録されています。" },
  { match: "Email not confirmed", message: "メールアドレスの確認が完了していません。届いた確認メールをご確認ください。" },
  { match: "Password should be at least", message: "パスワードは6文字以上で入力してください。" },
  { match: "Unable to validate email address", message: "メールアドレスの形式が正しくありません。" },
  { match: "For security purposes", message: "しばらく時間を置いてから再度お試しください。" },
  { match: "New password should be different", message: "現在のパスワードとは異なるパスワードを入力してください。" },
  {
    match: "email rate limit exceeded",
    message: "メール送信の上限に達しました。しばらく時間（1時間程度）を置いてから再度お試しください。",
  },
  {
    match: "over_email_send_rate_limit",
    message: "メール送信の上限に達しました。しばらく時間（1時間程度）を置いてから再度お試しください。",
  },
];

export function toAuthErrorMessage(rawMessage: string): string {
  const found = MESSAGE_MAP.find((entry) => rawMessage.includes(entry.match));
  return found?.message ?? rawMessage;
}
