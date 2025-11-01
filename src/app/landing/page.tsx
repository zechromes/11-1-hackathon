'use client'

import { ArrowRight, BookOpen, Brain, Calendar, Heart, Mail, MessageCircle, Shield, TrendingUp, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function LandingPage() {
  // Update page title
  useEffect(() => {
    document.title = 'Recovery Companion - AI-Powered Rehabilitation Platform'
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAE6F5] via-white to-orange-50">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#8573bd] rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Recovery Companion</span>
          </div>
          <Link
            href="/login"
            className="px-6 py-2 bg-[#8573bd] text-white rounded-lg hover:bg-[#E8B98A] transition-colors font-medium"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your AI-Powered
            <span className="text-[#8573bd] block">Recovery Journey</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience the future of rehabilitation with intelligent patient care,
            proactive support, and a thriving community that never lets you recover alone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-[#8573bd] text-white rounded-xl hover:bg-[#E8B98A] transition-colors font-semibold text-lg shadow-lg"
            >
              Start Your Recovery
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <button className="inline-flex items-center px-8 py-4 border-2 border-[#8573bd] text-[#8573bd] rounded-xl hover:bg-[#8573bd] hover:text-white transition-colors font-semibold text-lg">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Healthcare Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Combining artificial intelligence, community support, and personalized care
              to transform your recovery experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* AI Analysis Feature */}
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-[#EAE6F5] text-[#8573bd] rounded-full font-medium">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Analysis
              </div>
              <h3 className="text-3xl font-bold text-gray-900">
                Intelligent Patient Risk Detection
              </h3>
              <p className="text-lg text-gray-600">
                Our advanced AI continuously monitors patient engagement, progress, and sentiment
                to identify those at risk of dropping out before it happens.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <TrendingUp className="w-5 h-5 text-[#8573bd] mr-3" />
                  Real-time engagement tracking
                </li>
                <li className="flex items-center text-gray-700">
                  <Brain className="w-5 h-5 text-[#8573bd] mr-3" />
                  Sentiment analysis of community posts
                </li>
                <li className="flex items-center text-gray-700">
                  <Zap className="w-5 h-5 text-[#8573bd] mr-3" />
                  Predictive risk scoring (1-10 scale)
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-[#8573bd] to-[#E8B98A] rounded-2xl p-8 text-white">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">Patient Risk Analysis</span>
                  <Brain className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Sarah Chen</span>
                      <span className="bg-red-500 text-xs px-2 py-1 rounded">Risk: 8/10</span>
                    </div>
                    <p className="text-xs opacity-90">Low compliance, negative sentiment detected</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Mike Johnson</span>
                      <span className="bg-green-500 text-xs px-2 py-1 rounded">Risk: 2/10</span>
                    </div>
                    <p className="text-xs opacity-90">Excellent progress, high engagement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proactive Care Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-[#EAE6F5] to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-[#8573bd]" />
                  <span className="font-semibold text-gray-900">Automated Care Email</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Subject:</strong> A gentle reminder from your Recovery Community 💙
                  </p>
                  <p className="text-sm text-gray-600">
                    Hi Sarah, we noticed you might be feeling discouraged about your shoulder recovery.
                    Remember, you're not alone in this journey. Our community has many friends
                    going through similar experiences...
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Link
                      href="#"
                      className="text-[#8573bd] text-sm hover:underline"
                    >
                      Visit Community → healing-together-ruddy.vercel.app
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-[#E8B98A] rounded-full font-medium">
                <Heart className="w-4 h-4 mr-2" />
                Proactive Care
              </div>
              <h3 className="text-3xl font-bold text-gray-900">
                Never Let Anyone Fall Behind
              </h3>
              <p className="text-lg text-gray-600">
                When our AI detects a patient at risk, it automatically generates personalized,
                caring emails to re-engage them and provide the support they need.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 text-[#E8B98A] mr-3" />
                  Personalized care emails
                </li>
                <li className="flex items-center text-gray-700">
                  <Zap className="w-5 h-5 text-[#E8B98A] mr-3" />
                  Automated daily monitoring
                </li>
                <li className="flex items-center text-gray-700">
                  <Heart className="w-5 h-5 text-[#E8B98A] mr-3" />
                  Warm, encouraging tone
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-medium">
                <Users className="w-4 h-4 mr-2" />
                Thriving Community
              </div>
              <h3 className="text-3xl font-bold text-gray-900">
                Recovery Together, Never Alone
              </h3>
              <p className="text-lg text-gray-600">
                Connect with fellow patients, share experiences, celebrate milestones,
                and find motivation in a supportive community that understands your journey.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <MessageCircle className="w-5 h-5 text-blue-600 mr-3" />
                  Real-time community discussions
                </li>
                <li className="flex items-center text-gray-700">
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  Connect with recovery partners
                </li>
                <li className="flex items-center text-gray-700">
                  <BookOpen className="w-5 h-5 text-blue-600 mr-3" />
                  Access expert knowledge base
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <Users className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Active Members</h4>
                <p className="text-2xl font-bold text-blue-600">2,847</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <MessageCircle className="w-8 h-8 text-green-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Daily Posts</h4>
                <p className="text-2xl font-bold text-green-600">156</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <Heart className="w-8 h-8 text-purple-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Success Stories</h4>
                <p className="text-2xl font-bold text-purple-600">1,203</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                <BookOpen className="w-8 h-8 text-orange-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Knowledge Articles</h4>
                <p className="text-2xl font-bold text-orange-600">89</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Recovery Ecosystem
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for a successful recovery journey, all in one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Calendar className="w-12 h-12 text-[#8573bd] mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Scheduling</h3>
              <p className="text-gray-600">
                Intelligent appointment management with automated reminders and progress tracking.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <TrendingUp className="w-12 h-12 text-[#E8B98A] mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Progress Analytics</h3>
              <p className="text-gray-600">
                Detailed insights into your recovery progress with visual charts and milestones.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Shield className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">HIPAA Compliant</h3>
              <p className="text-gray-600">
                Enterprise-grade security ensuring your health data is always protected and private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-[#8573bd] to-[#E8B98A]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Recovery?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of patients who are experiencing the future of rehabilitation care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-white text-[#8573bd] rounded-xl hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg"
            >
              Get Started Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/login?demo=true"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-[#8573bd] transition-colors font-semibold text-lg"
            >
              Try Demo Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-[#8573bd] rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Recovery Companion</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 Recovery Companion. Transforming healthcare with AI and community.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
