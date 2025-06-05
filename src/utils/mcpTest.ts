/**
 * MCP 新架构测试工具
 * 用于验证 manage_* 工具的调用是否正常
 */

import { 
  queryRecords, 
  saveRecord, 
  getPersona, 
  executeCustomSQL,
  getTableSchema 
} from '../services/MCP';
import { 
  TABLE_TO_TOOL_MAP, 
  isValidTableName, 
  getToolName,
  getTableDescription 
} from './tableMapping';

// 测试所有表的查询功能
export const testAllTableQueries = async () => {
  console.log('开始测试所有表的查询功能...');
  
  const results: { [key: string]: any } = {};
  
  for (const tableName of Object.keys(TABLE_TO_TOOL_MAP)) {
    try {
      console.log(`测试查询 ${tableName} 表...`);
      
      const result = await queryRecords(tableName, { limit: 5 });
      
      results[tableName] = {
        success: true,
        recordCount: result?.total_count || 0,
        sampleRecords: result?.records?.slice(0, 2) || []
      };
      
      console.log(`✅ ${tableName} 查询成功: ${result?.total_count || 0} 条记录`);
    } catch (error) {
      results[tableName] = {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
      
      console.error(`❌ ${tableName} 查询失败:`, error);
    }
  }
  
  return results;
};

// 测试用户画像获取
export const testPersonaQuery = async () => {
  console.log('测试用户画像获取...');
  
  try {
    const persona = await getPersona();
    console.log('✅ 用户画像获取成功:', persona);
    return { success: true, data: persona };
  } catch (error) {
    console.error('❌ 用户画像获取失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
};

// 测试SQL查询功能
export const testSQLQuery = async () => {
  console.log('测试SQL查询功能...');
  
  try {
    const sql = `
      SELECT 'viewpoint' as table_name, COUNT(*) as count FROM viewpoint
      UNION ALL
      SELECT 'insight' as table_name, COUNT(*) as count FROM insight
      UNION ALL
      SELECT 'memory' as table_name, COUNT(*) as count FROM memory
    `;
    
    const result = await executeCustomSQL(sql, [], true);
    console.log('✅ SQL查询成功:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ SQL查询失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
};

// 测试表结构获取
export const testTableSchema = async () => {
  console.log('测试表结构获取...');
  
  try {
    const schema = await getTableSchema();
    console.log('✅ 表结构获取成功:', schema);
    return { success: true, data: schema };
  } catch (error) {
    console.error('❌ 表结构获取失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
};

// 测试记录保存功能（使用测试数据）
export const testRecordSave = async (tableName: string = 'memory') => {
  console.log(`测试 ${tableName} 表记录保存功能...`);
  
  if (!isValidTableName(tableName)) {
    console.error(`❌ 无效的表名: ${tableName}`);
    return { success: false, error: '无效的表名' };
  }
  
  try {
    const testRecord = {
      content: `测试记录 - ${new Date().toISOString()}`,
      keywords: ['测试', 'MCP', '新架构'],
      source_app: 'profile-docs-test'
    };
    
    // 根据表名添加特定字段
    if (tableName === 'memory') {
      Object.assign(testRecord, {
        memory_type: 'experience',
        importance: 5
      });
    } else if (tableName === 'goal') {
      Object.assign(testRecord, {
        type: 'short_term',
        status: 'planning'
      });
    } else if (tableName === 'focus') {
      Object.assign(testRecord, {
        priority: 5,
        status: 'active'
      });
    }
    
    const success = await saveRecord(tableName, testRecord);
    
    if (success) {
      console.log(`✅ ${tableName} 记录保存成功`);
      return { success: true, record: testRecord };
    } else {
      console.error(`❌ ${tableName} 记录保存失败`);
      return { success: false, error: '保存失败' };
    }
  } catch (error) {
    console.error(`❌ ${tableName} 记录保存出错:`, error);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
};

// 运行完整测试套件
export const runFullTest = async () => {
  console.log('🚀 开始运行完整的MCP新架构测试套件...');
  
  const testResults = {
    tableQueries: await testAllTableQueries(),
    personaQuery: await testPersonaQuery(),
    sqlQuery: await testSQLQuery(),
    tableSchema: await testTableSchema(),
    recordSave: await testRecordSave('memory')
  };
  
  console.log('📊 测试结果汇总:', testResults);
  
  // 统计成功率
  const allTests = [
    ...Object.values(testResults.tableQueries),
    testResults.personaQuery,
    testResults.sqlQuery,
    testResults.tableSchema,
    testResults.recordSave
  ];
  
  const successCount = allTests.filter(test => test.success).length;
  const totalCount = allTests.length;
  const successRate = (successCount / totalCount * 100).toFixed(1);
  
  console.log(`📈 测试成功率: ${successCount}/${totalCount} (${successRate}%)`);
  
  return {
    ...testResults,
    summary: {
      successCount,
      totalCount,
      successRate: parseFloat(successRate)
    }
  };
};

// 验证工具映射配置
export const validateToolMapping = () => {
  console.log('验证工具映射配置...');
  
  const issues: string[] = [];
  
  // 检查所有表名是否有效
  Object.keys(TABLE_TO_TOOL_MAP).forEach(tableName => {
    if (!isValidTableName(tableName)) {
      issues.push(`表名 ${tableName} 无效`);
    }
    
    const toolName = getToolName(tableName);
    if (!toolName) {
      issues.push(`表名 ${tableName} 没有对应的工具名`);
    }
    
    const description = getTableDescription(tableName);
    if (!description || description === '未知表格') {
      issues.push(`表名 ${tableName} 没有有效的描述`);
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ 工具映射配置验证通过');
    return { valid: true, issues: [] };
  } else {
    console.error('❌ 工具映射配置存在问题:', issues);
    return { valid: false, issues };
  }
}; 