import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { ChatIcon } from "@/components/icons/Icon";

/** 消息中心（后端暂无消息接口，先做占位页） */
const MessagesPage = () => (
  <AppLayout
    header={<PageHeader title="消息" subtitle="点赞、评论、关注动态都会在这里通知你" />}
  >
    <EmptyState
      icon={<ChatIcon size={26} />}
      title="暂无消息"
      description="消息功能即将开放，敬请期待"
    />
  </AppLayout>
);

export default MessagesPage;
