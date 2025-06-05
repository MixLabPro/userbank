export interface MCPSettings {
  mcpUrl: string;
  mcpTool?: string;
}

export interface BaseRecord {
  id: number;
  content: string;
  keywords?: string[];
  source_app?: string;
  privacy_level?: 'public' | 'private';
  created_time: string;
  updated_time: string;
}

export interface ExtendedRecord extends BaseRecord {
  uniqueKey?: string;
  sourceTable?: string;
  sourceTableName?: string;
}

export interface Persona {
  id: number;
  name: string;
  gender?: string;
  personality?: string;
  avatar_url?: string;
  bio?: string;
  privacy_level?: 'public' | 'private';
  created_time: string;
  updated_time: string;
}

export interface Category {
  id: number;
  first_level: string;
  second_level: string;
  description?: string;
  is_active: boolean;
  privacy_level?: 'public' | 'private';
  created_time: string;
  updated_time: string;
}

export interface Relation {
  id: number;
  source_table: string;
  source_id: number;
  target_table: string;
  target_id: number;
  relation_type: string;
  strength?: 'strong' | 'medium' | 'weak';
  note?: string;
  privacy_level?: 'public' | 'private';
  created_time: string;
  updated_time: string;
}

export interface Viewpoint extends BaseRecord {
  source_people?: string;
  related_event?: string;
  reference_urls?: string[];
  category_id?: number;
}

export interface Insight extends BaseRecord {
  source_people?: string;
  reference_urls?: string[];
  category_id?: number;
}

export interface Focus extends BaseRecord {
  priority?: number;
  status?: 'active' | 'paused' | 'completed';
  context?: string;
  category_id?: number;
  deadline?: string;
}

export interface Goal extends BaseRecord {
  type?: string;
  deadline?: string;
  status?: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  category_id?: number;
}

export interface Preference extends BaseRecord {
  context?: string;
  category_id?: number;
}

export interface Methodology extends BaseRecord {
  type?: string;
  effectiveness?: 'experimental' | 'proven' | 'deprecated';
  use_cases?: string;
  reference_urls?: string[];
  category_id?: number;
}

export interface Prediction extends BaseRecord {
  timeframe?: string;
  basis?: string;
  verification_status?: 'pending' | 'verified' | 'failed';
  reference_urls?: string[];
  category_id?: number;
}

export interface Memory extends BaseRecord {
  memory_type?: string;
  importance?: number;
  related_people?: string;
  location?: string;
  memory_date?: string;
  reference_urls?: string[];
  category_id?: number;
}

export type ProfileRecord = Viewpoint | Insight | Focus | Goal | Preference | Methodology | Prediction | Memory;

export interface TableData {
  description: string;
  records: (ProfileRecord & ExtendedRecord)[];
  stats: {
    total_records: number;
  };
}

export interface ProfileData {
  persona?: Persona;
  viewpoint: TableData;
  insight: TableData;
  focus: TableData;
  goal: TableData;
  preference: TableData;
  methodology: TableData;
  prediction: TableData;
  memory: TableData;
  category?: Category[];
  relations?: Relation[];
}

export interface TableStats {
  table_name: string;
  description: string;
  total_records: number;
}

export interface SQLResult {
  success: boolean;
  message?: string;
  results?: any[];  // 保持向后兼容
  data?: any[];     // 新的数据字段
  affected_rows?: number;
  rowcount?: number;  // 新的行数字段
  lastrowid?: number;
  count?: number;
}

export interface FilterConditions {
  [key: string]: any;
}

export interface QueryParams {
  filter?: FilterConditions;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
} 