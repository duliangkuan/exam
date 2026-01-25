'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import chineseData from '@/data/chinese_exam_nodes.json';
import englishData from '@/data/english_exam_nodes.json';
import mathData from '@/data/math_exam_nodes.json';
import computerData from '@/data/computer_exam_nodes.json';

interface SubjectSelectFlowProps {
  subject: string;
}

export default function SubjectSelectFlow({ subject }: SubjectSelectFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getData = () => {
    switch (subject) {
      case 'chinese':
        return chineseData;
      case 'english':
        return englishData;
      case 'math':
        return mathData;
      case 'computer':
        return computerData;
      default:
        return [];
    }
  };

  const getSteps = () => {
    switch (subject) {
      case 'chinese':
        return ['板块', '章', '节', '知识点'];
      case 'english':
        return ['板块', '部分', '章', '节', '知识点'];
      case 'math':
      case 'computer':
        return ['章', '节', '知识点'];
      default:
        return [];
    }
  };

  useEffect(() => {
    const data = getData();
    const steps = getSteps();
    
    if (step === 0) {
      // 第一步：获取所有唯一的第一级选项
      if (subject === 'chinese' || subject === 'english') {
        const unique = [...new Set(data.map((item: any) => item[steps[0]]))];
        setOptions(unique.map((val: any) => ({ label: val, value: val })));
      } else {
        const unique = [...new Set(data.map((item: any) => item[steps[0]]))];
        setOptions(unique.map((val: any) => ({ label: val, value: val })));
      }
    } else {
      updateOptions();
    }
  }, [step, selected, subject]);

  const updateOptions = () => {
    const data = getData();
    const steps = getSteps();
    let filtered = [...data];

    // 根据已选择的选项过滤数据
    steps.slice(0, step).forEach((stepName, index) => {
      const selectedValue = selected[stepName];
      if (selectedValue) {
        filtered = filtered.filter((item: any) => item[stepName] === selectedValue);
      }
    });

    // 获取当前步骤的唯一选项
    const currentStepName = steps[step];
    
    // 特殊处理"知识点"步骤：知识点字段是数组，需要展开
    if (currentStepName === '知识点') {
      // 收集所有知识点数组并展开
      const allKnowledgePoints: string[] = [];
      filtered.forEach((item: any) => {
        const knowledgePoints = item[currentStepName];
        if (Array.isArray(knowledgePoints)) {
          allKnowledgePoints.push(...knowledgePoints);
        } else if (knowledgePoints) {
          // 如果不是数组，直接添加（兼容处理）
          allKnowledgePoints.push(knowledgePoints);
        }
      });
      
      // 去重并创建选项
      const unique = [...new Set(allKnowledgePoints)];
      setOptions(unique.map((val: string) => ({ label: val, value: val })));
    } else {
      // 其他步骤：正常处理字符串值
      const unique = [...new Set(filtered.map((item: any) => item[currentStepName]))];
      setOptions(unique.map((val: any) => ({ label: val, value: val })));
    }
  };

  const handleSelect = (value: string) => {
    const steps = getSteps();
    const currentStepName = steps[step];
    setSelected({ ...selected, [currentStepName]: value });
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      const steps = getSteps();
      const prevStepName = steps[step - 1];
      const newSelected = { ...selected };
      delete newSelected[prevStepName];
      setSelected(newSelected);
      setStep(step - 1);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/deepseek/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject === 'chinese' ? '大学语文' : 
                  subject === 'english' ? '大学英语' :
                  subject === 'math' ? '高等数学' : '计算机基础',
          selectedPath: selected,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // 保存题目到sessionStorage并跳转到答题页面
        sessionStorage.setItem('currentQuestions', JSON.stringify(data.questions));
        sessionStorage.setItem('selectedPath', JSON.stringify(selected));
        sessionStorage.setItem('subject', subject);
        router.push(`/student/exam/${subject}/quiz`);
      } else {
        alert(data.error || '生成题目失败');
      }
    } catch (error) {
      alert('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const steps = getSteps();
  const currentStepName = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div>
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          {steps.map((stepName, index) => (
            <div
              key={index}
              className={`px-4 py-2 rounded-lg ${
                index < step
                  ? 'bg-blue-600 text-white'
                  : index === step
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {stepName}
            </div>
          ))}
        </div>
        <h3 className="text-xl font-bold text-blue-400 mb-4">
          请选择 {currentStepName}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option.value)}
            className={`p-4 rounded-lg border-2 transition ${
              selected[currentStepName] === option.value
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            上一步
          </button>
        )}
        {isLastStep && selected[currentStepName] && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 ml-auto"
          >
            {loading ? '生成题目中...' : '开始答题'}
          </button>
        )}
      </div>
    </div>
  );
}
