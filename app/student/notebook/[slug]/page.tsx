import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import dynamic from 'next/dynamic';
import { getWrongBooks } from '@/lib/wrong-book-db';
import { SubjectKey } from '@/lib/wrong-book-db';

const SubjectContentPage = dynamic(
  () => import('@/components/student/SubjectContentPage'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    ),
  }
);

const VALID_SUBJECTS = ['chinese', 'english', 'math', 'computer'];

export default async function NotebookSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getAuthUser();

  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const { slug } = await params;

  // 优先判断是否为学科（新路由）
  if (VALID_SUBJECTS.includes(slug)) {
    return <SubjectContentPage subject={slug as SubjectKey} studentId={user.id} />;
  }

  // 否则视为错题本 ID（旧路由兼容：重定向到新的学科路由结构）
  const wrongBooks = await getWrongBooks(user.id);
  const wrongBook = wrongBooks.find((b) => b.id === slug);

  if (!wrongBook) {
    redirect('/student/notebook');
  }

  if (wrongBook.subject) {
    redirect(`/student/notebook/${wrongBook.subject}/${slug}`);
  } else {
    redirect('/student/notebook');
  }
}
