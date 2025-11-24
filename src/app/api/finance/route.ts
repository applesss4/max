import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

// 标记信用卡还款为已还
export async function POST(request: Request) {
  try {
    const { type, id, amount } = await request.json();
    
    if (!type || !id || !amount) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    const supabase = createServerSupabaseClient();
    
    // 获取当前用户
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    if (type === 'creditCard') {
      // 获取当前信用卡信息
      const { data: card, error: cardError } = await supabase
        .from('credit_cards')
        .select('paid_amount')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (cardError) {
        return NextResponse.json({ error: '信用卡不存在或无权访问' }, { status: 404 });
      }
      
      // 更新已还金额
      const newPaidAmount = card.paid_amount + amount;
      const { error: updateError } = await supabase
        .from('credit_cards')
        .update({ paid_amount: newPaidAmount })
        .eq('id', id)
        .eq('user_id', userId);
      
      if (updateError) {
        return NextResponse.json({ error: '更新信用卡信息失败' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: '信用卡还款标记成功' });
    } 
    else if (type === 'loan') {
      // 获取当前贷款信息
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('paid_amount')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (loanError) {
        return NextResponse.json({ error: '贷款不存在或无权访问' }, { status: 404 });
      }
      
      // 更新已还金额
      const newPaidAmount = loan.paid_amount + amount;
      const { error: updateError } = await supabase
        .from('loans')
        .update({ paid_amount: newPaidAmount })
        .eq('id', id)
        .eq('user_id', userId);
      
      if (updateError) {
        return NextResponse.json({ error: '更新贷款信息失败' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: '贷款还款标记成功' });
    } 
    else {
      return NextResponse.json({ error: '不支持的财务类型' }, { status: 400 });
    }
  } catch (error) {
    console.error('处理财务操作时出错:', error);
    return NextResponse.json({ error: '处理请求时发生错误' }, { status: 500 });
  }
}