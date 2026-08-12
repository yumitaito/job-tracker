import { Link } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <PageContainer className="space-y-6">
      <AppHeader />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-3xl font-black text-foreground">404</p>
          <p className="text-base font-bold text-foreground">ページが見つかりませんでした</p>
          <p className="text-sm text-muted-foreground">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
          <Button asChild>
            <Link to="/jobs">求人一覧に戻る</Link>
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
