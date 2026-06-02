import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { Export } from '../models/exportModel.js';

// Helper: Normalize name to filename format
const sanitizeFilename = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'resume';
};

// GET /api/export/history
export const getExportHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const list = await Export.findByUserId(userId);
    return res.status(200).json({
      success: true,
      exports: list
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/export/pdf
export const exportPdf = async (req, res, next) => {
  try {
    const { template, resumeData } = req.body;
    const userId = req.user.id;

    if (!resumeData || !resumeData.name) {
      return res.status(400).json({
        success: false,
        error: 'Resume dataset with personal information is required.'
      });
    }

    const templateName = template || 'ats';
    const cleanName = sanitizeFilename(resumeData.name);
    const fileName = `resume_${cleanName}_${templateName}.pdf`;

    // 1. Create PDF Document using PDFKit
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Write file directly to stream response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);

    // Apply template styling
    if (templateName === 'modern') {
      // Modern Professional Layout
      // Top colored banner accent
      doc.rect(0, 0, doc.page.width, 15).fill('#581C87'); // Purple banner

      // Name & Title
      doc.moveDown(1.5);
      doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(22).text(resumeData.name);
      
      // Contact Info row
      doc.font('Helvetica').fontSize(9).fillColor('#64748B');
      const contactText = `${resumeData.email || ''}  |  ${resumeData.phone || ''}  |  ${resumeData.location || ''}`;
      doc.text(contactText, { lineGap: 4 });
      if (resumeData.links) doc.text(resumeData.links);

      doc.moveDown(1.5);

      // Helper for Modern headers
      const renderSectionHeader = (title) => {
        doc.moveDown(1);
        doc.fillColor('#581C87').font('Helvetica-Bold').fontSize(12).text(title, { characterSpacing: 0.5 });
        // Underline line
        const y = doc.y + 2;
        doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#E2E8F0').lineWidth(1.5).stroke();
        doc.moveDown(0.8);
      };

      // Experience Section
      if (resumeData.experience && resumeData.experience.length > 0) {
        renderSectionHeader('WORK EXPERIENCE');
        resumeData.experience.forEach(exp => {
          doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(10).text(exp.role, { continued: true });
          doc.font('Helvetica-Oblique').fillColor('#64748B').text(` at ${exp.company || ''}`, { continued: true });
          doc.font('Helvetica').fillColor('#475569').text(` (${exp.duration || ''})`, { align: 'right' });
          
          doc.moveDown(0.25);
          doc.font('Helvetica').fontSize(9).fillColor('#334155');
          
          // Split bullets and render
          const bullets = exp.description ? exp.description.split('\n') : [];
          bullets.forEach(bullet => {
            if (bullet.trim()) {
              const cleanBullet = bullet.trim().replace(/^[\u2022\-\*\s]+/, '');
              doc.text(`\u2022  ${cleanBullet}`, { indent: 10, lineGap: 3 });
            }
          });
          doc.moveDown(0.75);
        });
      }

      // Projects Section
      if (resumeData.projects && resumeData.projects.length > 0) {
        renderSectionHeader('PROJECTS & INITIATIVES');
        resumeData.projects.forEach(proj => {
          doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(10).text(proj.title);
          if (proj.technologies && proj.technologies.length > 0) {
            doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#581C87').text(`Technologies: ${proj.technologies.join(', ')}`);
          }
          doc.moveDown(0.25);
          doc.font('Helvetica').fontSize(9).fillColor('#334155');
          const bullets = proj.description ? proj.description.split('\n') : [];
          bullets.forEach(bullet => {
            if (bullet.trim()) {
              const cleanBullet = bullet.trim().replace(/^[\u2022\-\*\s]+/, '');
              doc.text(`\u2022  ${cleanBullet}`, { indent: 10, lineGap: 3 });
            }
          });
          doc.moveDown(0.75);
        });
      }

      // Skills Section
      if (resumeData.skills && resumeData.skills.length > 0) {
        renderSectionHeader('SKILLS & COMPETENCIES');
        doc.font('Helvetica').fontSize(9.5).fillColor('#334155').text(resumeData.skills.join(', '), { lineGap: 4 });
      }

      // Education Section
      if (resumeData.education && resumeData.education.length > 0) {
        renderSectionHeader('EDUCATION');
        resumeData.education.forEach(edu => {
          doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(10).text(edu.degree, { continued: true });
          doc.font('Helvetica').fillColor('#64748B').text(` — ${edu.school || ''}`, { continued: true });
          doc.fillColor('#475569').text(` (${edu.year || ''})`, { align: 'right' });
          doc.moveDown(0.5);
        });
      }

    } else if (templateName === 'minimal') {
      // Minimal Clean Layout
      doc.moveDown(1);
      // Main Title Left-aligned
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(24).text(resumeData.name);
      
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
      const contactText = `${resumeData.email || ''}  /  ${resumeData.phone || ''}  /  ${resumeData.location || ''} ${resumeData.links ? ' / ' + resumeData.links : ''}`;
      doc.text(contactText);

      doc.moveDown(1.5);

      const renderSectionHeader = (title) => {
        doc.moveDown(0.8);
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text(title, { characterSpacing: 1.5 });
        doc.moveDown(0.5);
      };

      // Experience Section
      if (resumeData.experience && resumeData.experience.length > 0) {
        renderSectionHeader('EXPERIENCE');
        resumeData.experience.forEach(exp => {
          doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text(exp.role, { continued: true });
          doc.font('Helvetica').fillColor('#475569').text(`  |  ${exp.company || ''}`, { continued: true });
          doc.fillColor('#94A3B8').text(`  |  ${exp.duration || ''}`, { align: 'right' });
          
          doc.moveDown(0.3);
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
          const bullets = exp.description ? exp.description.split('\n') : [];
          bullets.forEach(bullet => {
            if (bullet.trim()) {
              const cleanBullet = bullet.trim().replace(/^[\u2022\-\*\s]+/, '');
              doc.text(`—  ${cleanBullet}`, { indent: 8, lineGap: 3.5 });
            }
          });
          doc.moveDown(0.6);
        });
      }

      // Projects Section
      if (resumeData.projects && resumeData.projects.length > 0) {
        renderSectionHeader('PROJECTS');
        resumeData.projects.forEach(proj => {
          doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text(proj.title);
          if (proj.technologies && proj.technologies.length > 0) {
            doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#475569').text(`Tech: ${proj.technologies.join(', ')}`);
          }
          doc.moveDown(0.3);
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
          const bullets = proj.description ? proj.description.split('\n') : [];
          bullets.forEach(bullet => {
            if (bullet.trim()) {
              const cleanBullet = bullet.trim().replace(/^[\u2022\-\*\s]+/, '');
              doc.text(`—  ${cleanBullet}`, { indent: 8, lineGap: 3.5 });
            }
          });
          doc.moveDown(0.6);
        });
      }

      // Skills Section
      if (resumeData.skills && resumeData.skills.length > 0) {
        renderSectionHeader('SKILLS');
        doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(resumeData.skills.join('  •  '), { lineGap: 4 });
      }

      // Education Section
      if (resumeData.education && resumeData.education.length > 0) {
        renderSectionHeader('EDUCATION');
        resumeData.education.forEach(edu => {
          doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text(edu.degree, { continued: true });
          doc.font('Helvetica').fillColor('#475569').text(`  —  ${edu.school || ''}`, { continued: true });
          doc.fillColor('#94A3B8').text(`  (${edu.year || ''})`, { align: 'right' });
          doc.moveDown(0.4);
        });
      }

    } else {
      // ATS Friendly Layout (Minimalist centered single-column layout)
      doc.moveDown(0.5);
      
      // Center Title
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(20).text(resumeData.name, { align: 'center' });
      
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(9.5).fillColor('#000000');
      const contactText = `${resumeData.email || ''}  |  ${resumeData.phone || ''}  |  ${resumeData.location || ''} ${resumeData.links ? '  |  ' + resumeData.links : ''}`;
      doc.text(contactText, { align: 'center' });

      doc.moveDown(1.5);

      const renderSectionHeader = (title) => {
        doc.moveDown(1);
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text(title, { align: 'center' });
        // Divider line
        const y = doc.y + 2;
        doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#000000').lineWidth(0.75).stroke();
        doc.moveDown(0.6);
      };

      // Experience Section
      if (resumeData.experience && resumeData.experience.length > 0) {
        renderSectionHeader('WORK EXPERIENCE');
        resumeData.experience.forEach(exp => {
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(exp.role, { continued: true });
          doc.font('Helvetica-Bold').text(` — ${exp.company || ''}`, { continued: true });
          doc.font('Helvetica').text(` (${exp.duration || ''})`, { align: 'right' });
          
          doc.moveDown(0.3);
          doc.font('Helvetica').fontSize(9.5).fillColor('#000000');
          const bullets = exp.description ? exp.description.split('\n') : [];
          bullets.forEach(bullet => {
            if (bullet.trim()) {
              const cleanBullet = bullet.trim().replace(/^[\u2022\-\*\s]+/, '');
              doc.text(`\u2022  ${cleanBullet}`, { indent: 12, lineGap: 3.5 });
            }
          });
          doc.moveDown(0.6);
        });
      }

      // Projects Section
      if (resumeData.projects && resumeData.projects.length > 0) {
        renderSectionHeader('PROJECTS');
        resumeData.projects.forEach(proj => {
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(proj.title);
          if (proj.technologies && proj.technologies.length > 0) {
            doc.font('Helvetica-Oblique').fontSize(8.5).text(`Technologies: ${proj.technologies.join(', ')}`);
          }
          doc.moveDown(0.3);
          doc.font('Helvetica').fontSize(9.5);
          const bullets = proj.description ? proj.description.split('\n') : [];
          bullets.forEach(bullet => {
            if (bullet.trim()) {
              const cleanBullet = bullet.trim().replace(/^[\u2022\-\*\s]+/, '');
              doc.text(`\u2022  ${cleanBullet}`, { indent: 12, lineGap: 3.5 });
            }
          });
          doc.moveDown(0.6);
        });
      }

      // Skills Section
      if (resumeData.skills && resumeData.skills.length > 0) {
        renderSectionHeader('SKILLS');
        doc.font('Helvetica').fontSize(9.5).text(resumeData.skills.join(', '), { lineGap: 3.5 });
      }

      // Education Section
      if (resumeData.education && resumeData.education.length > 0) {
        renderSectionHeader('EDUCATION');
        resumeData.education.forEach(edu => {
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(edu.degree, { continued: true });
          doc.font('Helvetica').text(` — ${edu.school || ''}`, { continued: true });
          doc.text(` (${edu.year || ''})`, { align: 'right' });
          doc.moveDown(0.4);
        });
      }
    }

    doc.end();

    // 2. Save export record to database log
    await Export.create({
      userId,
      templateName,
      exportType: 'pdf',
      fileName
    });

  } catch (error) {
    next(error);
  }
};

// POST /api/export/docx
export const exportDocx = async (req, res, next) => {
  try {
    const { template, resumeData } = req.body;
    const userId = req.user.id;

    if (!resumeData || !resumeData.name) {
      return res.status(400).json({
        success: false,
        error: 'Resume dataset with personal information is required.'
      });
    }

    const templateName = template || 'ats';
    const cleanName = sanitizeFilename(resumeData.name);
    const fileName = `resume_${cleanName}_${templateName}.docx`;

    // 1. Build document sections based on template using DOCX package
    const children = [];

    // Header layout
    if (templateName === 'ats') {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: resumeData.name, bold: true, size: 32 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `${resumeData.email || ''}  |  ${resumeData.phone || ''}  |  ${resumeData.location || ''} ${resumeData.links ? '  |  ' + resumeData.links : ''}`,
              size: 19
            })
          ]
        }),
        new Paragraph({ text: '' }) // blank line spacing
      );
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: resumeData.name, bold: true, size: 36, color: templateName === 'modern' ? '581C87' : '0F172A' })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${resumeData.email || ''}  |  ${resumeData.phone || ''}  |  ${resumeData.location || ''} ${resumeData.links ? '  |  ' + resumeData.links : ''}`,
              size: 18,
              color: '475569'
            })
          ]
        }),
        new Paragraph({ text: '' })
      );
    }

    // Helper: Add section heading text
    const addSectionHeader = (title) => {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 24,
              color: templateName === 'modern' ? '581C87' : '000000',
              allCaps: true
            })
          ]
        })
      );
    };

    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      addSectionHeader('WORK EXPERIENCE');
      resumeData.experience.forEach(exp => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.role, bold: true, size: 20 }),
              new TextRun({ text: ` — ${exp.company || ''} (${exp.duration || ''})`, size: 20 })
            ]
          })
        );

        const bullets = exp.description ? exp.description.split('\n') : [];
        bullets.forEach(bullet => {
          if (bullet.trim()) {
            const cleanBullet = bullet.trim().replace(/^[\u2022\-\*\s]+/, '');
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({ text: cleanBullet, size: 19 })
                ]
              })
            );
          }
        });
        children.push(new Paragraph({ text: '' }));
      });
    }

    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      addSectionHeader('PROJECTS');
      resumeData.projects.forEach(proj => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: proj.title, bold: true, size: 20 })
            ]
          })
        );
        if (proj.technologies && proj.technologies.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `Technologies: ${proj.technologies.join(', ')}`, italics: true, size: 18, color: '581C87' })
              ]
            })
          );
        }

        const bullets = proj.description ? proj.description.split('\n') : [];
        bullets.forEach(bullet => {
          if (bullet.trim()) {
            const cleanBullet = bullet.trim().replace(/^[\u2022\-\*\s]+/, '');
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({ text: cleanBullet, size: 19 })
                ]
              })
            );
          }
        });
        children.push(new Paragraph({ text: '' }));
      });
    }

    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      addSectionHeader('SKILLS & CORE COMPETENCIES');
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: resumeData.skills.join(', '), size: 19 })
          ]
        }),
        new Paragraph({ text: '' })
      );
    }

    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      addSectionHeader('EDUCATION');
      resumeData.education.forEach(edu => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.degree, bold: true, size: 20 }),
              new TextRun({ text: ` — ${edu.school || ''} (${edu.year || ''})`, size: 20 })
            ]
          })
        );
      });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children
        }
      ]
    });

    // 2. Generate Buffer & stream response
    const buffer = await Packer.toBuffer(doc);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);

    // 3. Save export record to database log
    await Export.create({
      userId,
      templateName,
      exportType: 'docx',
      fileName
    });

  } catch (error) {
    next(error);
  }
};
