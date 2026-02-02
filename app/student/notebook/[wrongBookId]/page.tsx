import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { getWrongBooks } from '@/lib/wrong-book-cookie';
import WrongBookDetailPage from '@/components/student/WrongBookDetailPage';

export default async function WrongBookDetailPageWrapper({
  params,
}: {
  params: { wrongBookId: string };
}) {
  const user = await getAuthUser();
  
  if (!user || user.type !== 'student') {
    redirect('/');
  }

  // 验证错题本是否存在
  const wrongBooks = await getWrongBooks();
  const wrongBook = wrongBooks.find(b => b.id === params.wrongBookId);

  if (!wrongBook) {
    redirect('/student/notebook');
  }

  return <WrongBookDetailPage wrongBookId={params.wrongBookId} wrongBookName={wrongBook.name} studentId={user.id} />;
}
