import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { AVAILABLE_MODELS, getDefaultModel } from "./models";

// Initialize clients
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Re-export for backward compatibility
export { AVAILABLE_MODELS, getDefaultModel };

// Call AI with timeout & retries (provider-agnostic)
export async function callAI(
  promptOrMessages,
  provider = "openai",
  model = null,
  maxTokens = 8000,
  retries = 2,
  timeoutMs = 120000
) {
  // Validate provider
  if (!AVAILABLE_MODELS[provider]) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  // Validate model if specified
  if (model) {
    const validModels = AVAILABLE_MODELS[provider].map(m => m.id);
    if (!validModels.includes(model)) {
      console.warn(`Model ${model} not in allowed list, but attempting to use it anyway.`);
      // Allow the model to be used - the API will reject it if it's invalid
    }
  }

  // Get default model if not specified
  if (!model) {
    model = getDefaultModel(provider);
  }

  // Route to appropriate provider
  switch (provider) {
    case "claude":
      return await callClaude(promptOrMessages, model, maxTokens, retries, timeoutMs);
    case "openai":
      return await callOpenAI(promptOrMessages, model, maxTokens, retries, timeoutMs);
    default:
      throw new Error(`Provider ${provider} not implemented`);
  }
}

// Claude implementation
async function callClaude(promptOrMessages, model, maxTokens, retries, timeoutMs) {
  if (!anthropic) {
    throw new Error("Anthropic API key not configured");
  }

  while (retries > 0) {
    try {
      let messages;
      let systemPrompt = null;

      if (typeof promptOrMessages === 'string') {
        messages = [{ role: "user", content: promptOrMessages }];
      } else if (Array.isArray(promptOrMessages)) {
        const systemMsg = promptOrMessages.find(msg => msg.role === 'system');
        if (systemMsg) {
          systemPrompt = systemMsg.content;
        }
        messages = promptOrMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({ role: msg.role, content: msg.content }));
      } else {
        messages = [{ role: "user", content: String(promptOrMessages) }];
      }

      const apiParams = {
        model: model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: messages
      };

      if (systemPrompt) {
        apiParams.system = systemPrompt;
      }

      const response = await Promise.race([
        anthropic.messages.create(apiParams),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI request timed out")), timeoutMs)
        )
      ]);

      // Normalize response format
      return {
        provider: "claude",
        model: response.model,
        content: response.content,
        usage: response.usage,
        stop_reason: response.stop_reason
      };
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      console.log(`Retrying Claude... (${retries} attempts left)`);
    }
  }
}

// OpenAI implementation
async function callOpenAI(promptOrMessages, model, maxTokens, retries, timeoutMs) {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  while (retries > 0) {
    try {
      let messages;
      let systemPrompt = null;

      if (typeof promptOrMessages === 'string') {
        messages = [{ role: "user", content: promptOrMessages }];
      } else if (Array.isArray(promptOrMessages)) {
        const systemMsg = promptOrMessages.find(msg => msg.role === 'system');
        if (systemMsg) {
          systemPrompt = systemMsg.content;
        }
        messages = promptOrMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({ role: msg.role, content: msg.content }));
      } else {
        messages = [{ role: "user", content: String(promptOrMessages) }];
      }

      // Add system message if present
      if (systemPrompt) {
        messages = [{ role: "system", content: systemPrompt }, ...messages];
      }

      const apiParams = {
        model: model || process.env.OPENAI_MODEL || "gpt-5-mini",
        max_completion_tokens: maxTokens,
        messages: messages
      };

      const response = await Promise.race([
        openai.chat.completions.create(apiParams),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI request timed out")), timeoutMs)
        )
      ]);

      // Normalize response format to match Claude's structure
      return {
        provider: "openai",
        model: response.model,
        content: [{ text: response.choices[0].message.content }],
        usage: {
          input_tokens: response.usage.prompt_tokens,
          output_tokens: response.usage.completion_tokens
        },
        stop_reason: response.choices[0].finish_reason === "length" ? "max_tokens" : "stop"
      };
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      console.log(`Retrying OpenAI... (${retries} attempts left)`);
    }
  }
}

