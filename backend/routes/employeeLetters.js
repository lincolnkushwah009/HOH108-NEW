import express from 'express'
import EmployeeLetter from '../models/EmployeeLetter.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes protected
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all letters
 * @route   GET /api/employee-letters
 * @access  Private (HR/Admin)
 */
router.get('/',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const {
        letterType,
        status,
        employee,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query

      const query = companyScopedQuery(req)

      if (letterType) query.letterType = letterType
      if (status) query.status = status
      if (employee) query.employee = employee

      if (startDate || endDate) {
        query.letterDate = {}
        if (startDate) query.letterDate.$gte = new Date(startDate)
        if (endDate) query.letterDate.$lte = new Date(endDate)
      }

      const total = await EmployeeLetter.countDocuments(query)

      const letters = await EmployeeLetter.find(query)
        .populate('employee', 'name email avatar designation department')
        .populate('createdBy', 'name')
        .populate('issuedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: letters,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get my letters (for employee)
 * @route   GET /api/employee-letters/my
 * @access  Private
 */
router.get('/my', async (req, res) => {
  try {
    const letters = await EmployeeLetter.find({
      employee: req.user._id,
      status: 'issued'
    })
      .populate('createdBy', 'name')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: letters
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get single letter
 * @route   GET /api/employee-letters/:id
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const letter = await EmployeeLetter.findById(req.params.id)
      .populate('employee', 'name email avatar designation department hrDetails salary')
      .populate('createdBy', 'name')
      .populate('issuedBy', 'name')
      .populate('approval.approvedBy', 'name')
      .populate('approval.rejectedBy', 'name')
      .populate('activities.performedBy', 'name')

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: 'Letter not found'
      })
    }

    res.json({
      success: true,
      data: letter
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Create letter
 * @route   POST /api/employee-letters
 * @access  Private (HR/Admin)
 */
router.post('/',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      // Get company for ID generation
      const company = await Company.findById(companyId)

      // Generate letter ID
      const year = new Date().getFullYear()
      const count = await EmployeeLetter.countDocuments({
        company: companyId,
        createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
      })
      const letterId = `${company?.code || 'IP'}-LTR-${year}-${String(count + 1).padStart(5, '0')}`

      // Get employee details for template fields
      const employee = await User.findById(req.body.employee)
        .populate('company', 'name address')

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // Prepare template fields
      const templateFields = {
        employeeName: employee.name,
        employeeId: employee.userId,
        designation: employee.designation,
        department: employee.department,
        dateOfJoining: employee.hrDetails?.dateOfJoining,
        companyName: company?.name,
        companyAddress: company?.address,
        ...req.body.templateFields
      }

      const letterData = {
        ...req.body,
        letterId,
        company: companyId,
        templateFields,
        createdBy: req.user._id,
        activities: [{
          action: 'created',
          performedBy: req.user._id,
          performedByName: req.user.name,
          createdAt: new Date()
        }]
      }

      const letter = await EmployeeLetter.create(letterData)

      const populatedLetter = await EmployeeLetter.findById(letter._id)
        .populate('employee', 'name email designation')
        .populate('createdBy', 'name')

      res.status(201).json({
        success: true,
        data: populatedLetter,
        message: 'Letter created successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Update letter
 * @route   PUT /api/employee-letters/:id
 * @access  Private (HR/Admin)
 */
router.put('/:id',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const letter = await EmployeeLetter.findById(req.params.id)

      if (!letter) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        })
      }

      if (letter.status === 'issued') {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit an issued letter'
        })
      }

      const { company, employee, createdBy, ...updateData } = req.body

      Object.assign(letter, updateData)

      letter.activities.push({
        action: 'updated',
        performedBy: req.user._id,
        performedByName: req.user.name,
        createdAt: new Date()
      })

      await letter.save()

      res.json({
        success: true,
        data: letter,
        message: 'Letter updated successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Submit letter for approval
 * @route   PUT /api/employee-letters/:id/submit
 * @access  Private (HR)
 */
router.put('/:id/submit',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { approverId } = req.body

      const letter = await EmployeeLetter.findById(req.params.id)

      if (!letter) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        })
      }

      if (letter.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Only draft letters can be submitted for approval'
        })
      }

      letter.status = 'pending_approval'
      letter.approval = {
        requiredApprover: approverId
      }

      letter.activities.push({
        action: 'submitted_for_approval',
        performedBy: req.user._id,
        performedByName: req.user.name,
        createdAt: new Date()
      })

      await letter.save()

      res.json({
        success: true,
        data: letter,
        message: 'Letter submitted for approval'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Approve letter
 * @route   PUT /api/employee-letters/:id/approve
 * @access  Private (Admin)
 */
router.put('/:id/approve',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { comment } = req.body

      const letter = await EmployeeLetter.findById(req.params.id)

      if (!letter) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        })
      }

      if (letter.status !== 'pending_approval') {
        return res.status(400).json({
          success: false,
          message: 'This letter is not pending approval'
        })
      }

      letter.status = 'approved'
      letter.approval.approvedBy = req.user._id
      letter.approval.approvedAt = new Date()
      letter.approval.approvalComment = comment

      letter.activities.push({
        action: 'approved',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment,
        createdAt: new Date()
      })

      await letter.save()

      res.json({
        success: true,
        data: letter,
        message: 'Letter approved successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Reject letter
 * @route   PUT /api/employee-letters/:id/reject
 * @access  Private (Admin)
 */
router.put('/:id/reject',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { reason } = req.body

      const letter = await EmployeeLetter.findById(req.params.id)

      if (!letter) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        })
      }

      if (letter.status !== 'pending_approval') {
        return res.status(400).json({
          success: false,
          message: 'This letter is not pending approval'
        })
      }

      letter.status = 'rejected'
      letter.approval.rejectedBy = req.user._id
      letter.approval.rejectedAt = new Date()
      letter.approval.rejectionReason = reason

      letter.activities.push({
        action: 'rejected',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: reason,
        createdAt: new Date()
      })

      await letter.save()

      res.json({
        success: true,
        data: letter,
        message: 'Letter rejected'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Issue letter
 * @route   PUT /api/employee-letters/:id/issue
 * @access  Private (HR/Admin)
 */
router.put('/:id/issue',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { signatory, deliveryMethod } = req.body

      const letter = await EmployeeLetter.findById(req.params.id)

      if (!letter) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        })
      }

      if (letter.status !== 'approved' && letter.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Only approved or draft letters can be issued'
        })
      }

      letter.status = 'issued'
      letter.issuedBy = req.user._id
      letter.issuedAt = new Date()

      if (signatory) {
        letter.signatory = signatory
      }

      if (deliveryMethod) {
        letter.delivery = {
          method: deliveryMethod,
          deliveredAt: new Date()
        }
      }

      letter.activities.push({
        action: 'issued',
        performedBy: req.user._id,
        performedByName: req.user.name,
        createdAt: new Date()
      })

      // If it's a relieving/experience letter, also store in employee documents
      const employee = await User.findById(letter.employee)
      if (employee && ['relieving_letter', 'experience_letter', 'bonafide_certificate', 'salary_certificate'].includes(letter.letterType)) {
        if (!employee.documents) {
          employee.documents = []
        }

        employee.documents.push({
          documentType: letter.letterType,
          documentName: letter.title,
          fileName: `${letter.letterId}.pdf`,
          fileUrl: letter.pdfUrl || '',
          issuedDate: new Date(),
          uploadedAt: new Date(),
          uploadedBy: req.user._id,
          remarks: `Auto-generated from letter ${letter.referenceNumber}`
        })

        await employee.save()
      }

      await letter.save()

      res.json({
        success: true,
        data: letter,
        message: 'Letter issued successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Record employee acknowledgment
 * @route   PUT /api/employee-letters/:id/acknowledge
 * @access  Private
 */
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { comments } = req.body

    const letter = await EmployeeLetter.findById(req.params.id)

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: 'Letter not found'
      })
    }

    // Only the employee can acknowledge
    if (letter.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the letter recipient can acknowledge'
      })
    }

    letter.acknowledgment = {
      acknowledged: true,
      acknowledgedAt: new Date(),
      comments
    }

    letter.activities.push({
      action: 'acknowledged',
      performedBy: req.user._id,
      performedByName: req.user.name,
      comment: comments,
      createdAt: new Date()
    })

    await letter.save()

    res.json({
      success: true,
      data: letter,
      message: 'Letter acknowledged successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get letter templates (predefined content)
 * @route   GET /api/employee-letters/templates/:type
 * @access  Private (HR/Admin)
 */
router.get('/templates/:type',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const company = await Company.findById(req.activeCompany._id)

      const templates = {
        relieving_letter: {
          title: 'Relieving Letter',
          content: `
<div style="font-family: Arial, sans-serif; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0;">{{companyName}}</h2>
    <p style="margin: 5px 0;">{{companyAddress}}</p>
  </div>

  <p style="text-align: right;">Date: {{date}}</p>
  <p>Ref: {{referenceNumber}}</p>

  <h3 style="text-align: center; margin: 30px 0;">RELIEVING LETTER</h3>

  <p>To Whomsoever It May Concern,</p>

  <p>This is to certify that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) was employed with <strong>{{companyName}}</strong> as <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department from <strong>{{dateOfJoining}}</strong> to <strong>{{lastWorkingDay}}</strong>.</p>

  <p>{{employeeName}} has been relieved from the services of the company with effect from {{lastWorkingDay}}. All dues have been settled and there are no pending obligations from either side.</p>

  <p>We wish {{employeeName}} all the best in future endeavors.</p>

  <div style="margin-top: 50px;">
    <p>For {{companyName}}</p>
    <br><br><br>
    <p><strong>{{signatoryName}}</strong></p>
    <p>{{signatoryDesignation}}</p>
  </div>
</div>`
        },

        experience_letter: {
          title: 'Experience Certificate',
          content: `
<div style="font-family: Arial, sans-serif; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0;">{{companyName}}</h2>
    <p style="margin: 5px 0;">{{companyAddress}}</p>
  </div>

  <p style="text-align: right;">Date: {{date}}</p>
  <p>Ref: {{referenceNumber}}</p>

  <h3 style="text-align: center; margin: 30px 0;">EXPERIENCE CERTIFICATE</h3>

  <p>To Whomsoever It May Concern,</p>

  <p>This is to certify that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) was employed with <strong>{{companyName}}</strong> as <strong>{{designation}}</strong> from <strong>{{dateOfJoining}}</strong> to <strong>{{lastWorkingDay}}</strong>.</p>

  <p>During the tenure, {{employeeName}} was responsible for:</p>
  <ul>
    {{responsibilities}}
  </ul>

  <p>{{employeeName}} was found to be sincere, hardworking, and dedicated to the assigned responsibilities. We wish {{employeeName}} all the best in future career endeavors.</p>

  <div style="margin-top: 50px;">
    <p>For {{companyName}}</p>
    <br><br><br>
    <p><strong>{{signatoryName}}</strong></p>
    <p>{{signatoryDesignation}}</p>
  </div>
</div>`
        },

        bonafide_certificate: {
          title: 'Bonafide Certificate',
          content: `
<div style="font-family: Arial, sans-serif; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0;">{{companyName}}</h2>
    <p style="margin: 5px 0;">{{companyAddress}}</p>
  </div>

  <p style="text-align: right;">Date: {{date}}</p>
  <p>Ref: {{referenceNumber}}</p>

  <h3 style="text-align: center; margin: 30px 0;">BONAFIDE CERTIFICATE</h3>

  <p>To Whomsoever It May Concern,</p>

  <p>This is to certify that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) is a bonafide employee of <strong>{{companyName}}</strong>, working as <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department since <strong>{{dateOfJoining}}</strong>.</p>

  <p>This certificate is issued at the request of the employee for {{purpose}}.</p>

  <div style="margin-top: 50px;">
    <p>For {{companyName}}</p>
    <br><br><br>
    <p><strong>{{signatoryName}}</strong></p>
    <p>{{signatoryDesignation}}</p>
  </div>
</div>`
        },

        salary_certificate: {
          title: 'Salary Certificate',
          content: `
<div style="font-family: Arial, sans-serif; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0;">{{companyName}}</h2>
    <p style="margin: 5px 0;">{{companyAddress}}</p>
  </div>

  <p style="text-align: right;">Date: {{date}}</p>
  <p>Ref: {{referenceNumber}}</p>

  <h3 style="text-align: center; margin: 30px 0;">SALARY CERTIFICATE</h3>

  <p>To Whomsoever It May Concern,</p>

  <p>This is to certify that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) is employed with <strong>{{companyName}}</strong> as <strong>{{designation}}</strong> since <strong>{{dateOfJoining}}</strong>.</p>

  <p>The current salary details are as follows:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">Gross Monthly Salary</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹{{grossSalary}}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">Annual CTC</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹{{ctc}}</td>
    </tr>
  </table>

  <p>This certificate is issued at the request of the employee for {{purpose}}.</p>

  <div style="margin-top: 50px;">
    <p>For {{companyName}}</p>
    <br><br><br>
    <p><strong>{{signatoryName}}</strong></p>
    <p>{{signatoryDesignation}}</p>
  </div>
</div>`
        },

        working_certificate: {
          title: 'Working Certificate',
          content: `
<div style="font-family: Arial, sans-serif; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0;">{{companyName}}</h2>
    <p style="margin: 5px 0;">{{companyAddress}}</p>
  </div>

  <p style="text-align: right;">Date: {{date}}</p>
  <p>Ref: {{referenceNumber}}</p>

  <h3 style="text-align: center; margin: 30px 0;">WORKING CERTIFICATE</h3>

  <p>To Whomsoever It May Concern,</p>

  <p>This is to certify that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) is currently employed with <strong>{{companyName}}</strong> as <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department.</p>

  <p>Date of Joining: {{dateOfJoining}}</p>
  <p>Current Status: Active Employee</p>

  <p>This certificate is issued at the request of the employee for {{purpose}}.</p>

  <div style="margin-top: 50px;">
    <p>For {{companyName}}</p>
    <br><br><br>
    <p><strong>{{signatoryName}}</strong></p>
    <p>{{signatoryDesignation}}</p>
  </div>
</div>`
        },

        grievance_acknowledgment: {
          title: 'Grievance Acknowledgment',
          content: `
<div style="font-family: Arial, sans-serif; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0;">{{companyName}}</h2>
    <p style="margin: 5px 0;">{{companyAddress}}</p>
  </div>

  <p style="text-align: right;">Date: {{date}}</p>
  <p>Ref: {{referenceNumber}}</p>

  <h3 style="text-align: center; margin: 30px 0;">GRIEVANCE ACKNOWLEDGMENT</h3>

  <p>Dear {{employeeName}},</p>

  <p>This letter is to acknowledge receipt of your grievance dated {{grievanceDate}} regarding {{grievanceSubject}}.</p>

  <p>Your grievance has been registered with reference number {{grievanceId}} and has been forwarded to the concerned department for review and appropriate action.</p>

  <p>We assure you that your grievance will be addressed within the stipulated time frame as per company policy. You will be informed about the resolution once the investigation is complete.</p>

  <p>If you have any questions, please feel free to contact HR.</p>

  <div style="margin-top: 50px;">
    <p>For {{companyName}}</p>
    <br><br><br>
    <p><strong>{{signatoryName}}</strong></p>
    <p>{{signatoryDesignation}}</p>
  </div>
</div>`
        }
      }

      const template = templates[req.params.type]

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        })
      }

      // Replace company placeholders
      let content = template.content
        .replace(/{{companyName}}/g, company?.name || '')
        .replace(/{{companyAddress}}/g, company?.address || '')
        .replace(/{{date}}/g, new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }))

      res.json({
        success: true,
        data: {
          ...template,
          content
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get letter statistics
 * @route   GET /api/employee-letters/stats/summary
 * @access  Private (HR/Admin)
 */
router.get('/stats/summary',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      const byType = await EmployeeLetter.aggregate([
        { $match: { company: companyId } },
        {
          $group: {
            _id: '$letterType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])

      const byStatus = await EmployeeLetter.aggregate([
        { $match: { company: companyId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])

      const recentLetters = await EmployeeLetter.find({ company: companyId })
        .populate('employee', 'name')
        .sort({ createdAt: -1 })
        .limit(5)

      res.json({
        success: true,
        data: {
          byType,
          byStatus,
          recentLetters
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

export default router
