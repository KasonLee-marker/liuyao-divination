<template>
  <div class="ai-interpretation">
    <!-- 思考过程区域 -->
    <div v-if="thinking" class="thinking-section">
      <el-collapse v-model="thinkingExpanded">
        <el-collapse-item name="thinking">
          <template #title>
            <div class="thinking-header">
              <el-icon class="thinking-icon"><Cpu /></el-icon>
              <span>思考过程</span>
              <span class="thinking-status">{{ isGenerating ? '思考中...' : '已完成' }}</span>
            </div>
          </template>
          <div class="thinking-content" v-html="renderMarkdown(thinking)"></div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 正文内容 -->
    <div class="main-content">
      <div v-if="content" v-html="renderMarkdown(content)" class="markdown-body"></div>
      <div v-else-if="isGenerating" class="generating-hint">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在生成解读...</span>
      </div>
    </div>

    <!-- 生成中光标 -->
    <span v-if="isGenerating" class="cursor-blink">▌</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { marked } from 'marked'
import { Cpu, Loading } from '@element-plus/icons-vue'

const props = defineProps<{
  fullText: string
  isGenerating: boolean
}>()

const thinking = ref('')
const content = ref('')
const thinkingExpanded = ref<string[]>(['thinking'])

// 解析文本，分离思考过程和正文
function parseText(text: string) {
  // 匹配 <think>...</think> 或  authDomain...
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g
  let thinkingText = ''
  let mainText = text

  // 提取思考过程
  let match
  while ((match = thinkRegex.exec(text)) !== null) {
    thinkingText += match[1]
  }

  // 移除思考标签，保留正文
  mainText = text.replace(thinkRegex, '').trim()

  // 处理未闭合的 think 标签（正在生成中）
  const unclosedThink = text.match(/<think>([^]*?)$/)
  if (unclosedThink && !text.includes('</think>')) {
    thinkingText = unclosedThink[1]
    mainText = ''
  }

  return { thinkingText, mainText }
}

// 监听文本变化，实时解析
watch(() => props.fullText, (newText) => {
  const { thinkingText, mainText } = parseText(newText)
  thinking.value = thinkingText
  content.value = mainText
}, { immediate: true })

// 渲染 Markdown
function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked(text) as string
}
</script>

<style scoped>
.ai-interpretation {
  line-height: 1.8;
}

/* 思考区域样式 */
.thinking-section {
  margin-bottom: 16px;
}

.thinking-section :deep(.el-collapse) {
  border: none;
}

.thinking-section :deep(.el-collapse-item__header) {
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  padding: 0 12px;
  height: 36px;
  font-size: 13px;
}

.thinking-section :deep(.el-collapse-item__wrap) {
  border: none;
  background-color: var(--el-fill-color-lighter);
  border-radius: 0 0 6px 6px;
}

.thinking-section :deep(.el-collapse-item__content) {
  padding: 12px;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.thinking-icon {
  color: var(--el-color-primary);
}

.thinking-status {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

.thinking-content {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.thinking-content :deep(p) {
  margin: 4px 0;
}

/* 正文样式 */
.main-content {
  min-height: 20px;
}

.generating-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

/* Markdown 样式 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin: 16px 0 8px;
  font-weight: 600;
}

.markdown-body :deep(h1) { font-size: 20px; }
.markdown-body :deep(h2) { font-size: 18px; }
.markdown-body :deep(h3) { font-size: 16px; }

.markdown-body :deep(p) {
  margin: 8px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-body :deep(li) {
  margin: 4px 0;
}

.markdown-body :deep(strong) {
  font-weight: 600;
}

.markdown-body :deep(code) {
  background-color: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  background-color: var(--el-fill-color-dark);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}

/* 生成中光标 */
.cursor-blink {
  color: var(--el-color-primary);
  font-weight: bold;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>