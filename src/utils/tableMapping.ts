/**
 * 表名到工具名和字段的映射配置
 * 用于适配新的 main_sse.py 架构中的 manage_* 工具
 */

// 表名到工具名的映射
export const TABLE_TO_TOOL_MAP: { [key: string]: string } = {
  'memory': 'manage_memories',
  'viewpoint': 'manage_viewpoints', 
  'insight': 'manage_insights',
  'goal': 'manage_goals',
  'preference': 'manage_preferences',
  'methodology': 'manage_methodologies',
  'focus': 'manage_focuses',
  'prediction': 'manage_predictions'
}

// 每个表的特定字段映射
export const TABLE_FIELD_MAPPING: { [key: string]: { [key: string]: string } } = {
  memory: {
    memory_type: 'memory_type',
    importance: 'importance',
    related_people: 'related_people',
    location: 'location',
    memory_date: 'memory_date',
    reference_urls: 'reference_urls'
  },
  viewpoint: {
    source_people: 'source_people',
    related_event: 'related_event',
    reference_urls: 'reference_urls'
  },
  insight: {
    source_people: 'source_people',
    reference_urls: 'reference_urls'
  },
  goal: {
    type: 'type',
    deadline: 'deadline',
    status: 'status'
  },
  preference: {
    context: 'context'
  },
  methodology: {
    type: 'type',
    effectiveness: 'effectiveness',
    use_cases: 'use_cases',
    reference_urls: 'reference_urls'
  },
  focus: {
    priority: 'priority',
    status: 'status',
    context: 'context',
    deadline: 'deadline'
  },
  prediction: {
    timeframe: 'timeframe',
    basis: 'basis',
    verification_status: 'verification_status',
    reference_urls: 'reference_urls'
  }
}

// 通用字段（所有表都有的字段）
export const COMMON_FIELDS = {
  id: 'id',
  content: 'content',
  keywords: 'keywords',
  source_app: 'source_app',
  privacy_level: 'privacy_level',
  created_time: 'created_time',
  updated_time: 'updated_time'
}

// 获取表的所有字段
export const getTableFields = (tableName: string): string[] => {
  const commonFields = Object.keys(COMMON_FIELDS)
  const specificFields = Object.keys(TABLE_FIELD_MAPPING[tableName] || {})
  return [...commonFields, ...specificFields]
}

// 验证表名是否有效
export const isValidTableName = (tableName: string): boolean => {
  return tableName in TABLE_TO_TOOL_MAP
}

// 获取工具名
export const getToolName = (tableName: string): string | null => {
  return TABLE_TO_TOOL_MAP[tableName] || null
}

// 获取表描述（完全依赖国际化）
export const getTableDescription = (tableName: string, t: (key: string) => string): string => {
  const translationKey = `tables.descriptions.${tableName}`;
  const translation = t(translationKey);
  
  // 如果翻译键和翻译结果相同，说明没有找到翻译
  if (translation === translationKey) {
    return t('common.unknownTable');
  }
  
  return translation;
}

// 获取表名称（完全依赖国际化）
export const getTableName = (tableName: string, t: (key: string) => string): string => {
  const translationKey = `tables.names.${tableName}`;
  const translation = t(translationKey);
  
  // 如果翻译键和翻译结果相同，说明没有找到翻译
  if (translation === translationKey) {
    return t('common.unknownTable');
  }
  
  return translation;
}

// 构建查询参数
export const buildQueryParams = (
  filter?: any,
  sortBy: string = 'created_time',
  sortOrder: string = 'desc',
  limit: number = 20,
  offset: number = 0
) => {
  return {
    action: 'query',
    filter: filter || {},
    sort_by: sortBy,
    sort_order: sortOrder,
    limit,
    offset
  }
}

// 构建保存参数
export const buildSaveParams = (record: any) => {
  return {
    action: 'save',
    ...record
  }
} 