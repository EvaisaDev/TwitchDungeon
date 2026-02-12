export async function callUnifiedAI(messages, jsonSchema, config = {}) {
	const { apiKey, apiModel } = config;

	if (!apiKey) {
		throw new Error('No LLM provider available');
	}

	const lowReasoningModels = ['gpt-5-nano', 'gpt-5-mini'];
	const disableReasoningModels = ['gpt-5.1', 'gpt-5.2'];

	const bodyData = {
		model: apiModel,
		input: messages
	};

	if (jsonSchema) {
		bodyData.text = {
			format: {
				type: 'json_schema',
				name: jsonSchema.name,
				schema: jsonSchema.schema,
				strict: true
			}
		};
	}

	if (lowReasoningModels.includes(apiModel)) {
		bodyData.reasoning = { effort: 'low' };
	}
	if (disableReasoningModels.includes(apiModel)) {
		bodyData.reasoning = { effort: 'none' };
	}

	const response = await fetch('https://api.openai.com/v1/responses', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify(bodyData)
	});

	const data = await response.json();
	console.log('LLM Response:', data);
	
	if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
		throw new Error('Invalid response structure');
	}
	
	const message = data.output.find(item => item.type === 'message');
	if (!message || !message.content || !Array.isArray(message.content) || message.content.length === 0) {
		throw new Error('No content in message');
	}
	
	const content = message.content[0];
	
	if (content.type === 'refusal') {
		throw new Error('LLM refused request: ' + content.refusal);
	}
	
	if (content.type === 'output_text') {
		if (jsonSchema) {
			return JSON.parse(content.text);
		}
		return content.text;
	}
	
	throw new Error('Invalid content type: ' + content.type);
}
