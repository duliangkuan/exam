'use client';

interface ReportViewProps {
  report: any;
}

export default function ReportView({ report }: ReportViewProps) {
  const questions = report.questions as any[];
  const answers = report.answers as Record<number, 'A' | 'B' | 'C' | 'D'>;

  return (
    <div className="glass-effect rounded-2xl p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-3xl font-bold text-blue-400 mb-2">{report.subject}</h2>
        <div className="text-5xl font-bold text-cyan-400 mb-2">{report.score}</div>
        <p className="text-gray-400">分</p>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = answers[index];
          const isCorrect = userAnswer === question.correctAnswer;

          return (
            <div
              key={index}
              className={`bg-gray-800 rounded-lg p-6 border-2 ${
                isCorrect ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex-1">
                  第 {index + 1} 题: {question.question}
                </h3>
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    isCorrect
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isCorrect ? '✓ 正确' : '✗ 错误'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const isUserAnswer = userAnswer === option;
                  const isCorrectAnswer = question.correctAnswer === option;

                  return (
                    <div
                      key={option}
                      className={`p-3 rounded-lg border-2 ${
                        isCorrectAnswer
                          ? 'border-green-500 bg-green-500/10'
                          : isUserAnswer
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-700'
                      }`}
                    >
                      <span className="font-bold mr-2">{option}.</span>
                      {question.options[option]}
                      {isCorrectAnswer && (
                        <span className="ml-2 text-green-400">✓ 正确答案</span>
                      )}
                      {isUserAnswer && !isCorrectAnswer && (
                        <span className="ml-2 text-red-400">✗ 你的答案</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm font-bold text-blue-400 mb-2">解析：</p>
                <p className="text-gray-300">{question.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
