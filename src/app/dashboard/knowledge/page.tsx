'use client'

import { knowledgeArticles } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { BookOpen, Clock, Filter, Search, User } from 'lucide-react'
import { useState } from 'react'

const categories = [
  { id: 'all', name: 'All', count: knowledgeArticles.length },
  { id: 'Knee', name: 'Knee', count: knowledgeArticles.filter(a => a.category === 'Knee').length },
  { id: 'Shoulder', name: 'Shoulder', count: knowledgeArticles.filter(a => a.category === 'Shoulder').length },
  { id: 'Spine', name: 'Spine', count: knowledgeArticles.filter(a => a.category === 'Spine').length },
  { id: 'Ankle', name: 'Ankle', count: knowledgeArticles.filter(a => a.category === 'Ankle').length },
  { id: 'Hip', name: 'Hip', count: knowledgeArticles.filter(a => a.category === 'Hip').length },
  { id: 'Wrist', name: 'Wrist', count: knowledgeArticles.filter(a => a.category === 'Wrist').length },
]

export default function KnowledgePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredArticles = knowledgeArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recovery Knowledge Base</h1>
        <p className="text-gray-600">Professional recovery knowledge to support your rehabilitation journey</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search recovery knowledge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* 分类筛选 */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              selectedCategory === category.id
                ? "bg-[#8573bd] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#EAE6F5] rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#8573bd]" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900">{knowledgeArticles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Expert Authors</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(knowledgeArticles.map(a => a.author)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#E8B98A]" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg. Reading Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(knowledgeArticles.reduce((sum, a) => sum + a.readTime, 0) / knowledgeArticles.length)} min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Knowledge Articles ({filteredArticles.length})
          </h2>
        </div>

        <div className="p-6">
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  {/* 文章缩略图 */}
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-[#8573bd]" />
                  </div>

                  <div className="p-4">
                    {/* 分类标签 */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-[#EAE6F5] text-[#8573bd] text-xs rounded-full">
                        {article.category}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {article.readTime} min
                      </div>
                    </div>

                    {/* 文章标题 */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {article.title}
                    </h3>

                    {/* 文章摘要 */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {article.summary}
                    </p>

                    {/* 文章信息 */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.author}</span>
                      <span>{formatDate(article.publishDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No related articles found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or selecting other categories</p>
            </div>
          )}
        </div>
      </div>

      {/* 加载更多 */}
      {filteredArticles.length > 0 && (
        <div className="text-center py-8">
          <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            Load More Articles
          </button>
        </div>
      )}
    </div>
  )
}
