import { MCPSettings } from '../types';
import { getResourceDirAndConfig, getMCPUrl } from '../utils/configManager';

// 获取MCP配置
export const getMCPConfig = async (): Promise<MCPSettings> => {
  const { configData } = await getResourceDirAndConfig();
  const mcpUrl = getMCPUrl(configData);
  
  return {
    mcpUrl,
    mcpTool: 'get_all_table_contents'
  };
};

// 默认MCP配置（向后兼容）
export const MCP_CONFIG: MCPSettings = {
  mcpUrl: 'http://127.0.0.1:8088/sse',
  mcpTool: 'get_all_table_contents'
};

// 表格名称映射（后备方案）
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

// 表格描述（后备方案）
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

// 表格键类型
export type TableKey = keyof typeof TABLE_NAMES;

// 获取国际化表格名称的函数
export const getTableName = (tableKey: TableKey, t?: (key: string) => string): string => {
  if (t) {
    try {
      return t(`tables.names.${tableKey}`);
    } catch (error) {
      console.warn(`Translation not found for table name: ${tableKey}`, error);
    }
  }
  return TABLE_NAMES[tableKey];
};

// 获取国际化表格描述的函数
export const getTableDescription = (tableKey: TableKey, t?: (key: string) => string): string => {
  if (t) {
    try {
      return t(`tables.descriptions.${tableKey}`);
    } catch (error) {
      console.warn(`Translation not found for table description: ${tableKey}`, error);
    }
  }
  return TABLE_DESCRIPTIONS[tableKey];
};

// 获取所有表格名称映射（国际化版本）
export const getAllTableNames = (t?: (key: string) => string): Record<TableKey, string> => {
  const tableKeys = Object.keys(TABLE_NAMES) as TableKey[];
  return tableKeys.reduce((acc, key) => {
    acc[key] = getTableName(key, t);
    return acc;
  }, {} as Record<TableKey, string>);
};

// 获取所有表格描述映射（国际化版本）
export const getAllTableDescriptions = (t?: (key: string) => string): Record<TableKey, string> => {
  const tableKeys = Object.keys(TABLE_DESCRIPTIONS) as TableKey[];
  return tableKeys.reduce((acc, key) => {
    acc[key] = getTableDescription(key, t);
    return acc;
  }, {} as Record<TableKey, string>);
}; 