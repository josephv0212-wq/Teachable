const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');
const CertificateGenerator = require('../services/certificateGenerator');
const fs = require('fs').promises;
const path = require('path');

// Generate certificate for completed enrollment
router.post('/generate/:enrollmentId', async (req, res) => {
  try {
    const enrollment = await get('SELECT * FROM enrollments WHERE id = ?', [
      req.params.enrollmentId,
    ]);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (!enrollment.examPassed) {
      return res
        .status(400)
        .json({ error: 'Student must pass exam before certificate can be issued' });
    }

    // Check if certificate already exists
    const existingCert = await get(
      'SELECT * FROM certificates WHERE enrollmentId = ?',
      [enrollment.id]
    );

    if (existingCert) {
      // Return existing certificate
      return res.json({
        message: 'Certificate already exists',
        certificate: existingCert,
        downloadUrl: `/api/certificates/download/${existingCert.id}`,
      });
    }

    const student = await get('SELECT * FROM users WHERE id = ?', [enrollment.studentId]);
    const course = await get('SELECT * FROM courses WHERE id = ?', [enrollment.courseId]);
    if (!student || !course) {
      return res.status(500).json({ error: 'Student or course not found for enrollment' });
    }

    const school = await get('SELECT * FROM schools LIMIT 1');
    if (!school) {
      return res.status(400).json({ error: 'School information not configured. Please configure school settings first.' });
    }

    // Validate required school fields
    if (!school.name || !school.licenseNumber || !school.instructorName) {
      return res.status(400).json({ 
        error: 'School information incomplete. Missing required fields: name, licenseNumber, or instructorName.' 
      });
    }

    const certificateNumber = `SR-${Date.now()}-${enrollment.id.toString()}`;

    // Validate student data
    if (!student.firstName || !student.lastName) {
      return res.status(400).json({ error: 'Student name information is incomplete.' });
    }

    if (!student.ssn || student.ssn.length < 4) {
      return res.status(400).json({ error: 'Student SSN is required for certificate generation. Please ensure the student has a valid SSN (at least 4 digits).' });
    }

    // Parse student name for middle initial
    const firstNameParts = (student.firstName || '').split(' ');
    const firstName = firstNameParts[0] || '';
    const middleInitial = firstNameParts.length > 1 ? firstNameParts[1].charAt(0).toUpperCase() + '.' : '';

    console.log('Creating certificate generator with school info:', {
      name: school.name,
      licenseNumber: school.licenseNumber,
      instructorName: school.instructorName,
      hasSignature: !!school.instructorSignature,
      hasLogo: !!school.logo
    });

    const certGenerator = new CertificateGenerator({
      name: school.name,
      licenseNumber: school.licenseNumber,
      instructorName: school.instructorName,
      instructorSignature: school.instructorSignature || null,
      businessRepresentative: school.businessRepresentative || school.instructorName,
      businessRepresentativeSignature: school.businessRepresentativeSignature || school.instructorSignature || null,
      logo: school.logo || null,
    });

    const certificateData = {
      firstName: firstName,
      lastName: student.lastName || '',
      middleInitial: middleInitial,
      idNumber: (student.ssn || '').slice(-4), // Last 4 digits of SSN
      completionDate: enrollment.completedAt || new Date(),
      courseName: course.name || 'Security Training Course',
      certificateNumber,
    };

    console.log('Certificate data:', {
      firstName: certificateData.firstName,
      lastName: certificateData.lastName,
      middleInitial: certificateData.middleInitial,
      idNumber: certificateData.idNumber,
      courseName: certificateData.courseName,
      completionDate: certificateData.completionDate
    });

    console.log('Generating certificate PDF...');
    const pdfBuffer = await certGenerator.generateCertificate(
      certificateData,
      course.certificateTemplate
    );
    console.log('Certificate PDF generated successfully');

    const uploadsDir = path.join(__dirname, '../uploads/certificates');
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `certificate-${certificateNumber}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, pdfBuffer);
    console.log('Certificate PDF saved to:', filepath);

    const certResult = await run(
      `INSERT INTO certificates
       (studentId, courseId, enrollmentId, certificateNumber,
        studentName, ssnLastFour, completionDate,
        schoolName, instructorName, schoolLicenseNumber, pdfUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student.id,
        course.id,
        enrollment.id,
        certificateNumber,
        `${certificateData.firstName} ${certificateData.lastName}`,
        certificateData.idNumber,
        new Date(certificateData.completionDate).toISOString(),
        school.name,
        school.instructorName,
        school.licenseNumber,
        `/uploads/certificates/${filename}`,
      ]
    );

    await run(
      `UPDATE enrollments SET certificateIssued = 1 WHERE id = ?`,
      [enrollment.id]
    );

    const certificate = await get(
      `SELECT c.*, co.name as courseName, co.description as courseDescription
       FROM certificates c
       LEFT JOIN courses co ON c.courseId = co.id
       WHERE c.id = ?`,
      [certResult.id]
    );

    // Format certificate with course data
    const formattedCertificate = {
      ...certificate,
      course: certificate.courseName ? {
        name: certificate.courseName,
        description: certificate.courseDescription
      } : null
    };

    res.json({
      message: 'Certificate generated successfully',
      certificate: formattedCertificate,
      downloadUrl: `/api/certificates/download/${certificate.id}`,
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate certificate', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Download certificate
router.get('/download/:certificateId', async (req, res) => {
  try {
    const certificate = await get('SELECT * FROM certificates WHERE id = ?', [
      req.params.certificateId,
    ]);
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const filepath = path.join(__dirname, '..', certificate.pdfUrl);
    
    // Check if file exists
    try {
      await fs.access(filepath);
    } catch (fileError) {
      console.error('Certificate file not found:', filepath);
      return res.status(404).json({ error: 'Certificate file not found' });
    }

    res.download(filepath, `certificate-${certificate.certificateNumber}.pdf`, (err) => {
      if (err) {
        console.error('Error downloading certificate file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download certificate' });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading certificate:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download certificate' });
    }
  }
});

// Get student certificates
router.get('/student/:studentId', async (req, res) => {
  try {
    const certificates = await all(
      `SELECT c.*, co.name as courseName, co.description as courseDescription
       FROM certificates c
       LEFT JOIN courses co ON c.courseId = co.id
       WHERE c.studentId = ? 
       ORDER BY c.issuedAt DESC`,
      [req.params.studentId]
    );
    
    // Format certificates with course data
    const formattedCertificates = certificates.map(cert => ({
      ...cert,
      course: cert.courseName ? {
        name: cert.courseName,
        description: cert.courseDescription
      } : null
    }));
    
    res.json(formattedCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates', details: error.message });
  }
});

// Get all certificates (admin)
router.get('/', async (_req, res) => {
  try {
    const certificates = await all(
      `SELECT * FROM certificates ORDER BY issuedAt DESC`
    );
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Get certificate by ID
router.get('/:certificateId', async (req, res) => {
  try {
    const certificate = await get('SELECT * FROM certificates WHERE id = ?', [
      req.params.certificateId,
    ]);
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    res.json(certificate);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

module.exports = router;

