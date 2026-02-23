import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Department from '../models/Department.js'
import Company from '../models/Company.js'

dotenv.config()

/**
 * Script to seed all departments with codes and descriptions
 * Usage: node scripts/seedDepartments.js
 */

const departments = [
  {
    name: 'Operations',
    code: 'OPS',
    description: 'Manages day-to-day business operations, project execution, site coordination, and ensures smooth workflow across all departments.'
  },
  {
    name: 'Procurement',
    code: 'PRO',
    description: 'Handles purchasing of materials, vendor management, purchase orders, quotations, and supply chain coordination.'
  },
  {
    name: 'HR',
    code: 'HRM',
    description: 'Human Resources department responsible for recruitment, employee management, payroll, attendance, leaves, and organizational development.'
  },
  {
    name: 'Admin',
    code: 'ADM',
    description: 'Administrative department handling office management, facilities, documentation, and general administrative support.'
  },
  {
    name: 'Finance',
    code: 'FIN',
    description: 'Manages financial operations including accounting, budgeting, invoicing, payments, and financial reporting.'
  },
  {
    name: 'Marketing',
    code: 'MKT',
    description: 'Responsible for brand promotion, digital marketing, advertising campaigns, social media management, and market research.'
  },
  {
    name: 'Information Technology',
    code: 'ITS',
    description: 'IT department managing software systems, technical infrastructure, cybersecurity, and technology support services.'
  },
  {
    name: 'Sales',
    code: 'SLS',
    description: 'Handles customer acquisition, sales pipeline management, deal closures, and revenue generation activities.'
  },
  {
    name: 'Design',
    code: 'DSN',
    description: 'Creative department responsible for interior design concepts, 3D renders, material selection, and design documentation.'
  },
  {
    name: 'Project Execution',
    code: 'PME',
    description: 'Manages on-ground project implementation, site supervision, contractor coordination, and project delivery timelines.'
  },
  {
    name: 'Quality Control',
    code: 'QCA',
    description: 'Ensures quality standards across all projects, conducts inspections, manages quality audits, and maintains compliance.'
  },
  {
    name: 'Planning',
    code: 'PLN',
    description: 'Strategic planning department handling project planning, resource allocation, scheduling, and timeline management.'
  },
  {
    name: 'Presales',
    code: 'PSL',
    description: 'Pre-sales team handling initial client interactions, requirement gathering, site visits, and proposal preparation.'
  },
  {
    name: 'House Keeping',
    code: 'HKP',
    description: 'Maintains cleanliness and hygiene of office premises, manages housekeeping staff, and ensures facility upkeep.'
  },
  {
    name: 'Channel Sales',
    code: 'CSP',
    description: 'Manages partner channels, dealer networks, referral programs, and indirect sales channels for business expansion.'
  },
  {
    name: 'Business Intelligence',
    code: 'BUI',
    description: 'Data analytics and insights team providing business intelligence, reports, dashboards, and data-driven recommendations.'
  },
  {
    name: 'Business Development',
    code: 'BDT',
    description: 'Focuses on new business opportunities, market expansion, strategic partnerships, and growth initiatives.'
  }
]

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get the company (assuming there's at least one)
    const company = await Company.findOne({ isActive: true })
    if (!company) {
      console.log('No active company found. Please create a company first.')
      process.exit(1)
    }

    console.log(`Using company: ${company.name} (${company.code})`)
    console.log('\nSeeding departments...\n')

    let created = 0
    let updated = 0
    let skipped = 0

    for (const dept of departments) {
      // Check if department with this code already exists
      const existing = await Department.findOne({
        company: company._id,
        code: dept.code
      })

      if (existing) {
        // Update description if it's empty or different
        if (!existing.description || existing.description !== dept.description) {
          existing.description = dept.description
          existing.name = dept.name // Also update name in case it changed
          await existing.save()
          console.log(`  Updated: ${dept.name} (${dept.code})`)
          updated++
        } else {
          console.log(`  Skipped: ${dept.name} (${dept.code}) - already exists`)
          skipped++
        }
      } else {
        // Create new department
        const newDept = await Department.create({
          name: dept.name,
          code: dept.code,
          description: dept.description,
          company: company._id,
          isActive: true
        })
        console.log(`  Created: ${dept.name} (${dept.code})`)
        created++
      }
    }

    console.log('\n--- Summary ---')
    console.log(`Created: ${created}`)
    console.log(`Updated: ${updated}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Total: ${departments.length}`)

    await mongoose.disconnect()
    console.log('\nDone!')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

seedDepartments()
