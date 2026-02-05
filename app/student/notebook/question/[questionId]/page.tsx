import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getAuthUser } from '@/lib/auth';
import { getWrongQuestions } from '@/lib/wrong-book-db';
import WrongQuestionDetailPage from '@/components/student/WrongQuestionDetailPage';

async function WrongQuestionDetailContent({
  questionId,
}: {
  questionId: string;
}) {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  const questions = await getWrongQuestions(user.id);
  const question = questions.find(q => q.id === questionId);

  if (!question) {
    redirect('/student/notebook');
  }

  return (
    <WrongQuestionDetailPage
      questionId={question.id}
      questionName={question.name}
      questionContent={question.content}
      wrongBookId={question.wrongBookId}
      subject={question.subject}
    />
  );
}

export default async function WrongQuestionDetailPageWrapper({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen p-8 flex items-center justify-center"><div className="text-gray-400">加载中...</div></div>}>
      <WrongQuestionDetailContent questionId={questionId} />
    </Suspense>
  );
}
