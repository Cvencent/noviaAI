export interface MCPCharacterTools {
  // 基础搜索工具
  search_character_by_name: {
    description: '根据姓名搜索人物'
    arguments: { name: string }
    returns: '匹配的人物列表及关系'
  }
  
  search_character_by_role: {
    description: '按角色类型搜索'
    arguments: { role: 'protagonist' | 'antagonist' | 'mentor' | ... }
    returns: '该角色的所有人物'
  }
  
  search_character_by_relationship: {
    description: '搜索特定关系'
    arguments: { 
      relationshipType: '父亲' | '朋友' | '敌人' | ...,
      direction?: 'from' | 'to' | 'both'
    }
    returns: '所有相关人物和关系'
  }
  
  search_character_by_property: {
    description: '按属性搜索'
    arguments: { 
      field: 'personality' | 'background' | ...,
      value: string 
    }
    returns: '属性匹配的人物'
  }
  
  // 关系路径查询
  find_relationship_path: {
    description: '查找两人间的关系路径'
    arguments: { 
      startName: string,
      endName: string,
      maxDepth?: 3
    }
    returns: '关系链（如：张三→王五→李四）'
  }
  
  // 上下文获取
  get_character_context: {
    description: '获取人物详细信息'
    arguments: { characterName: string }
    returns: '人物档案+直接关系+间接关系'
  }
  
  get_characters_involved: {
    description: '分析文本中的人物'
    arguments: { text: string }
    returns: '涉及人物列表+隐含关系'
  }
  
  build_relationship_context: {
    description: '构建精简上下文'
    arguments: { characterNames: string[] }
    returns: 'Markdown 格式的人物关系'
  }
}
