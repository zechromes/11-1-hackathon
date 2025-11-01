import { analyzePatientRisk, generateCareEmail } from '@/lib/ai'
import { extractSubject, formatEmailAsHTML, sendCareEmail } from '@/lib/email'
import { mockPatientRiskData } from '@/lib/mockData'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron job endpoint for automated patient care analysis
 * This endpoint will be called by Vercel Cron Jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🤖 Starting automated patient care analysis...')
    const startTime = Date.now()

    const results = []
    let emailsSent = 0
    let highRiskCount = 0

    // Analyze each patient
    for (const patientData of mockPatientRiskData) {
      try {
        console.log(`🔍 Analyzing patient: ${patientData.patientName}`)

        // Step 1: AI Risk Analysis
        const riskAnalysis = await analyzePatientRisk(patientData)

        console.log(`📊 ${patientData.patientName}: Risk Score ${riskAnalysis.riskScore}/10`)

        let emailSent = false
        let emailContent = ''

        // Step 2: Send care email if high risk
        if (riskAnalysis.riskScore >= 7) {
          highRiskCount++
          console.log(`🚨 High risk detected for ${patientData.patientName}`)

          try {
            // Generate personalized care email
            emailContent = await generateCareEmail(patientData, riskAnalysis)

            // Format and send email
            const subject = extractSubject(emailContent)
            const htmlContent = formatEmailAsHTML(emailContent)

            emailSent = await sendCareEmail({
              to: patientData.email,
              subject,
              html: htmlContent
            })

            if (emailSent) {
              emailsSent++
              console.log(`✅ Care email sent to ${patientData.patientName}`)
            } else {
              console.log(`❌ Failed to send email to ${patientData.patientName}`)
            }
          } catch (emailError) {
            console.error(`Error sending email to ${patientData.patientName}:`, emailError)
          }
        }

        results.push({
          patientId: patientData.patientId,
          patientName: patientData.patientName,
          riskScore: riskAnalysis.riskScore,
          reasoning: riskAnalysis.reasoning,
          emailSent,
          timestamp: new Date().toISOString()
        })

      } catch (patientError) {
        console.error(`Error analyzing patient ${patientData.patientName}:`, patientError)
        results.push({
          patientId: patientData.patientId,
          patientName: patientData.patientName,
          riskScore: 0,
          reasoning: 'Analysis failed',
          emailSent: false,
          error: patientError instanceof Error ? patientError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // Log summary
    console.log('📈 Patient Care Analysis Summary:')
    console.log(`   • Patients analyzed: ${results.length}`)
    console.log(`   • High-risk patients: ${highRiskCount}`)
    console.log(`   • Care emails sent: ${emailsSent}`)
    console.log(`   • Duration: ${duration}ms`)

    // Return results
    return NextResponse.json({
      success: true,
      summary: {
        patientsAnalyzed: results.length,
        highRiskPatients: highRiskCount,
        emailsSent,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      results: results.sort((a, b) => b.riskScore - a.riskScore) // Sort by risk score
    })

  } catch (error) {
    console.error('❌ Cron job failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Cron job execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Manual trigger endpoint (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json()

    // Simple secret check for manual testing
    if (secret !== 'test-manual-trigger') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    console.log('🧪 Manual patient care analysis triggered...')

    // Call the same logic as GET
    const mockRequest = new NextRequest(`${process.env.NEXT_PUBLIC_APP_URL || 'https://healing-together-ruddy.vercel.app'}/api/cron/patient-care`, {
      headers: {
        'authorization': `Bearer ${process.env.CRON_SECRET || 'demo-secret'}`
      }
    })

    return await GET(mockRequest)

  } catch (error) {
    console.error('Manual trigger failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Manual trigger failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
