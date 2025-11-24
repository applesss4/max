'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestOpenAIPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testOpenAI = async () => {
    if (!prompt.trim()) {
      setError('请输入测试提示');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          financialData: {
            creditCards: [
              {
                id: 'test-id-1',
                card_name: '招商银行信用卡',
                card_number_last_4: '1234',
                total_amount: 10000,
                monthly_payment: 2000,
                payment_date: '2025-10-15',
                paid_amount: 0,
                periods: 12,
                card_type: 'installment'
              }
            ],
            loans: [
              {
                id: 'test-id-2',
                loan_name: '房贷',
                loan_type: '住房贷款',
                total_amount: 500000,
                monthly_payment: 3000,
                payment_date: '2025-10-20',
                paid_amount: 150000,
                periods: 360,
                interest_rate: 4.5,
                start_date: '2020-01-01',
                end_date: '2050-01-01'
              }
            ]
          }
        }),
      });

      const data = await res.json();

      if (data.response) {
        setResponse(data.response);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('测试OpenAI时出错:', err);
      setError('测试请求失败，请检查控制台了解详细信息');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg p-6">
      <div className="max-w-2xl mx-auto bg-cream-card rounded-xl shadow-sm p-6 border border-cream-border">
        <h1 className="text-2xl font-bold text-cream-text-dark mb-6">OpenAI API 测试</h1>
        
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-cream-text-dark mb-2">
            测试提示:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
            rows={4}
            placeholder="请输入测试提示，例如：本月需要还多少钱？"
          />
        </div>
        
        <button
          onClick={testOpenAI}
          disabled={isLoading}
          className="px-4 py-2 bg-cream-accent hover:bg-cream-accent-hover text-white rounded-md disabled:opacity-50 transition duration-300"
        >
          {isLoading ? '测试中...' : '测试OpenAI'}
        </button>
        
        <button
          onClick={() => router.push('/dashboard')}
          className="ml-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition duration-300"
        >
          返回仪表板
        </button>
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h2 className="text-lg font-medium text-red-800 mb-2">错误</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {response && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h2 className="text-lg font-medium text-blue-800 mb-2">响应</h2>
            <p className="text-blue-700 whitespace-pre-wrap">{response}</p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <h2 className="text-lg font-medium text-amber-800 mb-2">解决步骤</h2>
          <ul className="list-disc pl-5 text-amber-700 space-y-2">
            <li>检查您的OpenAI API密钥是否正确配置在.env.local文件中</li>
            <li>确认您的OpenAI账户有足够的配额</li>
            <li>如果出现配额错误，请访问OpenAI平台检查您的计划和账单详情</li>
            <li>确保您的API密钥没有过期或被撤销</li>
          </ul>
        </div>
      </div>
    </div>
  );
}