import { MCPSettings } from '@/types';

// MCP 服务器配置
export const MCP_CONFIG: MCPSettings = {
  mcpUrl: 'http://127.0.0.1:8088/sse',
  mcpTool: 'get_all_table_contents'
};

// 表格名称映射
export const TABLE_NAMES = {
  belief: '信念',
  insight: '洞察', 
  focus: '关注点',
  long_term_goal: '长期目标',
  short_term_goal: '短期目标',
  preference: '偏好',
  decision: '决策',
  methodology: '方法论'
} as const;

// 表格描述
export const TABLE_DESCRIPTIONS = {
  belief: '记录您的核心信念和价值观',
  insight: '记录您的思考洞察和发现',
  focus: '记录当前关注的重点领域',
  long_term_goal: '记录您的长期目标和愿景',
  short_term_goal: '记录您的短期目标和计划',
  preference: '记录您的偏好和选择倾向',
  decision: '记录重要的决策和选择',
  methodology: '记录您的方法论和思维框架'
} as const; 