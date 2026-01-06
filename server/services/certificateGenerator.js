const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

class CertificateGenerator {
  constructor(schoolInfo) {
    this.schoolInfo = schoolInfo;
  }

  /**
   * Generate a certificate PDF matching Texas DPS Level II format
   * @param {Object} data - Certificate data
   * @param {string} data.firstName - Student first name
   * @param {string} data.lastName - Student last name
   * @param {string} data.middleInitial - Student middle initial (optional)
   * @param {string} data.idNumber - Last 4 digits of SSN, DL, or ID
   * @param {Date} data.completionDate - Date of course completion
   * @param {string} data.courseName - Name of the course
   * @param {string} data.certificateNumber - Unique certificate number
   * @param {string} templatePath - Path to certificate template PDF (optional)
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generateCertificate(data, templatePath = null) {
    let pdfDoc;
    
    if (templatePath && await this.fileExists(templatePath)) {
      // Load existing template
      const templateBytes = await fs.readFile(templatePath);
      pdfDoc = await PDFDocument.load(templateBytes);
    } else {
      // Create new certificate from scratch
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([792, 612]); // 11x8.5 inches at 72 DPI
      
      // Add background and design elements
      await this.addCertificateDesign(pdfDoc, page);
    }

    // Get the first page
    const pages = pdfDoc.getPages();
    const page = pages[0];

    // Add text fields
    await this.addCertificateFields(pdfDoc, page, data);

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async addCertificateDesign(pdfDoc, page) {
    const { width, height } = page.getSize();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Add logo if available (top left)
    if (this.schoolInfo.logo) {
      try {
        const logoPath = path.isAbsolute(this.schoolInfo.logo) 
          ? this.schoolInfo.logo 
          : path.join(__dirname, '..', this.schoolInfo.logo);
        
        if (await this.fileExists(logoPath)) {
          const logoBytes = await fs.readFile(logoPath);
          let logoImage;
          
          // Try PNG first, then JPEG
          try {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } catch {
            try {
              logoImage = await pdfDoc.embedJpg(logoBytes);
            } catch (error) {
              console.log('Could not embed logo image:', error.message);
            }
          }
          
          if (logoImage) {
            const logoSize = 60;
            page.drawImage(logoImage, {
              x: 72, // 1 inch margin
              y: height - 100,
              width: logoSize,
              height: logoSize,
            });
          }
        }
      } catch (error) {
        console.log('Error loading logo:', error.message);
      }
    }

    // Header: Texas Department of Public Safety
    page.drawText('Texas Department of Public Safety', {
      x: 150,
      y: height - 80,
      size: 14,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });

    // Regulatory Services Division
    page.drawText('Regulatory Services Division', {
      x: 150,
      y: height - 100,
      size: 12,
      font: timesRoman,
      color: rgb(0, 0, 0),
    });

    // Website
    page.drawText('www.dps.texas.gov', {
      x: 150,
      y: height - 115,
      size: 10,
      font: timesRoman,
      color: rgb(0, 0, 0),
    });

    // Private Security Program (top right)
    const programText = 'PRIVATE SECURITY PROGRAM';
    const programWidth = timesRomanBold.widthOfTextAtSize(programText, 12);
    page.drawText(programText, {
      x: width - programWidth - 72,
      y: height - 80,
      size: 12,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });

    // Main Title: SECURITY OFFICER TRAINING COURSE
    const titleText = 'SECURITY OFFICER TRAINING COURSE';
    const titleWidth = timesRomanBold.widthOfTextAtSize(titleText, 16);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 150,
      size: 16,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });

    // Subtitle: LEVEL II CERTIFICATE OF COMPLETION
    const subtitleText = 'LEVEL II CERTIFICATE OF COMPLETION';
    const subtitleWidth = timesRomanBold.widthOfTextAtSize(subtitleText, 14);
    page.drawText(subtitleText, {
      x: (width - subtitleWidth) / 2,
      y: height - 170,
      size: 14,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });

    // Certification statement
    const certStatement = 'This certifies that the below-named individual has successfully completed the Level Two Training Course approved by the Texas Department of Public Safety, Regulatory Services Division.';
    page.drawText(certStatement, {
      x: 72,
      y: height - 210,
      size: 10,
      font: timesRoman,
      color: rgb(0, 0, 0),
      maxWidth: width - 144,
      lineHeight: 12,
    });
  }

  async addCertificateFields(pdfDoc, page, data) {
    const { width, height } = page.getSize();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const startY = height - 250;
    const lineHeight = 20;
    const tableStartX = 72;
    const tableWidth = width - 144;
    const col1Width = 200;
    const col2Width = tableWidth - col1Width;

    // STUDENT INFORMATION section
    let currentY = startY;
    
    // Section header
    page.drawText('STUDENT INFORMATION', {
      x: tableStartX,
      y: currentY,
      size: 12,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight + 5;

    // Table border
    const tableHeight = 100;
    page.drawRectangle({
      x: tableStartX,
      y: currentY - tableHeight,
      width: tableWidth,
      height: tableHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Vertical line
    page.drawLine({
      start: { x: tableStartX + col1Width, y: currentY },
      end: { x: tableStartX + col1Width, y: currentY - tableHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Horizontal lines
    const rowHeight = tableHeight / 4;
    for (let i = 1; i < 4; i++) {
      page.drawLine({
        start: { x: tableStartX, y: currentY - (i * rowHeight) },
        end: { x: tableStartX + tableWidth, y: currentY - (i * rowHeight) },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    // Student Information labels and values
    const studentLabels = ['Last Name', 'First Name', 'Middle Initial', 'Identification Number'];
    const studentValues = [
      data.lastName || '',
      data.firstName || '',
      data.middleInitial || '',
      data.idNumber || ''
    ];

    for (let i = 0; i < 4; i++) {
      const rowY = currentY - (i * rowHeight) - rowHeight / 2 + 5;
      page.drawText(studentLabels[i], {
        x: tableStartX + 5,
        y: rowY,
        size: 10,
        font: timesRomanBold,
        color: rgb(0, 0, 0),
      });
      page.drawText(studentValues[i], {
        x: tableStartX + col1Width + 5,
        y: rowY,
        size: 10,
        font: timesRoman,
        color: rgb(0, 0, 0),
      });
    }

    // TRAINING INFORMATION section
    currentY = currentY - tableHeight - 30;
    
    // Section header
    page.drawText('IN-PERSON CLASSROOM OR ONLINE TRAINING', {
      x: tableStartX,
      y: currentY,
      size: 12,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight + 5;

    // Training table
    const trainingTableHeight = 180;
    page.drawRectangle({
      x: tableStartX,
      y: currentY - trainingTableHeight,
      width: tableWidth,
      height: trainingTableHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Vertical line
    page.drawLine({
      start: { x: tableStartX + col1Width, y: currentY },
      end: { x: tableStartX + col1Width, y: currentY - trainingTableHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Training rows
    const trainingRowHeight = trainingTableHeight / 6;
    for (let i = 1; i < 6; i++) {
      page.drawLine({
        start: { x: tableStartX, y: currentY - (i * trainingRowHeight) },
        end: { x: tableStartX + tableWidth, y: currentY - (i * trainingRowHeight) },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    // Training Information labels and values
    const trainingLabels = [
      'Business Name',
      'Business License Number',
      'Instructor Name',
      'Name of Business Representative',
      'Course Completion Date',
      'Was this training conducted online?'
    ];
    const trainingValues = [
      this.schoolInfo.name || '',
      this.schoolInfo.licenseNumber || '',
      this.schoolInfo.instructorName || '',
      this.schoolInfo.businessRepresentative || this.schoolInfo.instructorName || '',
      this.formatDate(data.completionDate),
      'No' // Default to No, can be made configurable
    ];

    for (let i = 0; i < 6; i++) {
      const rowY = currentY - (i * trainingRowHeight) - trainingRowHeight / 2 + 5;
      
      // Handle the online training checkbox row differently
      if (i === 5) {
        page.drawText(trainingLabels[i], {
          x: tableStartX + 5,
          y: rowY,
          size: 10,
          font: timesRomanBold,
          color: rgb(0, 0, 0),
        });
        // Draw checkboxes
        page.drawRectangle({
          x: tableStartX + col1Width + 5,
          y: rowY - 8,
          width: 12,
          height: 12,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        page.drawText('Yes', {
          x: tableStartX + col1Width + 20,
          y: rowY,
          size: 10,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
        page.drawRectangle({
          x: tableStartX + col1Width + 60,
          y: rowY - 8,
          width: 12,
          height: 12,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        // Check the "No" box
        page.drawText('✓', {
          x: tableStartX + col1Width + 62,
          y: rowY - 2,
          size: 10,
          font: timesRomanBold,
          color: rgb(0, 0, 0),
        });
        page.drawText('No', {
          x: tableStartX + col1Width + 75,
          y: rowY,
          size: 10,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
      } else {
        page.drawText(trainingLabels[i], {
          x: tableStartX + 5,
          y: rowY,
          size: 10,
          font: timesRomanBold,
          color: rgb(0, 0, 0),
        });
        page.drawText(trainingValues[i], {
          x: tableStartX + col1Width + 5,
          y: rowY,
          size: 10,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
      }
    }

    // Signatures section
    currentY = currentY - trainingTableHeight - 20;
    const signatureY = currentY;
    const signatureSpacing = 200;

    // Instructor Signature
    page.drawText('Instructor Signature', {
      x: tableStartX,
      y: signatureY,
      size: 10,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });
    
    // Signature line
    page.drawLine({
      start: { x: tableStartX, y: signatureY - 20 },
      end: { x: tableStartX + 180, y: signatureY - 20 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Instructor signature image if available
    if (this.schoolInfo.instructorSignature) {
      try {
        const sigPath = path.isAbsolute(this.schoolInfo.instructorSignature)
          ? this.schoolInfo.instructorSignature
          : path.join(__dirname, '..', this.schoolInfo.instructorSignature);
        
        if (await this.fileExists(sigPath)) {
          const signatureImage = await fs.readFile(sigPath);
          let sigImg;
          try {
            sigImg = await pdfDoc.embedPng(signatureImage);
          } catch {
            try {
              sigImg = await pdfDoc.embedJpg(signatureImage);
            } catch (error) {
              console.log('Could not embed signature image:', error.message);
            }
          }
          
          if (sigImg) {
            page.drawImage(sigImg, {
              x: tableStartX,
              y: signatureY - 45,
              width: 150,
              height: 30,
            });
          }
        }
      } catch (error) {
        console.log('Error loading instructor signature:', error.message);
      }
    }

    // Business Representative Signature
    page.drawText('Business Representative Signature', {
      x: tableStartX + signatureSpacing,
      y: signatureY,
      size: 10,
      font: timesRomanBold,
      color: rgb(0, 0, 0),
    });
    
    // Signature line
    page.drawLine({
      start: { x: tableStartX + signatureSpacing, y: signatureY - 20 },
      end: { x: tableStartX + signatureSpacing + 180, y: signatureY - 20 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Business representative signature (can be same as instructor or separate)
    const businessRepSig = this.schoolInfo.businessRepresentativeSignature || this.schoolInfo.instructorSignature;
    if (businessRepSig) {
      try {
        const sigPath = path.isAbsolute(businessRepSig)
          ? businessRepSig
          : path.join(__dirname, '..', businessRepSig);
        
        if (await this.fileExists(sigPath)) {
          const signatureImage = await fs.readFile(sigPath);
          let sigImg;
          try {
            sigImg = await pdfDoc.embedPng(signatureImage);
          } catch {
            try {
              sigImg = await pdfDoc.embedJpg(signatureImage);
            } catch (error) {
              console.log('Could not embed business rep signature image:', error.message);
            }
          }
          
          if (sigImg) {
            page.drawImage(sigImg, {
              x: tableStartX + signatureSpacing,
              y: signatureY - 45,
              width: 150,
              height: 30,
            });
          }
        }
      } catch (error) {
        console.log('Error loading business rep signature:', error.message);
      }
    }
  }

  formatDate(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = CertificateGenerator;

