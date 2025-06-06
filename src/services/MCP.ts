import {
  prepareTools
} from 'mcp-uiux/dist/MCPClient.js'
import { MCPSettings, ProfileData, TableStats, ProfileRecord, Persona, SQLResult, QueryParams } from '../types'
import { 
  TABLE_TO_TOOL_MAP, 
  getToolName, 
  getTableDescription, 
  isValidTableName,
  buildQueryParams,
  buildSaveParams
} from '../utils/tableMapping'
import { getResourceDirAndConfig, getMCPUrl, ConfigData } from '../utils/configManager'

// 表名列表（用于替代TABLE_DESCRIPTIONS）
const TABLE_NAMES = Object.keys(TABLE_TO_TOOL_MAP)

// 缓存配置数据
let cachedConfigData: ConfigData | null = null

// 获取配置数据
const getConfigData = async (): Promise<ConfigData | null> => {
  if (!cachedConfigData) {
    const { configData } = await getResourceDirAndConfig()
    cachedConfigData = configData
  }
  return cachedConfigData
}

export const getDefaultMcpSettings = async (): Promise<MCPSettings> => {
  const configData = await getConfigData()
  const mcpUrl = getMCPUrl(configData)
  
  return {
    mcpUrl
  }
}

// MCP连接缓存
let mcpConnectionCache: { mcpClient: any, tools: any[] } | null = null
let connectionPromise: Promise<{ mcpClient: any, tools: any[] }> | null = null

// 获取或创建MCP连接
const getMCPConnection = async (url: string) => {
  // 如果已有缓存，直接返回
  if (mcpConnectionCache) {
    console.log('复用现有MCP连接')
    return mcpConnectionCache
  }
  
  // 如果正在创建连接，等待现有的连接创建完成
  if (connectionPromise) {
    console.log('等待现有连接创建完成...')
    return await connectionPromise
  }
  
  // 创建新连接
  console.log('创建新的MCP连接...')
  connectionPromise = (async () => {
    try {
      // @ts-expect-error - prepareTools type definition issue
      const { mcpClient, tools } = await prepareTools(url)
      mcpConnectionCache = { mcpClient, tools }
      return mcpConnectionCache
    } catch (error) {
      // 如果连接失败，清理状态
      connectionPromise = null
      throw error
    }
  })()
  
  const result = await connectionPromise
  connectionPromise = null // 连接创建完成，清理Promise
  return result
}

// 清理MCP连接
const clearMCPConnection = () => {
  if (mcpConnectionCache) {
    try {
      mcpConnectionCache.mcpClient.disconnect()
    } catch (e) {
      console.warn('断开MCP连接时出错:', e)
    }
    mcpConnectionCache = null
  }
  // 同时清理连接Promise
  connectionPromise = null
}

// 导出清理连接函数
export const clearMCPConnectionCache = clearMCPConnection

// 通用的MCP工具调用函数，支持连接复用
const callMCPTool = async (
  toolName: string,
  params: any = {},
  settings?: MCPSettings,
  timeout: number = 10000,
  reuseConnection: boolean = true
): Promise<any> => {
  const mcpSettings = settings || await getDefaultMcpSettings()
  const url = mcpSettings.mcpUrl

  try {
    console.log(`调用MCP工具: ${toolName}，参数:`, params)
    
    // 创建超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`工具调用超时: ${toolName}`)), timeout)
    })

    // 创建工具调用Promise
    const toolPromise = (async () => {
      let connection
      
      if (reuseConnection) {
        connection = await getMCPConnection(url)
      } else {
        connection = await prepareTools(url)
      }

      const { mcpClient, tools } = connection as any
      const tool = tools.find((t: any) => t.name === toolName)
      if (!tool) {
        throw new Error(`工具不存在: ${toolName}`)
      }

      const toolResult = await tool.execute(params)

      // 如果不复用连接，立即断开
      if (!reuseConnection) {
        setTimeout(() => {
          try {
            mcpClient.disconnect()
          } catch (e) {
            console.warn('断开MCP连接时出错:', e)
          }
        }, 500)
      }

      return toolResult
    })()

    // 使用Promise.race来实现超时
    const toolResult = await Promise.race([toolPromise, timeoutPromise])

    if (toolResult && toolResult[0] && toolResult[0].text) {
      try {
        const response = JSON.parse(toolResult[0].text)
        console.log(`工具 ${toolName} 响应:`, response)
        return response
      } catch (error) {
        console.error(`解析工具 ${toolName} 响应失败:`, error)
        throw new Error(`解析响应失败: ${error}`)
      }
    } else {
      throw new Error(`工具 ${toolName} 没有返回有效响应`)
    }
  } catch (error) {
    console.error(`调用工具 ${toolName} 失败:`, error)
    throw error
  }
}

// ============ 人物档案相关操作 ============

// 获取用户画像
export const getPersona = async (settings?: MCPSettings): Promise<Persona | null> => {
  try {
    const response = await callMCPTool('get_persona', {}, settings, 20000)
    return response.raw_data || null
  } catch (error) {
    console.error('获取用户画像失败:', error)
    return null
  }
}

// 保存用户画像
export const savePersona = async (persona: Partial<Persona>, settings?: MCPSettings): Promise<boolean> => {
  try {
    const response = await callMCPTool('save_persona', persona, settings, 20000)
    return response.operation === 'updated' || response.operation === 'created'
  } catch (error) {
    console.error('保存用户画像失败:', error)
    return false
  }
}

// ============ 统一的记录管理方法 ============

// 查询记录（通用方法）
export const queryRecords = async (
  tableName: string,
  params?: QueryParams,
  settings?: MCPSettings
): Promise<{ records: ProfileRecord[], total_count: number } | null> => {
  try {
    if (!isValidTableName(tableName)) {
      throw new Error(`不支持的表名: ${tableName}`)
    }
    
    const toolName = getToolName(tableName)!
    const queryParams = buildQueryParams(
      params?.filter,
      params?.sort_by,
      params?.sort_order,
      params?.limit,
      params?.offset
    )
    
    const response = await callMCPTool(toolName, queryParams, settings, 30000)
    
    if (response.raw_data) {
      return {
        records: response.raw_data,
        total_count: response.total_count || response.raw_data.length
      }
    }
    return { records: [], total_count: 0 }
  } catch (error) {
    console.error(`查询${tableName}记录失败:`, error)
    return null
  }
}

// 保存记录（通用方法）
export const saveRecord = async (
  tableName: string,
  record: Partial<ProfileRecord>,
  settings?: MCPSettings
): Promise<boolean> => {
  try {
    if (!isValidTableName(tableName)) {
      throw new Error(`不支持的表名: ${tableName}`)
    }
    
    const toolName = getToolName(tableName)!
    const saveParams = buildSaveParams(record)
    
    const response = await callMCPTool(toolName, saveParams, settings, 20000)
    return response.operation === 'updated' || response.operation === 'created'
  } catch (error) {
    console.error(`保存${tableName}记录失败:`, error)
    return false
  }
}

// 获取所有表格内容 - 并行版本
export const getAllTableContents = async (settings?: MCPSettings): Promise<ProfileData | null> => {
  try {
    console.log('开始获取所有表格内容...')
    
    // 使用映射中定义的表名
    const tableNames = Object.keys(TABLE_TO_TOOL_MAP)
    
    // 初始化数据结构 - 需要翻译函数，这里使用空字符串作为占位符
    const profileData: ProfileData = {
      persona: undefined,
      viewpoint: { description: '', records: [], stats: { total_records: 0 } },
      insight: { description: '', records: [], stats: { total_records: 0 } },
      focus: { description: '', records: [], stats: { total_records: 0 } },
      goal: { description: '', records: [], stats: { total_records: 0 } },
      preference: { description: '', records: [], stats: { total_records: 0 } },
      methodology: { description: '', records: [], stats: { total_records: 0 } },
      prediction: { description: '', records: [], stats: { total_records: 0 } },
      memory: { description: '', records: [], stats: { total_records: 0 } }
    }
    
    try {
      // 先获取用户画像
      console.log('获取用户画像...')
      const personaResult = await getPersona(settings)
      profileData.persona = personaResult as Persona
      console.log('用户画像获取完成:', personaResult ? '成功' : '失败')
      
      // 分批并行获取表数据，每批4个表
      const batchSize = 4
      const batches = []
      for (let i = 0; i < tableNames.length; i += batchSize) {
        batches.push(tableNames.slice(i, i + batchSize))
      }
      
      console.log(`将分 ${batches.length} 批获取表数据，每批 ${batchSize} 个表`)
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        console.log(`开始获取第 ${batchIndex + 1} 批数据:`, batch)
        
        const batchResults = await Promise.allSettled(
          batch.map(tableName => 
            queryRecords(tableName, { limit: 100 }, settings)
              .then(result => ({ tableName, result }))
              .catch(error => ({ tableName, error }))
          )
        )
        
        // 处理当前批次的结果
        batchResults.forEach((batchResult, index) => {
          const tableName = batch[index]
          if (batchResult.status === 'fulfilled') {
            const { result, error } = batchResult.value as any
            
            if (error) {
              console.error(`获取 ${tableName} 表数据失败:`, error)
            } else if (result && profileData[tableName as keyof ProfileData]) {
              const tableData = profileData[tableName as keyof ProfileData] as any
              if (tableData && typeof tableData === 'object' && 'records' in tableData) {
                tableData.records = result.records
                tableData.stats.total_records = result.total_count
                console.log(`${tableName} 表数据获取成功: ${result.total_count} 条记录`)
              }
            } else {
              console.warn(`${tableName} 表数据获取失败或为空`)
            }
          } else {
            console.error(`获取 ${tableName} 表数据失败:`, batchResult.reason)
          }
        })
        
        // 批次间短暂延迟
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
    } finally {
      // 清理MCP连接
      clearMCPConnection()
      console.log('MCP连接已清理')
    }
    
    console.log('所有表格内容获取完成')
    return profileData
  } catch (error) {
    console.error('获取所有表格内容失败:', error)
    // 确保在出错时也清理连接
    clearMCPConnection()
    return null
  }
}

// 获取表格统计信息
export const getTableStats = async (settings?: MCPSettings): Promise<TableStats[] | null> => {
  const mcpSettings = settings || await getDefaultMcpSettings()
  
  try {
    const profileData = await getAllTableContents(mcpSettings)
    if (!profileData) return null
    
    const stats: TableStats[] = []
    
    TABLE_NAMES.forEach((tableName) => {
      const tableData = profileData[tableName as keyof ProfileData] as any
      if (tableData && typeof tableData === 'object' && 'stats' in tableData) {
        stats.push({
          table_name: tableName,
          description: tableName, // 使用表名作为描述
          total_records: tableData.stats.total_records
        })
      }
    })
    
    return stats
  } catch (error) {
    console.error('获取统计信息失败:', error)
    return null
  }
}

// 搜索记录
export const searchRecords = async (
  tableName: string, 
  keyword?: string, 
  relatedTopic?: string,
  limit: number = 20,
  offset: number = 0,
  settings?: MCPSettings
): Promise<ProfileRecord[] | null> => {
  const filter: any = {}
  
  if (keyword) {
    filter.content_contains = keyword
  }
  
  if (relatedTopic) {
    filter.keywords_contain_any = [relatedTopic]
  }
  
  const params: QueryParams = {
    filter,
    limit,
    offset
  }
  
  const result = await queryRecords(tableName, params, settings)
  return result ? result.records : null
}

// 添加记录
export const addRecord = async (
  tableName: string,
  content: string,
  related?: string[],
  settings?: MCPSettings
): Promise<boolean> => {
  const record: Partial<ProfileRecord> = {
    content,
    keywords: related
  }
  
  return await saveRecord(tableName, record, settings)
}

// 更新记录
export const updateRecord = async (
  tableName: string,
  recordId: number,
  content?: string,
  related?: string[],
  settings?: MCPSettings
): Promise<boolean> => {
  const record: Partial<ProfileRecord> = {
    id: recordId
  }
  
  if (content) record.content = content
  if (related) record.keywords = related
  
  return await saveRecord(tableName, record, settings)
}

// 删除记录
export const deleteRecord = async (
  tableName: string,
  recordId: number,
  settings?: MCPSettings
): Promise<boolean> => {
  try {
    // 通过SQL删除记录
    const sql = `DELETE FROM ${tableName} WHERE id = ?`
    const result = await executeCustomSQL(sql, [recordId.toString()], false, settings)
    
    return result?.success || false
  } catch (error) {
    console.error('删除记录失败:', error)
    return false
  }
}

// 执行自定义SQL查询
export const executeCustomSQL = async (
  sql: string,
  params?: string[],
  fetchResults: boolean = true,
  settings?: MCPSettings
): Promise<SQLResult | null> => {
  try {
    const executeParams: any = {
      sql,
      fetch_results: fetchResults
    }
    
    if (params && params.length > 0) {
      executeParams.params = params
    }
    
    const result = await callMCPTool('execute_custom_sql', executeParams, settings)
    console.log('SQL查询结果:', result)
    return result
  } catch (error) {
    console.error('执行SQL查询失败:', error)
    return null
  }
}

// 获取表结构
export const getTableSchema = async (
  tableName?: string,
  settings?: MCPSettings
): Promise<any> => {
  try {
    const params = tableName ? { table_name: tableName } : {}
    const result = await callMCPTool('get_table_schema', params, settings)
    console.log('表结构信息:', result)
    return result
  } catch (error) {
    console.error('获取表结构失败:', error)
    return null
  }
} 