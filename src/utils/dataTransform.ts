import { ProfileData, ProfileRecord, TableData, ExtendedRecord } from '@/types';
import { TABLE_DESCRIPTIONS, getTableDescription } from './tableMapping';

// 处理记录中的JSON字段
export const processRecordFields = (record: any): ProfileRecord => {
  const processedRecord = { ...record };
  
  // 处理keywords字段
  if (processedRecord.keywords && typeof processedRecord.keywords === 'string') {
    try {
      processedRecord.keywords = JSON.parse(processedRecord.keywords);
    } catch {
      processedRecord.keywords = [];
    }
  }
  
  // 处理reference_urls字段
  if (processedRecord.reference_urls && typeof processedRecord.reference_urls === 'string') {
    try {
      processedRecord.reference_urls = JSON.parse(processedRecord.reference_urls);
    } catch {
      processedRecord.reference_urls = [];
    }
  }
  
  return processedRecord;
};

// 创建空的表格数据结构
export const createEmptyTableData = (description: string): TableData => ({
  description,
  records: [],
  stats: {
    total_records: 0
  }
});

// 创建空的ProfileData结构
export const createEmptyProfileData = (): ProfileData => ({
  viewpoint: createEmptyTableData(getTableDescription('viewpoint')),
  insight: createEmptyTableData(getTableDescription('insight')),
  focus: createEmptyTableData(getTableDescription('focus')),
  goal: createEmptyTableData(getTableDescription('goal')),
  preference: createEmptyTableData(getTableDescription('preference')),
  methodology: createEmptyTableData(getTableDescription('methodology')),
  prediction: createEmptyTableData(getTableDescription('prediction')),
  memory: createEmptyTableData(getTableDescription('memory'))
});

// 验证记录数据的完整性
export const validateRecord = (record: any): boolean => {
  return record && 
         typeof record.id === 'number' && 
         typeof record.content === 'string' && 
         record.content.trim().length > 0;
};

// 格式化时间显示
export const formatTime = (timeString?: string): string => {
  if (!timeString) return '--';
  
  try {
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '--';
  }
};

// 获取标签颜色类名
export const getTagColor = (tag: string): string => {
  const colors = [
    'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
    'bg-gradient-to-r from-green-500 to-green-600 text-white',
    'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
    'bg-gradient-to-r from-pink-500 to-pink-600 text-white',
    'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
    'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
    'bg-gradient-to-r from-red-500 to-red-600 text-white',
    'bg-gradient-to-r from-teal-500 to-teal-600 text-white',
    'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
  ];
  
  const hash = tag.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

// 获取表格颜色类名
export const getTableColor = (tableKey: string): string => {
  const colors = [
    'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
    'bg-gradient-to-r from-green-500 to-green-600 text-white',
    'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
    'bg-gradient-to-r from-pink-500 to-pink-600 text-white',
    'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
    'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
    'bg-gradient-to-r from-red-500 to-red-600 text-white',
  ];
  
  const tableKeys = Object.keys(TABLE_DESCRIPTIONS);
  const index = tableKeys.indexOf(tableKey);
  return colors[index % colors.length];
};

// 过滤和搜索记录
export const filterRecords = (
  records: (ProfileRecord & ExtendedRecord)[],
  searchTerm: string,
  selectedTag: string,
  deletedRecords: Set<string>
): (ProfileRecord & ExtendedRecord)[] => {
  return records.filter(record => {
    // 排除已删除的记录
    const recordKey = `${record.id}`;
    if (deletedRecords.has(recordKey)) {
      return false;
    }
    
    // 搜索匹配
    const matchesSearch = !searchTerm || 
      record.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.keywords?.some(keyword => 
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // 标签匹配
    const matchesTag = !selectedTag || 
      record.keywords?.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });
};

// 获取所有唯一标签
export const getAllTags = (profileData: ProfileData): string[] => {
  const tags = new Set<string>();
  
  Object.values(profileData).forEach(tableData => {
    if (tableData && typeof tableData === 'object' && 'records' in tableData) {
      tableData.records.forEach(record => {
        record.keywords?.forEach(keyword => tags.add(keyword));
      });
    }
  });
  
  return Array.from(tags).sort();
};

// 重新导出TABLE_DESCRIPTIONS以保持向后兼容
export { TABLE_DESCRIPTIONS }; 