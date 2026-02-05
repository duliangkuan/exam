import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import dynamic from 'next/dynamic';
import { getWrongBooks, SubjectKey } from '@/lib/wrong-book-db';

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

export default async function WrongBookPage({
  params,
}: {
  params: Promise<{ slug: string; wrongBookId: string }>;
}) {
  const user = await getAuthUser();

  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const { slug: subject, wrongBookId } = await params;

  if (!['chinese', 'english', 'math', 'computer'].includes(subject)) {
    redirect('/student/notebook');
  }

  const wrongBooks = await getWrongBooks(user.id);
  const wrongBook = wrongBooks.find(
    (b) => b.id === wrongBookId && b.subject === subject
  );

  if (!wrongBook) {
    redirect(`/student/notebook/${subject}`);
  }

  return (
    <SubjectContentPage
      subject={subject as SubjectKey}
      studentId={user.id}
      parentBookId={wrongBookId}
    />
  );
}
