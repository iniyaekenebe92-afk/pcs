const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { sendApplicationNotification } = require('../config/mailer');
const { Country } = require('country-state-city');

const partnersDir = path.join(__dirname, '../public/partners');
const partners = fs.existsSync(partnersDir)
  ? fs.readdirSync(partnersDir).filter(f => /\.(png|jpg|jpeg|svg|webp)$/i.test(f))
  : [];

// Build once at module load — isoCode is the 2-letter code flagcdn uses
const countries = Country.getAllCountries().map(c => ({
  value: c.name,
  label: c.name,
  isoCode: c.isoCode.toLowerCase(),
}));

const occupations = require('../data/occupations.json');

exports.showSuccess = (req, res) => {
  res.render('success');
};

exports.showFaq = (req, res) => {
  res.render('faq');
};

exports.showContact = (req, res) => {
  res.render('contact');
};

exports.showAbout = (req, res) => {
  res.render('about');
};

exports.showLanding = (req, res) => {
  res.render('landing', {
    countries,
    partners,
    occupationItems: occupations,
    genderItems: [
      { value: 'male',   label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
    caregivingItems: [
      { value: 'elderly_care',    label: 'Elderly Care' },
      { value: 'child_care',      label: 'Child Care' },
      { value: 'disability_care', label: 'Disability / Special Needs Care' },
      { value: 'nursing',         label: 'Nursing / Clinical Support' },
      { value: 'live_in',         label: 'Live-in Care' },
      { value: 'other',           label: 'Other' },
    ],
    yearsItems: [
      { value: '1',  label: 'Less than 1 year' },
      { value: '2',  label: '1 – 2 years' },
      { value: '4',  label: '3 – 5 years' },
      { value: '7',  label: '6 – 10 years' },
      { value: '10', label: 'More than 10 years' },
    ],
    educationItems: [
      { value: 'secondary',      label: 'Secondary School' },
      { value: 'diploma',        label: 'Diploma / Certificate' },
      { value: 'bachelors',      label: "Bachelor's Degree" },
      { value: 'masters',        label: "Master's Degree" },
      { value: 'nursing_degree', label: 'Nursing Degree' },
      { value: 'other',          label: 'Other' },
    ],
    destinationItems: [
      { value: 'canada', label: 'Canada' },
      { value: 'uk',     label: 'United Kingdom' },
      { value: 'both',   label: 'Either / Both' },
    ],
    passportItems: [
      { value: 'yes',     label: 'Yes, I have a valid passport' },
      { value: 'no',      label: 'No, I do not have a passport' },
      { value: 'expired', label: 'My passport is expired' },
    ],
    englishItems: [
      { value: 'basic',        label: 'Basic' },
      { value: 'conversational', label: 'Conversational' },
      { value: 'proficient',   label: 'Proficient' },
      { value: 'fluent',       label: 'Fluent' },
      { value: 'native',       label: 'Native / Bilingual' },
    ],
    travelItems: [
      { value: 'none',           label: 'No travel history' },
      { value: 'visited_uk',     label: 'Visited the UK' },
      { value: 'visited_canada', label: 'Visited Canada' },
      { value: 'visited_other',  label: 'Visited other countries' },
      { value: 'has_visa',       label: 'Currently holds a valid visa' },
    ],
  });
};

exports.submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(422).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const { error } = await supabase.from('contact_messages').insert([{
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    }]);

    if (error) throw error;

    return res.json({ success: true });
  } catch (err) {
    console.error('Contact submission error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

exports.submitApplication = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const {
    full_name, gender, nationality, current_country,
    whatsapp, email, caregiving_experience, years_experience,
    current_occupation, education_level, certification,
    preferred_destination, has_passport, travel_history,
    english_proficiency, consented,
  } = req.body;

  try {
    const { error } = await supabase.from('caregiver_applications').insert([{
      full_name,
      gender,
      nationality,
      current_country,
      whatsapp,
      email,
      caregiving_experience,
      years_experience: parseInt(years_experience),
      current_occupation,
      education_level,
      certification: certification || null,
      preferred_destination,
      has_passport: has_passport === 'yes',
      travel_history,
      english_proficiency,
      consented: consented === 'true' || consented === true,
    }]);

    if (error) throw error;

    // Non-blocking — don't fail submission if email fails
    sendApplicationNotification({ full_name, email, whatsapp, nationality, preferred_destination, years_experience })
      .catch(err => console.error('Mailer error:', err));

    return res.json({ success: true });
  } catch (err) {
    console.error('Submission error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};
