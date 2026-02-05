import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import dynamic from 'next/dynamic';

// 使用 dynamic import 避免服务器组件导入客户端组件的错误
const SubjectSelectionPage = dynamic(
  () => import('@/components/student/SubjectSelectionPage'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    ),
  }
);

export default async function NotebookPage() {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  return <SubjectSelectionPage />;
}
