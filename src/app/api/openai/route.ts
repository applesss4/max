import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // 请在.env.local文件中设置您的OpenAI API密钥
});

// 定义系统角色，告诉AI如何处理财务数据
const SYSTEM_PROMPT = `你是一个专业的个人财务助手，能够理解和处理中文的财务查询。你需要根据用户提供的语音指令来分析和管理他们的财务数据。

用户的财务数据包括：
1. 信用卡信息：
   - ID (id)
   - 信用卡名称 (card_name)
   - 卡号后四位 (card_number_last_4)
   - 总金额 (total_amount)
   - 月还款金额 (monthly_payment)
   - 还款日期 (payment_date)
   - 已还金额 (paid_amount)
   - 期数 (periods)
   - 卡类型 (card_type): 分期(installment)或不分期(non_installment)

2. 贷款信息：
   - ID (id)
   - 贷款名称 (loan_name)
   - 贷款类型 (loan_type)
   - 总金额 (total_amount)
   - 月还款金额 (monthly_payment)
   - 还款日期 (payment_date)
   - 已还金额 (paid_amount)
   - 期数 (periods)
   - 利率 (interest_rate)
   - 开始日期 (start_date)
   - 结束日期 (end_date)

请根据用户的语音指令提供以下服务：
1. 查询本月或指定月份的还款总额
2. 查询即将到期的还款项目
3. 标记某项还款为已还（需要用户确认）
4. 给出财务建议和分析
5. 回答关于财务状况的问题

对于需要执行操作的指令（如标记还款为已还），请在回复中包含以下格式的操作标记：
[操作类型:creditCard|loan, ID:具体ID, 金额:具体金额]
例如：[操作类型:creditCard, ID:123e4567-e89b-12d3-a456-426614174000, 金额:1500.00]

请用中文回复，语言要简洁明了，适合语音播报。不要包含任何HTML或Markdown格式。`;

export async function POST(request: Request) {
  try {
    const { prompt, financialData } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '缺少提示信息' }, { status: 400 });
    }

    // 检查API密钥是否配置
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
      return NextResponse.json({ 
        error: 'OpenAI API密钥未配置，请在.env.local文件中设置OPENAI_API_KEY' 
      }, { status: 500 });
    }

    // 构建包含财务数据的消息
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { 
        role: 'user', 
        content: `用户的财务数据：${JSON.stringify(financialData, null, 2)}\n\n用户的语音指令：${prompt}` 
      }
    ];

    // 调用OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('OpenAI API错误:', error);
    
    // 处理特定的错误类型
    if (error.status === 429) {
      return NextResponse.json({ 
        error: 'OpenAI API使用配额已超出，请检查您的账户计划和账单详情，或稍后再试。' 
      }, { status: 429 });
    } else if (error.status === 401) {
      return NextResponse.json({ 
        error: 'OpenAI API密钥无效，请检查您的API密钥配置。' 
      }, { status: 401 });
    } else if (error.status === 400) {
      return NextResponse.json({ 
        error: '请求参数错误，请检查发送给OpenAI API的数据。' 
      }, { status: 400 });
    } else {
      return NextResponse.json({ 
        error: '处理请求时发生错误，请稍后重试。' 
      }, { status: 500 });
    }
  }
}