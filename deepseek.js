export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { poseName, duration } = req.body;

const prompt = `你是一位专业的瑜伽教练。请为体式“${poseName}”生成一份${duration}分钟的口令。

请严格按照以下格式输出，每个部分用【】标记，不要有多余内容：

【进入体式】
- 每个动作单元必须独立成行。
- 如果该行包含“吸气”或“呼气”作为动作引导词，则“吸气”或“呼气”必须放在行首。
- “吸气”或“呼气”引导词所在的行，必须包含该呼吸周期内的全部动作描述，用分号或逗号分隔，不要拆分到多行。
- 例如：
  屈右膝，右脚放于左膝外侧，前脚趾回勾
  吸气，收腹挺胸延展脊柱向上，左手上举，带动左侧腰的拉伸
  呼气，左手带身体向右向后扭转，左手肘抵于右膝外侧，形成对抗的力；右手放于臂部后侧，指尖点地，眼睛看向右肩方向
  保持5个呼吸

【保持要点】
- 使用 ${duration === 2 ? '3-2-1' : '5-4-3-2-1'} 倒计时
- 每个数字独占一行，数字后跟该呼吸周期的完整感受描述
- 例如：
  5-每一次吸气，延展脊柱
  4-每一次呼气，左手肘对抗的力，扭转更多
  3-不要弓背
  2-肩膀放松，收肩胛沉肩
  1-感受脊柱的扭转

【退出体式】
- 每个动作单元独立成行，按顺序排列退出步骤。
- 如果包含“吸气”或“呼气”引导词，放在行首，后面跟上该呼吸周期内的完整动作。
- 如果涉及反侧练习，单独成行提示“换反侧练习”。
- 例如：
  呼气，头部回正，身体回正，右腿伸直
  抖动双腿放松
  换反侧练习

【注意事项】
- ${duration === 2 ? '列出2条' : '列出3-4条'}关键注意事项
- 每条单独成行

要求：
1. 语言口语化，简洁清晰
2. 进入体式、退出体式的每一步，如果包含多个动作，用分号或逗号连接，但必须保持在同一行内
3. 保持要点数字单独成行
4. 不要使用Markdown格式，不要加额外说明
5. 只输出上述四个部分，不要添加其他内容`;

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

     const parts = content.split(/【进入体式】|【保持要点】|【退出体式】|【注意事项】/);
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