import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import NotebookView from '@/components/student/notebook/NotebookView';
import FloatingChatButton from '@/components/student/notebook/FloatingChatButton';

export default async function NotebookDetailPage({
  params,
}: {
  params: { notebookId: string };
}) {
  const user = await getAuthUser();
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const notebook = await prisma.wrongNotebook.findFirst({
    where: { id: params.notebookId, studentId: user.id },
  });
  if (!notebook) {
    redirect('/student/notebook');
  }

  return (
    <div className="min-h-screen p-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/student/notebook"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            ← 返回错题本
          </Link>
          <h1 className="text-3xl font-bold text-blue-400">{notebook.name}</h1>
        </div>
        <NotebookView notebookId={notebook.id} notebookName={notebook.name} />
      </div>
      <FloatingChatButton />
    </div>
  );
}
