/* ==========================================
   L'Oréal Smart Product Advisor
   script.js
========================================== */

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const currentQuestion = document.getElementById("currentQuestion");
const typingIndicator = document.getElementById("typingIndicator");
const modeButtons = document.querySelectorAll(".mode-button");
let shouldClearInputOnType = false;

const WORKER_URL = "https://lrealchatbot.padgetmh.workers.dev/";

const beautySectionIcons = {
  summary: "🪞",
  overview: "✨",
  introduction: "✨",
  "skin type": "🌸",
  "skin analysis": "🪞",
  analysis: "🪞",
  "skincare routine": "🧴",
  routine: "🧴",
  steps: "🧴",
  "morning routine": "🌞",
  "night routine": "🌙",
  cleanser: "🫧",
  moisturizer: "💧",
  serum: "✨",
  sunscreen: "☀️",
  ingredients: "🌿",
  products: "🛍️",
  "product recommendations": "💄",
  makeup: "💋",
  foundation: "🎨",
  eyeshadow: "👁️",
  lip: "💄",
  tutorial: "📖",
  tips: "💡",
  "beauty tips": "🌷",
  warning: "⚠️",
  avoid: "🚫",
  results: "🌟",
  conclusion: "💖",
  questions: "❓",
  answer: "💬",
};

const beautySectionLabels = {
  summary: "Beauty Summary",
  overview: "Beauty Overview",
  "skin type": "Skin Type",
  "skin analysis": "Skin Analysis",
  analysis: "Skin Analysis",
  steps: "Skincare Routine",
  routine: "Skincare Routine",
  "skincare routine": "Skincare Routine",
  products: "Product Recommendations",
  "product recommendations": "Product Recommendations",
};

if (window.marked) {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
}

const messages = [
  {
    role: "system",
    content: `
You are the L'Oréal Smart Product Advisor.

Help users with:

- L'Oréal skincare
- Haircare
- Makeup
- Fragrance
- Beauty routines
- Product recommendations
- Ingredients
- Beauty tips

Keep answers beginner-friendly and visually structured when helpful.
Use short sections like Summary, Key Points, Steps, Code, and Details.
If you include code, keep it inside fenced code blocks.
If someone asks something unrelated to beauty or L'Oréal, politely explain that you only answer beauty-related questions.
`,
  },
];

addAssistantMessage(
  "👋 Hello! Welcome to the L'Oréal Smart Product Advisor. Ask me anything about skincare, makeup, haircare, fragrances, beauty routines, or L'Oréal products.",
);

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const prompt = button.dataset.prompt;

    if (!prompt) {
      return;
    }

    userInput.value = prompt;
    shouldClearInputOnType = true;
    userInput.focus();
  });
});

userInput.addEventListener("keydown", (event) => {
  if (!shouldClearInputOnType) {
    return;
  }

  // Keep navigation and editing keys working normally.
  const nonTypingKeys = [
    "Shift",
    "Control",
    "Alt",
    "Meta",
    "CapsLock",
    "Tab",
    "Escape",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "PageUp",
    "PageDown",
  ];

  if (nonTypingKeys.includes(event.key)) {
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    shouldClearInputOnType = false;
    return;
  }

  userInput.value = "";
  shouldClearInputOnType = false;
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = userInput.value.trim();

  if (question === "") {
    return;
  }

  shouldClearInputOnType = false;

  currentQuestion.textContent = `Latest Question: ${question}`;

  addUserMessage(question);

  messages.push({
    role: "user",
    content: question,
  });

  userInput.value = "";
  setTypingState(true);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to contact chatbot.");
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "I could not generate a response.";

    messages.push({
      role: "assistant",
      content: reply,
    });

    addAssistantMessage(reply);
  } catch (error) {
    addAssistantMessage(
      "Sorry, I couldn't connect to the AI service. Please check your Cloudflare Worker URL and try again.",
      {
        variant: "warning",
      },
    );

    console.error(error);
  } finally {
    setTypingState(false);
  }
});

function addUserMessage(text) {
  const group = document.createElement("div");
  group.className = "message-group message-group--user";

  const label = document.createElement("div");
  label.className = "role-label role-label--user";
  label.textContent = "👤 User";

  const message = document.createElement("div");
  message.className = "message user-message";
  message.textContent = text;

  group.appendChild(label);
  group.appendChild(message);

  chatWindow.appendChild(group);
  scrollChatToBottom();
}

function addAssistantMessage(text, options = {}) {
  const responseStack = document.createElement("div");
  responseStack.className = "response-stack ai-response";

  const label = document.createElement("div");
  label.className = "role-label role-label--assistant";
  label.textContent = "✨ Beauty AI Assistant";

  responseStack.appendChild(label);

  const formattedReply = addBeautyIcons(text);

  const sections = parseAssistantReply(formattedReply, options);

  sections.forEach((section) => {
    responseStack.appendChild(createResponseCard(section));
  });

  responseStack.appendChild(createResponseActions(formattedReply));

  chatWindow.appendChild(responseStack);
  scrollChatToBottom();
}

function normalizeHeadingText(text) {
  return text
    .replace(/^[^a-z0-9]+/i, "")
    .replace(/[:\-]\s*$/, "")
    .trim()
    .toLowerCase();
}

function capitalize(text) {
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function addBeautyIcons(responseText) {
  return responseText.replace(/^###\s+(.+)$/gim, (match, headingText) => {
    const normalizedHeading = normalizeHeadingText(headingText);
    const icon = beautySectionIcons[normalizedHeading];

    if (!icon) {
      return match;
    }

    const label = beautySectionLabels[normalizedHeading] || capitalize(normalizedHeading);
    return `### ${icon} ${label}`;
  });
}

function parseCustomEmojiHeading(headingText) {
  const parts = headingText.trim().split(/\s+/);

  if (parts.length < 2) {
    return null;
  }

  const firstPart = parts[0];

  if (/[a-z0-9]/i.test(firstPart)) {
    return null;
  }

  return {
    title: parts.slice(1).join(" "),
    emoji: firstPart,
    type: "features",
    collapsible: false,
  };
}

function parseAssistantReply(text, options = {}) {
  const normalizedText = text.replace(/\r\n/g, "\n").trim();

  if (normalizedText === "") {
    return [
      {
        title: "Quick Summary",
        emoji: "🧠",
        type: options.variant || "summary",
        collapsible: false,
        content: "The assistant reply was empty.",
      },
    ];
  }

  const lines = normalizedText.split("\n");
  const sections = [];
  let currentSection = null;
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmedLine = rawLine.trim();

    if (trimmedLine.startsWith("```")) {
      const language = trimmedLine.replace(/^```/, "").trim() || "Code";
      const codeLines = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      sections.push({
        title: "Code",
        emoji: "💻",
        type: "code",
        collapsible: false,
        language,
        content: codeLines.join("\n").trimEnd(),
      });

      index += 1;
      continue;
    }

    const heading = getHeadingMeta(trimmedLine);

    if (!heading) {
      const markdownHeading = trimmedLine.match(/^#{1,6}\s+(.*)$/);

      if (markdownHeading) {
        const headingMeta =
          getHeadingMeta(markdownHeading[1]) ||
          parseCustomEmojiHeading(markdownHeading[1]) || {
          title: markdownHeading[1].trim(),
          emoji: "✨",
          type: "feature",
          collapsible: false,
        };

        if (currentSection && currentSection.content.trim() !== "") {
          sections.push(currentSection);
        }

        currentSection = {
          title: headingMeta.title,
          emoji: headingMeta.emoji,
          type: headingMeta.type,
          collapsible: headingMeta.collapsible,
          content: "",
        };

        index += 1;
        continue;
      }
    }

    if (heading) {
      if (currentSection && currentSection.content.trim() !== "") {
        sections.push(currentSection);
      }

      currentSection = {
        title: heading.title,
        emoji: heading.emoji,
        type: heading.type,
        collapsible: heading.collapsible,
        content: "",
      };

      index += 1;
      continue;
    }

    if (!currentSection) {
      currentSection = {
        title: "Quick Summary",
        emoji: "🧠",
        type: "summary",
        collapsible: false,
        content: "",
      };
    }

    currentSection.content += `${rawLine}\n`;
    index += 1;
  }

  if (currentSection && currentSection.content.trim() !== "") {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    sections.push({
      title: "Quick Summary",
      emoji: "🧠",
      type: "summary",
      collapsible: false,
      content: normalizedText,
    });
  }

  return sections;
}

function getHeadingMeta(line) {
  const cleanedLine = line
    .replace(/^#{1,6}\s*/, "")
    .replace(/[:\-]\s*$/, "")
    .trim()
    .toLowerCase();

  const headingMap = [
    { match: /^(quick summary|summary|overview)$/, title: "Quick Summary", emoji: "🧠", type: "summary" },
    { match: /^(key points|important points|main points)$/, title: "Key Points", emoji: "📌", type: "points" },
    { match: /^(steps|step-by-step|how to|next steps)$/, title: "Steps", emoji: "🚀", type: "steps" },
    { match: /^(code|example code|sample code)$/, title: "Code", emoji: "💻", type: "code" },
    { match: /^(examples|example|demo)$/, title: "Examples", emoji: "🧪", type: "examples" },
    { match: /^(warning|important|note|caution)$/, title: "Warning", emoji: "⚠️", type: "warning" },
    { match: /^(checklist|to do|todo)$/, title: "Checklist", emoji: "📋", type: "checklist" },
    { match: /^(details|advanced details|more details)$/, title: "Details", emoji: "⚙️", type: "details", collapsible: true },
    { match: /^(learning|learning mode|explanation)$/, title: "Explanation", emoji: "💡", type: "explanation" },
    { match: /^(features|feature|highlights)$/, title: "Features", emoji: "✨", type: "features" },
  ];

  const matchedHeading = headingMap.find((heading) => heading.match.test(cleanedLine));

  if (!matchedHeading) {
    return null;
  }

  return {
    title: matchedHeading.title,
    emoji: matchedHeading.emoji,
    type: matchedHeading.type,
    collapsible: matchedHeading.collapsible || false,
  };
}

function createResponseCard(section) {
  const card = document.createElement("section");
  card.className = `response-card response-card--${section.type}`;

  if (section.collapsible) {
    const details = document.createElement("details");
    details.open = false;

    const summary = document.createElement("summary");
    summary.className = "response-card-summary";

    const tag = document.createElement("span");
    tag.className = "response-tag";
    tag.textContent = section.emoji;

    const heading = document.createElement("span");
    heading.textContent = section.title;

    summary.appendChild(tag);
    summary.appendChild(heading);

    const body = document.createElement("div");
    body.className = "response-card-body";
    appendSectionContent(body, section);

    details.appendChild(summary);
    details.appendChild(body);
    card.appendChild(details);

    return card;
  }

  const header = document.createElement("div");
  header.className = "response-card-header";

  const tag = document.createElement("span");
  tag.className = "response-tag";
  tag.textContent = section.emoji;

  const heading = document.createElement("h3");
  heading.textContent = section.title;

  header.appendChild(tag);
  header.appendChild(heading);

  const body = document.createElement("div");
  body.className = "response-card-body";
  appendSectionContent(body, section);

  card.appendChild(header);
  card.appendChild(body);

  return card;
}

function appendSectionContent(container, section) {
  if (section.type === "code") {
    container.appendChild(createCodeBox(section.content, section.language));
    return;
  }

  const content = section.content.trim();

  if (content === "") {
    return;
  }

  const markdownBlock = document.createElement("div");
  markdownBlock.className = "response-markdown";
  markdownBlock.innerHTML = window.marked ? window.marked.parse(content) : content;
  container.appendChild(markdownBlock);
}

function createCodeBox(codeText, language) {
  const codeBox = document.createElement("div");
  codeBox.className = "code-box";

  const header = document.createElement("div");
  header.className = "code-header";

  const languageLabel = document.createElement("span");
  languageLabel.className = "code-language";
  languageLabel.textContent = language || "Code";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "code-copy-button";
  copyButton.textContent = "Copy";
  copyButton.addEventListener("click", async () => {
    await copyText(codeText);
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1500);
  });

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = codeText;
  pre.appendChild(code);

  header.appendChild(languageLabel);
  header.appendChild(copyButton);

  codeBox.appendChild(header);
  codeBox.appendChild(pre);

  return codeBox;
}

function createResponseActions(replyText) {
  const actions = document.createElement("div");
  actions.className = "response-actions";

  const copyReplyButton = document.createElement("button");
  copyReplyButton.type = "button";
  copyReplyButton.className = "response-action";
  copyReplyButton.textContent = "Copy reply";
  copyReplyButton.addEventListener("click", async () => {
    await copyText(replyText);
    copyReplyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyReplyButton.textContent = "Copy reply";
    }, 1500);
  });

  const simplifyButton = document.createElement("button");
  simplifyButton.type = "button";
  simplifyButton.className = "response-action";
  simplifyButton.textContent = "Simplify";
  simplifyButton.addEventListener("click", () => {
    userInput.value = "Explain the last answer in a simpler way with short sections and examples.";
    userInput.focus();
  });

  const explainMoreButton = document.createElement("button");
  explainMoreButton.type = "button";
  explainMoreButton.className = "response-action";
  explainMoreButton.textContent = "Explain more";
  explainMoreButton.addEventListener("click", () => {
    userInput.value = "Give me more detail about the last answer and include a step-by-step explanation.";
    userInput.focus();
  });

  actions.appendChild(copyReplyButton);
  actions.appendChild(simplifyButton);
  actions.appendChild(explainMoreButton);

  return actions;
}

function setTypingState(isTyping) {
  typingIndicator.classList.toggle("hidden", !isTyping);
}

function scrollChatToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  tempInput.setAttribute("readonly", "true");
  tempInput.style.position = "absolute";
  tempInput.style.left = "-9999px";
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
}
