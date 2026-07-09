const jwt = require('jsonwebtoken');
const ExpressError = require('./ExpressError');
const Listing = require('../models/listing');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretstring';

module.exports.verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (!err) {
                req.user = decoded;
            }
        });
    }
    next();
};

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.user) {
        // We could redirect to login instead of throwing an error for a better UX, but let's stick to simple errors or rendering for now.
        // Actually, redirecting is better for standard navigation.
        return res.redirect('/login');
    }
    next();
};

module.exports.isHost = (req, res, next) => {
    if (!req.user || req.user.role !== 'host') {
        // Send a 403 or render error
        return next(new ExpressError(403, "Only hosts can perform this action."));
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            return next(new ExpressError(404, "Listing not found."));
        }
        if (!req.user || !listing.owner.equals(req.user.id)) {
            return next(new ExpressError(403, "You do not have permission to modify this listing."));
        }
        next();
    } catch(err) {
        next(err);
    }
};

const Review = require('../models/review');

module.exports.isReviewAuthor = async (req, res, next) => {
    try {
        const { id, reviewId } = req.params;
        const review = await Review.findById(reviewId);
        if (!review) {
            return next(new ExpressError(404, "Review not found."));
        }
        if (!req.user || !review.author.equals(req.user.id)) {
            return next(new ExpressError(403, "You do not have permission to modify this review."));
        }
        next();
    } catch(err) {
        next(err);
    }
};
