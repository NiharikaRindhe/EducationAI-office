import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';

interface AdmitCardData {
  studentName: string;
  rollNumber: string | null;
  classNum: number;
  section: string;
  examTitle: string;
  subject: string;
  durationMin: number;
  schoolName: string;
  examId: string;
  studentId: string;
}

async function renderAdmitCardPdf(data: AdmitCardData): Promise<Buffer> {
  const qrPayload = JSON.stringify({ examId: data.examId, studentId: data.studentId });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 150 });
  const qrImage = Buffer.from(qrDataUrl.split(',')[1] ?? '', 'base64');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).font('Helvetica-Bold').text(data.schoolName, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica').text('ADMIT CARD', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica-Bold').text('Student:', { continued: true }).font('Helvetica').text(` ${data.studentName}`);
    doc.font('Helvetica-Bold').text('Class:', { continued: true }).font('Helvetica').text(` ${data.classNum}-${data.section}`);
    if (data.rollNumber) doc.font('Helvetica-Bold').text('Roll No:', { continued: true }).font('Helvetica').text(` ${data.rollNumber}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Exam:', { continued: true }).font('Helvetica').text(` ${data.examTitle}`);
    doc.font('Helvetica-Bold').text('Subject:', { continued: true }).font('Helvetica').text(` ${data.subject}`);
    doc.font('Helvetica-Bold').text('Duration:', { continued: true }).font('Helvetica').text(` ${data.durationMin} minutes`);

    doc.moveDown(1);
    doc.image(qrImage, { fit: [100, 100], align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('gray').text('Present this admit card to your invigilator.', { align: 'center' });

    doc.end();
  });
}

async function loadAdmitCardData(examId: string, studentId: string): Promise<AdmitCardData> {
  const { data: exam, error: examError } = await supabaseAdmin
    .from('exams')
    .select('title, subject, duration_min, school_id, schools(name)')
    .eq('id', examId)
    .single();
  if (examError || !exam) throw new ApiError('NOT_FOUND', 'Exam not found');

  const { data: student, error: studentError } = await supabaseAdmin
    .from('user_profiles')
    .select('full_name, student_profiles(class_num, section, roll_number)')
    .eq('id', studentId)
    .single();
  if (studentError || !student) throw new ApiError('NOT_FOUND', 'Student not found');

  const sp = Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles;
  const school = Array.isArray(exam.schools) ? exam.schools[0] : exam.schools;
  if (!sp) throw new ApiError('NOT_FOUND', 'Student profile not found');

  return {
    studentName: student.full_name,
    rollNumber: sp.roll_number,
    classNum: sp.class_num,
    section: sp.section,
    examTitle: exam.title,
    subject: exam.subject,
    durationMin: exam.duration_min,
    schoolName: school?.name ?? 'EduAI School',
    examId,
    studentId,
  };
}

export async function generateOneAdmitCard(examId: string, studentId: string): Promise<Buffer> {
  const data = await loadAdmitCardData(examId, studentId);
  return renderAdmitCardPdf(data);
}

/** Bulk download for a teacher — one PDF per assigned student, zipped. */
export async function generateAllAdmitCards(teacherId: string, examId: string): Promise<Buffer> {
  const { data: exam } = await supabaseAdmin.from('exams').select('id').eq('id', examId).eq('created_by', teacherId).single();
  if (!exam) throw new ApiError('NOT_FOUND', 'Exam not found or not yours');

  // exam_assignments.student_id FKs to student_profiles(user_id), not
  // directly to user_profiles — nest through the real FK chain.
  const { data: assignments, error } = await supabaseAdmin
    .from('exam_assignments')
    .select('student_id, student_profiles(user_profiles(full_name))')
    .eq('exam_id', examId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to load exam assignments', error.message);
  if (!assignments || assignments.length === 0) throw new ApiError('NOT_FOUND', 'No students assigned to this exam');

  const zip = new JSZip();
  for (const a of assignments) {
    const pdf = await generateOneAdmitCard(examId, a.student_id);
    const sp = Array.isArray(a.student_profiles) ? a.student_profiles[0] : a.student_profiles;
    const up = sp?.user_profiles && (Array.isArray(sp.user_profiles) ? sp.user_profiles[0] : sp.user_profiles);
    const safeName = (up?.full_name ?? a.student_id).replace(/[^a-z0-9]+/gi, '_');
    zip.file(`${safeName}.pdf`, pdf);
  }

  return zip.generateAsync({ type: 'nodebuffer' });
}
