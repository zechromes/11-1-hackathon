import { analyzePatientRisk, generateCareEmail } from '@/lib/ai'
import { extractSubject, formatEmailAsHTML, sendCareEmail } from '@/lib/email'
import { mockPatientRiskData } from '@/lib/mockData'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { patientIds } = await request.json()

    // If no specific patients provided, analyze all patients
    const patientsToAnalyze = patientIds
      ? mockPatientRiskData.filter(p => patientIds.includes(p.patientId))
      : mockPatientRiskData

    const results = []

    for (const patientData of patientsToAnalyze) {
      console.log(`🔍 Analyzing patient: ${patientData.patientName}`)

      // Step 1: Analyze patient risk using AI
      const riskAnalysis = await analyzePatientRisk(patientData)

      console.log(`📊 Risk score for ${patientData.patientName}: ${riskAnalysis.riskScore}/10`)

      let emailSent = false
      let emailContent = ''

      // Step 2: If risk score is high (>= 7), generate and send care email
      if (riskAnalysis.riskScore >= 7) {
        console.log(`🚨 High risk detected for ${patientData.patientName}, generating care email...`)

        // Generate personalized email using AI
        emailContent = await generateCareEmail(patientData, riskAnalysis)

        // Extract subject and format email
        const subject = extractSubject(emailContent)
        const htmlContent = formatEmailAsHTML(emailContent)

        // Send email
        emailSent = await sendCareEmail({
          to: patientData.email,
          subject,
          html: htmlContent
        })

        if (emailSent) {
          console.log(`✅ Care email sent to ${patientData.patientName}`)
        } else {
          console.log(`❌ Failed to send email to ${patientData.patientName}`)
        }
      }

      results.push({
        patientId: patientData.patientId,
        patientName: patientData.patientName,
        email: patientData.email,
        riskScore: riskAnalysis.riskScore,
        reasoning: riskAnalysis.reasoning,
        recommendations: riskAnalysis.recommendations,
        emailSent,
        emailContent: emailSent ? emailContent : null,
        timestamp: new Date().toISOString()
      })
    }

    // Sort by risk score (highest first)
    results.sort((a, b) => b.riskScore - a.riskScore)

    return NextResponse.json({
      success: true,
      analyzed: results.length,
      highRiskPatients: results.filter(r => r.riskScore >= 7).length,
      emailsSent: results.filter(r => r.emailSent).length,
      results
    })

  } catch (error) {
    console.error('Error in patient analysis:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze patients',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return current patient data for preview
  return NextResponse.json({
    success: true,
    patients: mockPatientRiskData.map(p => ({
      id: p.patientId,
      name: p.patientName,
      email: p.email,
      injury: p.injury,
      weeksInTherapy: p.weeksInTherapy,
      lastActivity: p.data.lastCommunityPost,
      compliance: p.data.hepComplianceLastWeek
    }))
  })
}
