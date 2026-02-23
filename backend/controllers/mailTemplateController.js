import MailTemplate from '../models/MailTemplate.js'

// @desc    Get all mail templates
// @route   GET /api/mail-templates
// @access  Private/Admin
export const getMailTemplates = async (req, res) => {
  try {
    const { category, isActive, search } = req.query

    const query = {}

    if (category) query.category = category
    if (isActive !== undefined) query.isActive = isActive === 'true'

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ]
    }

    const templates = await MailTemplate.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      count: templates.length,
      data: templates
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Get single mail template
// @route   GET /api/mail-templates/:id
// @access  Private/Admin
export const getMailTemplate = async (req, res) => {
  try {
    const template = await MailTemplate.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mail template not found'
      })
    }

    res.json({
      success: true,
      data: template
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Create mail template
// @route   POST /api/mail-templates
// @access  Private/Admin
export const createMailTemplate = async (req, res) => {
  try {
    const { name, subject, body, category } = req.body

    // Check if template with same name exists
    const existingTemplate = await MailTemplate.findOne({ name })
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'A template with this name already exists'
      })
    }

    const template = await MailTemplate.create({
      name,
      subject,
      body,
      category,
      createdBy: req.user?.id
    })

    res.status(201).json({
      success: true,
      data: template,
      message: 'Mail template created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Update mail template
// @route   PUT /api/mail-templates/:id
// @access  Private/Admin
export const updateMailTemplate = async (req, res) => {
  try {
    const { name, subject, body, category, isActive } = req.body

    let template = await MailTemplate.findById(req.params.id)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mail template not found'
      })
    }

    // Check for duplicate name (excluding current template)
    if (name && name !== template.name) {
      const existingTemplate = await MailTemplate.findOne({ name })
      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          message: 'A template with this name already exists'
        })
      }
    }

    template.name = name || template.name
    template.subject = subject || template.subject
    template.body = body || template.body
    template.category = category || template.category
    if (isActive !== undefined) template.isActive = isActive
    template.updatedBy = req.user?.id

    await template.save()

    res.json({
      success: true,
      data: template,
      message: 'Mail template updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Delete mail template
// @route   DELETE /api/mail-templates/:id
// @access  Private/Admin
export const deleteMailTemplate = async (req, res) => {
  try {
    const template = await MailTemplate.findByIdAndDelete(req.params.id)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mail template not found'
      })
    }

    res.json({
      success: true,
      message: 'Mail template deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Toggle mail template active status
// @route   PUT /api/mail-templates/:id/toggle
// @access  Private/Admin
export const toggleMailTemplate = async (req, res) => {
  try {
    const template = await MailTemplate.findById(req.params.id)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mail template not found'
      })
    }

    template.isActive = !template.isActive
    template.updatedBy = req.user?.id
    await template.save()

    res.json({
      success: true,
      data: template,
      message: `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Preview mail template with sample data
// @route   POST /api/mail-templates/:id/preview
// @access  Private/Admin
export const previewMailTemplate = async (req, res) => {
  try {
    const template = await MailTemplate.findById(req.params.id)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mail template not found'
      })
    }

    const { data = {} } = req.body

    // Replace variables with provided data or placeholders
    let previewSubject = template.subject
    let previewBody = template.body

    template.variables.forEach(variable => {
      const value = data[variable] || `[${variable}]`
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g')
      previewSubject = previewSubject.replace(regex, value)
      previewBody = previewBody.replace(regex, value)
    })

    res.json({
      success: true,
      data: {
        subject: previewSubject,
        body: previewBody,
        variables: template.variables
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
