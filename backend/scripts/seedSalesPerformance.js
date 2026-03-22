/**
 * Seed sales performance reviews - run via API endpoint
 * POST /api/performance-reviews/seed-sales-performance
 */
export async function seedSalesPerformance(companyId, reviewerId) {
  const mongoose = (await import('mongoose')).default

  // Import models
  let PerformanceReview
  try {
    PerformanceReview = (await import('../models/PerformanceReview.js')).default
  } catch(e) {
    // Try alternate path
    const mod = await import('../models/PerformanceReview.js')
    PerformanceReview = mod.default || mod
  }

  const cycleId = '69c02c27022ab2389adfcf85'

  const smKRAs = [
    { kra: '69846dbfad7dde32caacc63a', name: 'Revenue Achievement', weight: 30 },
    { kra: '69846dbfad7dde32caacc640', name: 'Conversion Efficiency', weight: 25 },
    { kra: '69846dbfad7dde32caacc645', name: 'Funnel & Follow-up Discipline', weight: 15 },
    { kra: '69846dbfad7dde32caacc64b', name: 'SOP & Process Compliance', weight: 10 },
    { kra: '69846dbfad7dde32caacc651', name: 'Ownership & Team Support', weight: 10 },
    { kra: '69846dbfad7dde32caacc657', name: 'Professional Conduct', weight: 10 },
  ]

  const pseKRAs = [
    { kra: '69846dbead7dde32caacc61d', name: 'Calling Productivity', weight: 30 },
    { kra: '69846dbead7dde32caacc622', name: 'Quality Pipeline Creation', weight: 25 },
    { kra: '69846dbfad7dde32caacc627', name: 'Lead Quality & Conversion', weight: 20 },
    { kra: '69846dbfad7dde32caacc62d', name: 'SOP & Process Compliance', weight: 15 },
    { kra: '69846dbfad7dde32caacc634', name: 'Professional Behaviour', weight: 10 },
  ]

  const reviews = [
    { emp: '69a1762356fec580d9610cef', name: 'Karthik M', role: 'sales_manager', kras: smKRAs,
      targets: { revenue: 5000000, conversionRate: 25, funnelScore: 80, sopScore: 90, teamScore: 85, conductScore: 90 },
      actuals: { revenue: 4200000, conversionRate: 22, funnelScore: 75, sopScore: 85, teamScore: 80, conductScore: 95 },
      ratings: [3.5, 3.5, 3, 4, 3.5, 4.5], incentive: 35000 },
    { emp: '69a1763256fec580d9610d9d', name: 'Bhargav G A', role: 'sales_manager', kras: smKRAs,
      targets: { revenue: 3000000, conversionRate: 20, funnelScore: 75, sopScore: 85, teamScore: 80, conductScore: 90 },
      actuals: { revenue: 3500000, conversionRate: 28, funnelScore: 85, sopScore: 90, teamScore: 90, conductScore: 95 },
      ratings: [4.5, 4.5, 4.5, 4.5, 4.5, 4.5], incentive: 55000 },
    { emp: '69a1762b56fec580d9610d49', name: 'Edison A L', role: 'sales_executive', kras: smKRAs,
      targets: { revenue: 2000000, conversionRate: 18, funnelScore: 70, sopScore: 85, teamScore: 75, conductScore: 90 },
      actuals: { revenue: 2400000, conversionRate: 24, funnelScore: 82, sopScore: 90, teamScore: 85, conductScore: 92 },
      ratings: [4.5, 4.5, 4.5, 4.5, 4, 4.5], incentive: 42000 },
    { emp: '69a1763b56fec580d9610e03', name: 'Deepa', role: 'sales_executive', kras: smKRAs,
      targets: { revenue: 1500000, conversionRate: 15, funnelScore: 65, sopScore: 80, teamScore: 70, conductScore: 85 },
      actuals: { revenue: 1800000, conversionRate: 20, funnelScore: 78, sopScore: 88, teamScore: 82, conductScore: 90 },
      ratings: [4.5, 4, 4, 4, 4, 4.5], incentive: 38000 },
    { emp: '69a1763656fec580d9610dc7', name: 'Mohith Kumar Shukla', role: 'sales_executive', kras: smKRAs,
      targets: { revenue: 1800000, conversionRate: 16, funnelScore: 68, sopScore: 82, teamScore: 72, conductScore: 88 },
      actuals: { revenue: 1200000, conversionRate: 12, funnelScore: 55, sopScore: 75, teamScore: 65, conductScore: 82 },
      ratings: [2.5, 2.5, 2.5, 3, 2.5, 3], incentive: 0 },
    { emp: '69a1761d56fec580d9610cab', name: 'Bindu P S', role: 'sales_executive', kras: smKRAs,
      targets: { revenue: 1600000, conversionRate: 17, funnelScore: 70, sopScore: 84, teamScore: 74, conductScore: 88 },
      actuals: { revenue: 1750000, conversionRate: 19, funnelScore: 72, sopScore: 86, teamScore: 78, conductScore: 90 },
      ratings: [4, 3.5, 3.5, 3.5, 3.5, 4], incentive: 28000 },
    { emp: '69a1763056fec580d9610d85', name: 'Nancy N', role: 'pre_sales', kras: pseKRAs,
      targets: { totalCalls: 1500, pipelineLeads: 80, qualifiedLeads: 35, sopScore: 85, behaviourScore: 90 },
      actuals: { totalCalls: 1680, pipelineLeads: 92, qualifiedLeads: 42, sopScore: 90, behaviourScore: 95 },
      ratings: [4.5, 4.5, 4.5, 4.5, 4.5], incentive: 18000 },
    { emp: '69a1763756fec580d9610dd9', name: 'Geetanjali', role: 'pre_sales', kras: pseKRAs,
      targets: { totalCalls: 1500, pipelineLeads: 80, qualifiedLeads: 35, sopScore: 85, behaviourScore: 90 },
      actuals: { totalCalls: 1320, pipelineLeads: 68, qualifiedLeads: 28, sopScore: 80, behaviourScore: 85 },
      ratings: [3, 3, 3, 3, 3.5], incentive: 8000 },
    { emp: '69a1763a56fec580d9610dfd', name: 'Fawaz Ahmed A', role: 'pre_sales', kras: pseKRAs,
      targets: { totalCalls: 1500, pipelineLeads: 75, qualifiedLeads: 30, sopScore: 85, behaviourScore: 90 },
      actuals: { totalCalls: 1850, pipelineLeads: 95, qualifiedLeads: 45, sopScore: 92, behaviourScore: 95 },
      ratings: [5, 5, 5, 4.5, 4.5], incentive: 22000 },
    { emp: '69a1763b56fec580d9610e09', name: 'Pavitra Arage', role: 'pre_sales', kras: pseKRAs,
      targets: { totalCalls: 1500, pipelineLeads: 78, qualifiedLeads: 32, sopScore: 85, behaviourScore: 90 },
      actuals: { totalCalls: 1100, pipelineLeads: 55, qualifiedLeads: 20, sopScore: 72, behaviourScore: 80 },
      ratings: [2.5, 2, 2, 3, 3], incentive: 0 },
    { emp: '69a1764856fec580d9610ea5', name: 'Divya A', role: 'pre_sales', kras: pseKRAs,
      targets: { totalCalls: 1200, pipelineLeads: 70, qualifiedLeads: 28, sopScore: 80, behaviourScore: 85 },
      actuals: { totalCalls: 1350, pipelineLeads: 78, qualifiedLeads: 35, sopScore: 85, behaviourScore: 90 },
      ratings: [4, 4, 4, 4, 4], incentive: 15000 },
  ]

  const results = []

  for (const r of reviews) {
    const kraRatings = r.kras.map((k, i) => ({
      kra: new mongoose.Types.ObjectId(k.kra),
      kraName: k.name,
      weight: k.weight,
      selfRating: Math.min(5, r.ratings[i] + (Math.random() > 0.5 ? 0.5 : 0)),
      managerRating: r.ratings[i],
      selfComments: 'Self assessment completed for Q4 FY2025-26 targets.',
      managerComments: r.ratings[i] >= 4 ? 'Excellent performance. Exceeded targets consistently.' : r.ratings[i] >= 3 ? 'Good performance. Met most quarterly targets.' : 'Below expectations. Improvement plan needed for next quarter.'
    }))

    const weightedScore = kraRatings.reduce((s, k) => s + (k.managerRating * k.weight / 100), 0)
    const achievementPct = r.role === 'pre_sales'
      ? Math.round((r.actuals.totalCalls / r.targets.totalCalls) * 100)
      : Math.round((r.actuals.revenue / r.targets.revenue) * 100)

    try {
      const review = await PerformanceReview.create({
        company: new mongoose.Types.ObjectId(companyId),
        reviewCycle: new mongoose.Types.ObjectId(cycleId),
        employee: new mongoose.Types.ObjectId(r.emp),
        reviewer: new mongoose.Types.ObjectId(reviewerId),
        period: { startDate: new Date('2026-01-01'), endDate: new Date('2026-03-31') },
        status: 'completed',
        kraRatings,
        overallRating: Math.round(weightedScore * 10) / 10,
        overallComments: weightedScore >= 4
          ? `Outstanding Q4 performance. ${achievementPct}% target achievement. Full incentive of ₹${r.incentive.toLocaleString('en-IN')} approved.`
          : weightedScore >= 3
          ? `Good Q4 performance. ${achievementPct}% target achievement. Proportional incentive of ₹${r.incentive.toLocaleString('en-IN')} approved.`
          : `Below target for Q4. ${achievementPct}% achievement only. Performance improvement plan initiated. No incentive this quarter.`,
        selfReviewDate: new Date('2026-04-02'),
        managerReviewDate: new Date('2026-04-08'),
        completedAt: new Date('2026-04-10'),
        targetData: {
          role: r.role,
          targets: r.targets,
          actuals: r.actuals,
          achievementPercent: achievementPct,
          incentiveEligible: weightedScore >= 3,
          incentiveAmount: r.incentive,
          incentiveStatus: r.incentive > 0 ? 'approved' : 'not_eligible'
        }
      })

      results.push({
        name: r.name,
        role: r.role,
        score: weightedScore.toFixed(1),
        achievement: achievementPct + '%',
        incentive: r.incentive,
        id: review._id
      })
    } catch (e) {
      results.push({ name: r.name, error: e.message })
    }
  }

  return results
}
