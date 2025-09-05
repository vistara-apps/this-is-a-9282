import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'demo-key',
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
})

export const aiService = {
  /**
   * Generate dynamic 'what to say' and 'what not to say' scripts for specific scenarios
   * @param {string} state - The state name
   * @param {string} scenario - The encounter scenario (e.g., 'Traffic Stop', 'Questioning')
   * @param {string} context - Additional context about the situation
   */
  async generateScripts(state, scenario, context = '') {
    try {
      const prompt = `You are a legal rights advisor. Generate specific, accurate advice for a police encounter in ${state}.

Scenario: ${scenario}
Context: ${context}

Please provide:
1. 3-5 specific phrases the person SHOULD say
2. 3-5 things the person should AVOID saying
3. Keep responses concise and legally accurate
4. Focus on constitutional rights and de-escalation

Format your response as JSON:
{
  "doSay": ["phrase 1", "phrase 2", ...],
  "dontSay": ["avoid this", "don't say this", ...]
}`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a legal rights expert providing accurate, constitutional advice for police encounters. Always prioritize safety and legal accuracy."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })

      const response = completion.choices[0].message.content
      return JSON.parse(response)
    } catch (error) {
      console.error('Error generating scripts:', error)
      // Fallback to generic advice
      return {
        doSay: [
          "I am exercising my right to remain silent",
          "I do not consent to any searches",
          "Am I free to leave?",
          "I want to speak to my attorney"
        ],
        dontSay: [
          "Don't volunteer information",
          "Don't argue or resist",
          "Don't consent to searches",
          "Don't answer questions about your activities"
        ]
      }
    }
  },

  /**
   * Generate a shareable encounter summary
   * @param {Object} encounterData - The encounter log data
   * @param {Object} stateData - The state rights information
   */
  async generateEncounterSummary(encounterData, stateData) {
    try {
      const prompt = `Create a concise, professional summary of a police encounter for sharing with legal counsel or trusted contacts.

Encounter Details:
- Date/Time: ${new Date(encounterData.timestamp).toLocaleString()}
- Location: ${encounterData.location || 'Not specified'}
- State: ${encounterData.state}
- Notes: ${encounterData.notes || 'No additional notes'}

State Rights Summary: ${stateData.rightsSummary}

Create a professional summary that includes:
1. Basic encounter information
2. Relevant rights that apply
3. Any important details from notes
4. Next steps or recommendations

Keep it factual, concise, and suitable for sharing with legal professionals.`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a legal documentation assistant. Create clear, factual summaries of police encounters for legal review."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.2
      })

      return completion.choices[0].message.content
    } catch (error) {
      console.error('Error generating summary:', error)
      // Fallback summary
      return `Police Encounter Summary
Date: ${new Date(encounterData.timestamp).toLocaleString()}
Location: ${encounterData.location || 'Not specified'}
State: ${encounterData.state}

This encounter was documented using Roadside Rights app. 
Key rights in ${encounterData.state}: Right to remain silent, refuse searches, request attorney.

Notes: ${encounterData.notes || 'No additional notes provided'}

Recommendation: Review with legal counsel if needed.`
    }
  },

  /**
   * Get contextual advice for a specific situation
   * @param {string} situation - Description of the current situation
   * @param {string} state - The state where this is happening
   */
  async getContextualAdvice(situation, state) {
    try {
      const prompt = `A person in ${state} is experiencing this situation: "${situation}"

Provide immediate, practical advice focusing on:
1. Constitutional rights that apply
2. Immediate actions to take
3. What to say/not say
4. Safety considerations

Keep response under 200 words and prioritize safety and legal accuracy.`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an emergency legal rights advisor. Provide immediate, accurate guidance for police encounters."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 250,
        temperature: 0.3
      })

      return completion.choices[0].message.content
    } catch (error) {
      console.error('Error getting contextual advice:', error)
      return `Remember your key rights:
• Right to remain silent
• Right to refuse searches
• Right to ask "Am I free to leave?"
• Right to record (in public)
• Right to an attorney

Stay calm, be respectful, and don't resist physically. Document everything you can safely.`
    }
  }
}
