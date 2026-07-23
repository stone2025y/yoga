export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { poseName, duration } = req.body;

    const prompt = `你是一位专业的瑜伽教练。请为体式“${poseName}”生成一份${duration}分钟的口令。

要求按以下结构输出，用中文，口语化，适合练习时跟随：
1. 进入体式：如何进入这个体式
2. 保持要点：用倒计时形式（${duration === 2 ? '3-2-1' : '5-4-3-2-1'}）描述保持时的身体感受和调整
3. 退出体式：如何安全退出
4. 注意事项：练习时的禁忌或需要留意的细节

请直接按“进入体式：...保持要点：...退出体式：...注意事项：...”的格式返回，不要有多余内容。`;

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是一位专业的瑜伽教练，擅长用清晰的口令引导练习者完成体式。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 800
            })
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('AI 返回内容为空');
        }

        const parts = content.split(/进入体式：|保持要点：|退出体式：|注意事项：/);
        const result = {
            enter: parts[1]?.trim() || '',
            hold: parts[2]?.trim() || '',
            exit: parts[3]?.trim() || '',
            note: parts[4]?.trim() || ''
        };

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}