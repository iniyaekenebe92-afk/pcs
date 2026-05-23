const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/applicationController');
const { showLanding, submitApplication, showSuccess, showFaq, showContact, showAbout } = require('../controllers/applicationController');

const validators = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('gender').notEmpty().withMessage('Gender is required'),
  body('nationality').trim().notEmpty().withMessage('Nationality is required'),
  body('current_country').trim().notEmpty().withMessage('Current country is required'),
  body('whatsapp').trim().notEmpty().withMessage('WhatsApp number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('caregiving_experience').notEmpty().withMessage('Experience type is required'),
  body('years_experience').isInt({ min: 0 }).withMessage('Years of experience required'),
  body('education_level').notEmpty().withMessage('Education level is required'),
  body('preferred_destination').notEmpty().withMessage('Preferred destination is required'),
  body('has_passport').notEmpty().withMessage('Passport status is required'),
  body('english_proficiency').notEmpty().withMessage('English proficiency is required'),
  body('consented').equals('true').withMessage('You must consent to proceed'),
];

router.get('/', ctrl.showLanding);
router.post('/apply', validators, ctrl.submitApplication);
router.get('/success', showSuccess);
router.get('/faq', showFaq);
router.get('/contact', showContact);
router.get('/about', showAbout);

module.exports = router;
