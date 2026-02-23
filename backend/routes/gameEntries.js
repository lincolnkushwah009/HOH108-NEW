import express from 'express';
import GameEntry from '../models/GameEntry.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/game-entries
// @desc    Submit a new game entry (PUBLIC - no auth required for game submissions)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      rating,
      spinsUsed,
      campaign,
      location,
      deviceInfo
    } = req.body;

    // Basic validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required'
      });
    }

    // Create game entry
    const gameEntry = new GameEntry({
      name: name.trim(),
      phone: phone.trim(),
      rating: rating || 0,
      spinsUsed: spinsUsed || 1,
      campaign: campaign || 'GOD IS KIND Street Marketing',
      location: location || '',
      deviceInfo: deviceInfo || {},
      prizeStatus: 'pending'
    });

    await gameEntry.save();

    res.status(201).json({
      success: true,
      message: 'Entry recorded successfully! Claim your prize.',
      data: {
        id: gameEntry._id,
        name: gameEntry.name,
        prize: gameEntry.prize
      }
    });
  } catch (error) {
    console.error('Game entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record entry. Please try again.'
    });
  }
});

// @route   GET /api/game-entries
// @desc    Get all game entries (with pagination & filters)
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    // Build filter
    const filter = {};

    if (status && status !== 'all') {
      filter.prizeStatus = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get entries
    const [entries, total] = await Promise.all([
      GameEntry.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      GameEntry.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: entries.length,
        totalEntries: total
      }
    });
  } catch (error) {
    console.error('Get game entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entries'
    });
  }
});

// @route   GET /api/game-entries/stats
// @desc    Get game statistics
// @access  Private (Admin)
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await GameEntry.getStats();

    // Get today's entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = await GameEntry.countDocuments({
      createdAt: { $gte: today }
    });

    // Get this week's entries
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEntries = await GameEntry.countDocuments({
      createdAt: { $gte: weekStart }
    });

    // Rating distribution
    const ratingDistribution = await GameEntry.aggregate([
      { $match: { rating: { $gt: 0 } } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        todayEntries,
        weekEntries,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// @route   GET /api/game-entries/:id
// @desc    Get single game entry
// @access  Private (Admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const entry = await GameEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entry'
    });
  }
});

// @route   PUT /api/game-entries/:id/status
// @desc    Update prize status
// @access  Private (Admin)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const entry = await GameEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    // Update status
    entry.prizeStatus = status;

    if (status === 'claimed') {
      entry.claimedAt = new Date();
    } else if (status === 'delivered') {
      entry.deliveredAt = new Date();
    }

    if (adminNotes) {
      entry.adminNotes = adminNotes;
    }

    await entry.save();

    res.json({
      success: true,
      message: `Prize status updated to ${status}`,
      data: entry
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

// @route   PUT /api/game-entries/:id
// @desc    Update game entry details
// @access  Private (Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, phone, adminNotes, location } = req.body;
    const entry = await GameEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    if (name) entry.name = name;
    if (phone) entry.phone = phone;
    if (adminNotes !== undefined) entry.adminNotes = adminNotes;
    if (location) entry.location = location;

    await entry.save();

    res.json({
      success: true,
      message: 'Entry updated successfully',
      data: entry
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update entry'
    });
  }
});

// @route   DELETE /api/game-entries/:id
// @desc    Delete game entry
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const entry = await GameEntry.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete entry'
    });
  }
});

// @route   POST /api/game-entries/export
// @desc    Export game entries to CSV
// @access  Private (Admin)
router.post('/export', protect, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.body;

    const filter = {};
    if (status && status !== 'all') filter.prizeStatus = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const entries = await GameEntry.find(filter).sort({ createdAt: -1 }).lean();

    // Build CSV
    const headers = ['Name', 'Phone', 'Rating', 'Spins Used', 'Prize Status', 'Campaign', 'Date'];
    const rows = entries.map(e => [
      e.name,
      e.phone,
      e.rating,
      e.spinsUsed,
      e.prizeStatus,
      e.campaign,
      new Date(e.createdAt).toLocaleString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=game-entries.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export entries'
    });
  }
});

export default router;
